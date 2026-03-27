import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: categories } = await locals.supabase
		.from('categories')
		.select('id, name, parent_id')
		.order('name');
	return { categories: categories ?? [] };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();

		const name = (form.get('name') as string)?.trim();
		const subtitle = (form.get('subtitle') as string)?.trim();
		const description = (form.get('description') as string)?.trim();
		const category_id = form.get('category_id') as string || null;
		const price = parseInt(form.get('price') as string);
		const compare_price = form.get('compare_price') ? parseInt(form.get('compare_price') as string) : null;
		const cost = form.get('cost') ? parseInt(form.get('cost') as string) : null;
		const sku = (form.get('sku') as string)?.trim() || null;
		const status = form.get('status') as string ?? 'draft';
		const featured = form.get('featured') === 'on';

		if (!name) return fail(400, { error: 'El nombre es requerido.' });
		if (!price || isNaN(price)) return fail(400, { error: 'El precio es requerido.' });

		const { data: product, error } = await locals.supabase
			.from('products')
			.insert({ name, subtitle, description, category_id, price, compare_price, cost, sku, status, featured })
			.select()
			.single();

		if (error) return fail(500, { error: 'Error al crear el producto.' });

		// Procesar variantes (formato: variants[0][color], variants[0][size], variants[0][stock])
		const variantsRaw: Record<string, Record<string, string>> = {};
		for (const [key, value] of form.entries()) {
			const match = key.match(/^variants\[(\d+)\]\[(\w+)\]$/);
			if (match) {
				const [, idx, field] = match;
				if (!variantsRaw[idx]) variantsRaw[idx] = {};
				variantsRaw[idx][field] = value as string;
			}
		}

		const variants = Object.values(variantsRaw)
			.filter(v => v.color && v.size)
			.map(v => ({ product_id: product.id, color: v.color, size: v.size, stock: parseInt(v.stock ?? '0') }));

		if (variants.length > 0) {
			await locals.supabase.from('product_variants').insert(variants);
		}

		throw redirect(303, '/admin/productos');
	}
};
