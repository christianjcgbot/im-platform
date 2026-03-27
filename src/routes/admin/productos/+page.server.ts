import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: products } = await locals.supabase
		.from('products')
		.select(`
			id, name, subtitle, price, status, featured, created_at,
			product_images(url, position),
			product_variants(stock)
		`)
		.order('created_at', { ascending: false });

	return {
		products: (products ?? []).map((p: any) => ({
			...p,
			totalStock: p.product_variants?.reduce((sum: number, v: any) => sum + (v.stock ?? 0), 0) ?? 0,
			image: p.product_images?.sort((a: any, b: any) => a.position - b.position)[0]?.url ?? null
		}))
	};
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		await locals.supabase.from('products').update({ status: 'archived' }).eq('id', id);
		throw redirect(303, '/admin/productos');
	}
};
