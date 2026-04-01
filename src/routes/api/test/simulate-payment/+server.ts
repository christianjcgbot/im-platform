import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';
import { PUBLIC_SITE_URL } from '$env/static/public';
import { sendEmail, buildOrderEmail } from '$lib/server/email';

// ⚠️ Solo disponible en entornos no-productivos
export const POST: RequestHandler = async ({ request }) => {
    const isProd = PUBLIC_SITE_URL?.includes('imsportswear.cl') && !PUBLIC_SITE_URL?.includes('localhost');
    if (isProd) {
        return json({ ok: false, error: 'No disponible en producción' }, { status: 403 });
    }

    const { orderId } = await request.json();
    if (!orderId) return json({ ok: false, error: 'orderId requerido' }, { status: 400 });

    const db = createServiceClient();

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
        comment: 'Pago simulado (modo de prueba)'
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
        console.log(`[simulate-payment] Stock decrementado para ${orderItems.length} variantes`);
    }

    // Email
    try {
        const addr = order.shipping_address as Record<string, string> | null;
        const addrStr = addr ? `${addr.street}, ${addr.city}, ${addr.region}` : '';
        const { subject, html } = buildOrderEmail({
            orderNumber: order.order_number,
            customerName: order.customer_name,
            status: 'preparing',
            items: (orderItems ?? []).map(i => ({
                product_name: i.product_name,
                color: i.color,
                size: i.size,
                quantity: i.quantity,
                total: i.total,
            })),
            subtotal: order.subtotal,
            iva: order.iva,
            shippingCost: order.shipping_cost,
            total: order.total,
            shippingAddress: addrStr,
        });
        await sendEmail(order.customer_email, order.customer_name, subject, html);
        console.log('[simulate-payment] Email enviado a', order.customer_email);
    } catch (err) {
        console.error('[simulate-payment] Email error:', err);
    }

    return json({ ok: true, paid: true, simulated: true });
};
