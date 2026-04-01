import { fail, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { sendEmail, buildOrderEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ params, locals }) => {
	const [{ data: order }, { data: items }, { data: history }] = await Promise.all([
		locals.supabase.from('orders').select('*').eq('id', params.id).single(),
		locals.supabase.from('order_items').select('*').eq('order_id', params.id),
		locals.supabase.from('order_history').select('*').eq('order_id', params.id).order('created_at', { ascending: false })
	]);

	if (!order) throw error(404, 'Pedido no encontrado');

	return { order, items: items ?? [], history: history ?? [] };
};

export const actions: Actions = {
	update_status: async ({ request, params, locals }) => {
		const form = await request.formData();
		const status = form.get('status') as string;
		const comment = (form.get('comment') as string)?.trim() || null;

		const STATUS_LABELS: Record<string, string> = {
			created: 'Creado', preparing: 'En preparación',
			shipped: 'Despachado', delivered: 'Entregado', cancelled: 'Cancelado',
		};

		// Obtener pedido + items para el email
		const { data: order } = await locals.supabase
			.from('orders').select('*').eq('id', params.id).single();
		const { data: items } = await locals.supabase
			.from('order_items').select('*').eq('order_id', params.id);

		const { error: err } = await locals.supabase
			.from('orders')
			.update({ status, updated_at: new Date().toISOString() })
			.eq('id', params.id);

		if (err) return fail(500, { error: 'Error al actualizar estado.' });

		// Historial
		await locals.supabase.from('order_history').insert({
			order_id: params.id,
			status,
			comment: comment ?? `Estado cambiado a ${STATUS_LABELS[status] ?? status}`
		});

		// Email de notificación al cliente
		if (order) {
			try {
				const { subject, html } = buildOrderEmail({
					orderNumber: order.order_number,
					customerName: order.customer_name,
					status,
					items: items ?? [],
					subtotal: order.subtotal,
					iva: order.iva,
					shippingCost: order.shipping_cost,
					total: order.total,
					trackingId: order.tracking_id,
					shippingProvider: order.shipping_provider,
				});
				await sendEmail(order.customer_email, order.customer_name, subject, html);
			} catch (e) {
				console.error('Error enviando email:', e);
				// No bloqueamos si falla el email
			}
		}

		return { success: true };
	},

	update_shipping: async ({ request, params, locals }) => {
		const form = await request.formData();
		const shipping_provider = form.get('shipping_provider') as string || null;
		const tracking_id = (form.get('tracking_id') as string)?.trim() || null;

		const { error: err } = await locals.supabase
			.from('orders')
			.update({ shipping_provider, tracking_id, updated_at: new Date().toISOString() })
			.eq('id', params.id);

		if (err) return fail(500, { error: 'Error al guardar despacho.' });

		if (tracking_id) {
			await locals.supabase.from('order_history').insert({
				order_id: params.id,
				comment: `Tracking asignado: ${(shipping_provider ?? '').toUpperCase()} — ${tracking_id}`
			});
		}

		return { success: true };
	},

	add_comment: async ({ request, params, locals }) => {
		const form = await request.formData();
		const comment = (form.get('comment') as string)?.trim();
		if (!comment) return fail(400, { error: 'El comentario no puede estar vacío.' });

		await locals.supabase.from('order_history').insert({
			order_id: params.id,
			comment
		});

		return { success: true };
	}
};
