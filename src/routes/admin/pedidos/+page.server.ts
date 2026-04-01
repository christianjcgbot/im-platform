import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const status = url.searchParams.get('status') || 'all';

	let query = locals.supabase
		.from('orders')
		.select('id, order_number, customer_name, customer_email, total, status, payment_status, created_at')
		.order('created_at', { ascending: false });

	if (status !== 'all') query = query.eq('status', status);

	const { data: orders } = await query;

	// Contadores por estado
	const { data: counts } = await locals.supabase
		.from('orders')
		.select('status');

	const statusCount: Record<string, number> = {};
	for (const o of counts ?? []) {
		statusCount[o.status] = (statusCount[o.status] ?? 0) + 1;
	}

	return { orders: orders ?? [], statusCount, currentStatus: status };
};
