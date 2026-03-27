import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ count: productCount }, { data: lowStock }] = await Promise.all([
		locals.supabase
			.from('products')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'available'),
		locals.supabase
			.from('product_variants')
			.select('*, products(name)')
			.lte('stock', 2)
			.gt('stock', 0)
			.order('stock')
			.limit(10)
	]);

	return {
		productCount: productCount ?? 0,
		lowStock: (lowStock ?? []).map((v: any) => ({
			...v,
			product_name: v.products?.name ?? 'Producto'
		}))
	};
};
