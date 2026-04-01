import type { PageServerLoad, Actions } from './$types';
import { createServiceClient } from '$lib/server/supabase';
import { fail } from '@sveltejs/kit';
import { SUMUP_API_KEY, SUMUP_MERCHANT_CODE } from '$env/static/private';
import { PUBLIC_SITE_URL } from '$env/static/public';
import { sendEmail, buildOrderEmail } from '$lib/server/email';

type CartItem = {
	variantId:   string;
	productId:   string;
	productName: string;
	slug:        string;
	color:       string;
	size:        string;
	price:       number;
	imageUrl:    string | null;
	quantity:    number;
};

export const load: PageServerLoad = async () => {
	const db = createServiceClient();
	const { data: row } = await db
		.from('settings')
		.select('value')
		.eq('key', 'shipping')
		.single();

	const shipping = (row?.value as { free_threshold: number; cost: number; days: number } | null)
		?? { free_threshold: 50000, cost: 4990, days: 5 };

	return { shipping };
};

export const actions: Actions = {
	create_order: async ({ request }) => {
		const db = createServiceClient();
		const fd = await request.formData();

		// ── Validar datos del cliente ──
		const name   = fd.get('name')?.toString().trim()   ?? '';
		const email  = fd.get('email')?.toString().trim()  ?? '';
		const phone  = fd.get('phone')?.toString().trim()  ?? '';
		const street = fd.get('street')?.toString().trim() ?? '';
		const city   = fd.get('city')?.toString().trim()   ?? '';
		const region = fd.get('region')?.toString().trim() ?? '';
		const notes  = fd.get('notes')?.toString().trim()  ?? '';

		console.log('checkout form data:', { name, email, phone, street, city, region });

		if (!name || !email || !phone || !street || !city || !region) {
			return fail(400, { error: 'Completa todos los campos obligatorios.' });
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { error: 'Ingresa un email válido.' });
		}

		// ── Parsear y validar carrito ──
		let items: CartItem[];
		try {
			items = JSON.parse(fd.get('cart')?.toString() ?? '[]');
			if (!Array.isArray(items) || items.length === 0) throw new Error();
		} catch {
			return fail(400, { error: 'El carrito está vacío o es inválido.' });
		}

		// ── Verificar stock en DB (fuente de verdad) ──
		const variantIds = [...new Set(items.map(i => i.variantId))];
		const { data: dbVariants, error: variantsErr } = await db
			.from('product_variants')
			.select('id, stock, color, size')
			.in('id', variantIds);

		if (variantsErr || !dbVariants) {
			return fail(500, { error: 'Error verificando el stock. Intenta de nuevo.' });
		}

		for (const item of items) {
			const v = dbVariants.find(v => v.id === item.variantId);
			if (!v) {
				return fail(409, { error: `Producto no encontrado: ${item.productName}.` });
			}
			if (v.stock < item.quantity) {
				return fail(409, {
					error: `Sin stock suficiente para ${item.productName} (${item.color} / ${item.size}). Disponible: ${v.stock}.`
				});
			}
		}

		// ── Calcular totales ──
		const { data: shippingRow } = await db
			.from('settings')
			.select('value')
			.eq('key', 'shipping')
			.single();
		const shippingCfg = (shippingRow?.value as { free_threshold: number; cost: number } | null)
			?? { free_threshold: 50000, cost: 4990 };

		const subtotal     = items.reduce((n, i) => n + i.price * i.quantity, 0);
		const shippingCost = subtotal >= shippingCfg.free_threshold ? 0 : shippingCfg.cost;
		const total        = subtotal + shippingCost;
		const iva          = Math.round(subtotal * 19 / 119);

		// ── Siguiente número de orden ──
		const { data: lastOrder } = await db
			.from('orders')
			.select('order_number')
			.order('order_number', { ascending: false })
			.limit(1)
			.maybeSingle();
		const orderNumber = (lastOrder?.order_number ?? 999) + 1;

		// ── Crear orden (estado pending hasta confirmar pago) ──
		const { data: order, error: orderErr } = await db
			.from('orders')
			.insert({
				order_number:     orderNumber,
				customer_name:    name,
				customer_email:   email,
				customer_phone:   phone || null,
				status:           'created',
				payment_status:   'pending',
				payment_method:   'sumup',
				subtotal,
				iva,
				shipping_cost:    shippingCost,
				total,
				shipping_address: { street, city, region, country: 'Chile' },
				notes:            notes || null,
			})
			.select('id')
			.single();

		if (orderErr || !order) {
			return fail(500, { error: 'Error creando la orden. Intenta de nuevo.' });
		}

		// ── Crear items de la orden ──
		const { error: itemsErr } = await db.from('order_items').insert(
			items.map(i => ({
				order_id:      order.id,
				product_id:    i.productId,
				variant_id:    i.variantId,
				product_name:  i.productName,
				product_image: i.imageUrl ?? null,
				color:         i.color,
				size:          i.size,
				unit_price:    i.price,
				quantity:      i.quantity,
				total:         i.price * i.quantity,
			}))
		);

		if (itemsErr) {
			console.error('order_items error:', JSON.stringify(itemsErr));
			await db.from('orders').delete().eq('id', order.id);
			return fail(500, { error: `Error guardando productos: ${itemsErr.message} (code: ${itemsErr.code})` });
		}

		// ── Email de confirmación al cliente (pedido recibido) ──
		try {
			const addrStr = `${street}, ${city}, ${region}`;
			const { subject, html } = buildOrderEmail({
				orderNumber:     orderNumber,
				customerName:    name,
				status:          'created',
				items:           items.map(i => ({
					product_name: i.productName,
					color:        i.color,
					size:         i.size,
					quantity:     i.quantity,
					total:        i.price * i.quantity,
				})),
				subtotal,
				iva,
				shippingCost,
				total,
				shippingAddress: addrStr,
			});
			await sendEmail(email, name, subject, html);
		} catch (err) {
			console.error('checkout email error:', JSON.stringify(err));
		}

		// ── Crear checkout en SumUp ──
		if (!SUMUP_API_KEY || !SUMUP_MERCHANT_CODE) {
			// Modo desarrollo sin SumUp configurado → ir directo a página de éxito
			return { devMode: true, orderId: order.id, orderNumber };
		}

		const sumupBody = {
			checkout_reference: order.id,
			amount:             total,
			currency:           'CLP',
			merchant_code:      SUMUP_MERCHANT_CODE,
			description:        `IM Sportswear — Pedido #${orderNumber}`,
			redirect_url:       `${PUBLIC_SITE_URL}/checkout/exito?ref=${order.id}`,
		};

		let sumupRes: Response;
		try {
			sumupRes = await fetch('https://api.sumup.com/v0.1/checkouts', {
				method:  'POST',
				headers: {
					'Authorization': `Bearer ${SUMUP_API_KEY}`,
					'Content-Type':  'application/json',
				},
				body: JSON.stringify(sumupBody),
			});
		} catch {
			await db.from('orders').delete().eq('id', order.id);
			return fail(502, { error: 'No se pudo conectar con el proveedor de pago.' });
		}

		if (!sumupRes.ok) {
			const detail = await sumupRes.text().catch(() => '');
			console.error('SumUp error:', sumupRes.status, detail);
			await db.from('orders').delete().eq('id', order.id);
			return fail(502, { error: 'Error iniciando el pago. Intenta de nuevo.' });
		}

		const sumupData = await sumupRes.json();
		console.log('SumUp response:', JSON.stringify(sumupData));
		const checkoutId: string = sumupData.id;

		if (!checkoutId) {
			console.error('SumUp no devolvió checkout ID:', sumupData);
			await db.from('orders').delete().eq('id', order.id);
			return fail(502, { error: 'Error iniciando el pago: respuesta inesperada de SumUp.' });
		}

		// Guardar checkout id para reconciliar en el webhook
		await db.from('orders').update({ sumup_checkout_id: checkoutId }).eq('id', order.id);

		// Retornar checkoutId para montar el widget en el cliente
		return { checkoutId, orderId: order.id };
	},
};
