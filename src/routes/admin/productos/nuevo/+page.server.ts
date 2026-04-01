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
		const slug = (form.get('slug') as string)?.trim() || null;
		const meta_description = (form.get('meta_description') as string)?.trim() || null;

		if (!name) return fail(400, { error: 'El nombre es requerido.' });
		if (!price || isNaN(price)) return fail(400, { error: 'El precio es requerido.' });

		const { data: product, error } = await locals.supabase
			.from('products')
			.insert({ name, subtitle, description, category_id, price, compare_price, cost, sku, status, featured, slug, meta_description })
			.select()
			.single();

		if (error) return fail(500, { error: 'Error al crear el producto.' });

		// Variantes
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

		// Fotos — subirlas en el mismo paso
		const files = form.getAll('images') as File[];
		const validFiles = files.filter(f => f && f.size > 0 && f.size <= 5 * 1024 * 1024);
		let position = 0;
		for (const file of validFiles) {
			const ext = file.name.split('.').pop();
			const path = `products/${product.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
			const buffer = await file.arrayBuffer();
			const { error: uploadErr } = await locals.supabase.storage
				.from('product-images')
				.upload(path, buffer, { contentType: file.type, upsert: false });
			if (uploadErr) continue;
			const { data: { publicUrl } } = locals.supabase.storage
				.from('product-images')
				.getPublicUrl(path);
			await locals.supabase.from('product_images').insert({
				product_id: product.id,
				url: publicUrl,
				position: position++,
			});
		}

		throw redirect(303, `/admin/productos/${product.id}`);
	},

	create_category: async ({ request, locals }) => {
		const form = await request.formData();
		const name = (form.get('name') as string)?.trim();
		if (!name) return fail(400, { error: 'El nombre es requerido.' });
		const { data: category, error } = await locals.supabase
			.from('categories')
			.insert({ name, slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })
			.select('id, name, parent_id')
			.single();
		if (error) return fail(500, { error: 'Error al crear la categoría.' });
		return { category };
	}
};
