import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ url }) => {
	const ref = url.searchParams.get('ref');

	if (!ref) throw error(400, 'Referencia de orden inválida.');

	const db = createServiceClient();

	const { data: order } = await db
		.from('orders')
		.select('id, order_number, customer_name, customer_email, status, payment_status, subtotal, iva, shipping_cost, total, shipping_address, created_at')
		.eq('id', ref)
		.single();

	if (!order) throw error(404, 'Orden no encontrada.');

	const { data: items } = await db
		.from('order_items')
		.select('id, product_name, color, size, unit_price, quantity, total, product_image')
		.eq('order_id', order.id);

	return {
		order,
		items: items ?? [],
	};
};
