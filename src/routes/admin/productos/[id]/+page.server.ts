import { fail, redirect, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const [{ data: product }, { data: categories }, { data: variants }, { data: images }] = await Promise.all([
		locals.supabase.from('products').select('*').eq('id', params.id).single(),
		locals.supabase.from('categories').select('id, name, parent_id').order('name'),
		locals.supabase.from('product_variants').select('*').eq('product_id', params.id).order('color'),
		locals.supabase.from('product_images').select('*').eq('product_id', params.id).order('position')
	]);

	if (!product) throw error(404, 'Producto no encontrado');

	return { product, categories: categories ?? [], variants: variants ?? [], images: images ?? [] };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
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

		const { error: err } = await locals.supabase
			.from('products')
			.update({ name, subtitle, description, category_id, price, compare_price, cost, sku, status, featured, updated_at: new Date().toISOString() })
			.eq('id', params.id);

		if (err) return fail(500, { error: 'Error al guardar.' });

		// Reemplazar variantes
		await locals.supabase.from('product_variants').delete().eq('product_id', params.id);

		const variantsRaw: Record<string, Record<string, string>> = {};
		for (const [key, value] of form.entries()) {
			const match = key.match(/^variants\[(\d+)\]\[(\w+)\]$/);
			if (match) {
				const [, idx, field] = match;
				if (!variantsRaw[idx]) variantsRaw[idx] = {};
				variantsRaw[idx][field] = value as string;
			}
		}
		const newVariants = Object.values(variantsRaw)
			.filter(v => v.color && v.size)
			.map(v => ({ product_id: params.id, color: v.color, size: v.size, stock: parseInt(v.stock ?? '0') }));

		if (newVariants.length > 0) {
			await locals.supabase.from('product_variants').insert(newVariants);
		}

		throw redirect(303, '/admin/productos');
	},

	upload_image: async ({ request, params, locals }) => {
		const form = await request.formData();
		const files = form.getAll('files') as File[];

		const validFiles = files.filter(f => f && f.size > 0);
		if (validFiles.length === 0) return fail(400, { error: 'No se seleccionó ningún archivo.' });

		const { data: lastImg } = await locals.supabase
			.from('product_images')
			.select('position')
			.eq('product_id', params.id)
			.order('position', { ascending: false })
			.limit(1)
			.single();

		let nextPosition = (lastImg?.position ?? -1) + 1;

		for (const file of validFiles) {
			if (file.size > 5 * 1024 * 1024) continue; // skip >5MB silently

			const ext = file.name.split('.').pop();
			const path = `products/${params.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
			const buffer = await file.arrayBuffer();

			const { error: uploadErr } = await locals.supabase.storage
				.from('product-images')
				.upload(path, buffer, { contentType: file.type, upsert: false });

			if (uploadErr) continue;

			const { data: { publicUrl } } = locals.supabase.storage
				.from('product-images')
				.getPublicUrl(path);

			await locals.supabase.from('product_images').insert({
				product_id: params.id,
				url: publicUrl,
				position: nextPosition++
			});
		}

		return { success: true };
	},

	reorder_images: async ({ request, locals }) => {
		const form = await request.formData();
		const order = (form.get('order') as string).split(',').filter(Boolean);
		for (let i = 0; i < order.length; i++) {
			await locals.supabase.from('product_images').update({ position: i }).eq('id', order[i]);
		}
		return { success: true };
	},

	delete_image: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		await locals.supabase.from('product_images').delete().eq('id', id);
		return { success: true };
	}
};
