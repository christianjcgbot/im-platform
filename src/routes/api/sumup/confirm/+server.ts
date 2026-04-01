import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import { SUMUP_API_KEY } from '$env/static/private';
import { sendEmail, buildOrderEmail } from '$lib/server/email';

export const POST: RequestHandler = async ({ request }) => {
	const { checkoutId, orderId } = await request.json();

	if (!checkoutId || !orderId) {
		return json({ ok: false, error: 'Datos inválidos' }, { status: 400 });
	}

	const db = createServiceClient();

	// Verificar con SumUp API que el pago fue exitoso
	let sumupStatus = 'UNKNOWN';
	if (SUMUP_API_KEY) {
		try {
			const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
				headers: { 'Authorization': `Bearer ${SUMUP_API_KEY}` }
			});
			if (res.ok) {
				const data = await res.json();
				sumupStatus = data.status ?? 'UNKNOWN';
			}
		} catch (err) {
			console.error('SumUp verify error:', err);
		}
	} else {
		// Dev mode sin SumUp → asumir pagado
		sumupStatus = 'PAID';
	}

	const isPaid = ['PAID', 'SUCCESSFUL', 'COMPLETED'].includes(sumupStatus);

	if (!isPaid) {
		return json({ ok: false, status: sumupStatus });
	}

	// Verificar que no esté ya procesada
	const { data: order } = await db
		.from('orders')
		.select('id, order_number, customer_name, customer_email, payment_status, subtotal, iva, shipping_cost, total, shipping_address')
		.eq('id', orderId)
		.single();

	if (!order) return json({ ok: false, error: 'Orden no encontrada' }, { status: 404 });
	if (order.payment_status === 'paid') return json({ ok: true, alreadyPaid: true });

	// Actualizar orden
	await db.from('orders')
		.update({ payment_status: 'paid', status: 'preparing' })
		.eq('id', orderId);

	// Historial
	await db.from('order_history').insert({
		order_id: orderId,
		status: 'preparing',
		comment: 'Pago confirmado via SumUp widget'
	});

	// Descontar stock
	const { data: orderItems } = await db
		.from('order_items')
		.select('variant_id, quantity, product_name, color, size, total')
		.eq('order_id', orderId);

	if (orderItems?.length) {
		await Promise.all(
			orderItems.map(item =>
				db.rpc('decrement_stock', { p_variant_id: item.variant_id, p_quantity: item.quantity })
			)
		);
	}

	// Email de pago confirmado
	try {
		const addr = order.shipping_address as Record<string, string> | null;
		const addrStr = addr ? `${addr.street}, ${addr.city}, ${addr.region}` : '';
		const { subject, html } = buildOrderEmail({
			orderNumber:    order.order_number,
			customerName:   order.customer_name,
			status:         'preparing',
			items:          (orderItems ?? []).map(i => ({
				product_name: i.product_name,
				color:        i.color,
				size:         i.size,
				quantity:     i.quantity,
				total:        i.total,
			})),
			subtotal:       order.subtotal,
			iva:            order.iva,
			shippingCost:   order.shipping_cost,
			total:          order.total,
			shippingAddress: addrStr,
		});
		await sendEmail(order.customer_email, order.customer_name, subject, html);
		console.log('Email de pago enviado a', order.customer_email);
	} catch (err) {
		console.error('Error enviando email de pago:', err);
	}

	return json({ ok: true, paid: true });
};
