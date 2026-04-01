import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import { sendEmail, buildOrderEmail } from '$lib/server/email';
import { SUMUP_WEBHOOK_SECRET } from '$env/static/private';
import { createHmac, timingSafeEqual } from 'crypto';

// ── Verificar firma HMAC-SHA256 de SumUp ──
function verifySignature(rawBody: string, signature: string | null): boolean {
	if (!SUMUP_WEBHOOK_SECRET || !signature) return !SUMUP_WEBHOOK_SECRET; // si no hay secret configurado, skip
	const expected = 'sha256=' + createHmac('sha256', SUMUP_WEBHOOK_SECRET)
		.update(rawBody, 'utf8')
		.digest('hex');
	try {
		return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
	} catch {
		return false;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const rawBody = await request.text();
	const signature = request.headers.get('x-sumup-signature') ?? request.headers.get('x-hmac-signature');

	if (!verifySignature(rawBody, signature)) {
		console.warn('SumUp webhook: firma inválida');
		return json({ ok: false, reason: 'invalid_signature' }, { status: 401 });
	}

	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(rawBody);
	} catch {
		return json({ ok: false, reason: 'invalid_json' }, { status: 400 });
	}

	// SumUp puede enviar distintos formatos según la versión del webhook
	const eventType     = (payload.event_type ?? payload.type) as string | undefined;
	const innerPayload  = (payload.payload ?? payload) as Record<string, unknown>;
	const checkoutRef   = innerPayload.checkout_reference as string | undefined;
	const sumupStatus   = (innerPayload.status ?? innerPayload.transaction_status) as string | undefined;
	const checkoutId    = (innerPayload.id ?? innerPayload.checkout_id) as string | undefined;

	if (!checkoutRef) {
		console.warn('SumUp webhook: sin checkout_reference');
		return json({ ok: true, reason: 'no_reference' }); // 200 para que SumUp no reintente
	}

	const db = createServiceClient();

	// Buscar la orden por id (checkout_reference = order.id)
	const { data: order } = await db
		.from('orders')
		.select('id, order_number, customer_name, customer_email, payment_status, total, shipping_address')
		.eq('id', checkoutRef)
		.single();

	if (!order) {
		console.warn('SumUp webhook: orden no encontrada para ref', checkoutRef);
		return json({ ok: true, reason: 'order_not_found' });
	}

	// Sólo procesar si está en pending (evitar duplicados)
	if (order.payment_status !== 'pending') {
		return json({ ok: true, reason: 'already_processed' });
	}

	const isPaid = sumupStatus === 'PAID' || sumupStatus === 'SUCCESSFUL' || sumupStatus === 'COMPLETED';
	const isFailed = sumupStatus === 'FAILED' || sumupStatus === 'CANCELLED';

	const newPaymentStatus = isPaid ? 'paid' : isFailed ? 'failed' : null;
	if (!newPaymentStatus) {
		// Estado intermedio (PENDING, etc.) — ignorar por ahora
		return json({ ok: true, reason: 'intermediate_status', status: sumupStatus });
	}

	// ── Actualizar orden ──
	const updateData: Record<string, unknown> = {
		payment_status: newPaymentStatus,
		...(checkoutId ? { sumup_checkout_id: checkoutId } : {}),
	};
	if (isPaid) updateData.status = 'preparing'; // Mover a preparación automáticamente

	const { error: updateErr } = await db
		.from('orders')
		.update(updateData)
		.eq('id', order.id);

	if (updateErr) {
		console.error('SumUp webhook: error actualizando orden', updateErr);
		return json({ ok: false }, { status: 500 });
	}

	// ── Insertar en historial ──
	await db.from('order_history').insert({
		order_id: order.id,
		status:   newPaymentStatus,
		comment:  isPaid
			? `Pago confirmado por SumUp. Checkout ID: ${checkoutId ?? 'N/A'}`
			: `Pago fallido/cancelado por SumUp. Estado: ${sumupStatus}`,
	});

	if (isPaid) {
		// ── Descontar stock ──
		const { data: orderItems } = await db
			.from('order_items')
			.select('id, variant_id, quantity, product_name, color, size, total')
			.eq('order_id', order.id);

		if (orderItems?.length) {
			await Promise.all(
				orderItems.map(item =>
					db.rpc('decrement_stock', {
						p_variant_id: item.variant_id,
						p_quantity:   item.quantity,
					})
				)
			);
		}

		// ── Enviar email de confirmación ──
		try {
			const addr = order.shipping_address as Record<string, string> | null;
			const addrStr = addr
				? `${addr.street}, ${addr.city}, ${addr.region}`
				: '';
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
				subtotal:       order.total,
				iva:            Math.round(order.total * 19 / 119),
				shippingCost:   0,
				total:          order.total,
				shippingAddress: addrStr,
			});
			await sendEmail(order.customer_email, order.customer_name, subject, html);
		} catch (err) {
			console.error('SumUp webhook: error enviando email', err);
			// No bloquear — la orden ya fue actualizada
		}
	}

	return json({ ok: true, processed: newPaymentStatus });
};
