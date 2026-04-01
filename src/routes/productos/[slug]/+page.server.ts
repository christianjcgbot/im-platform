import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createServiceClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ params }) => {
	const db = createServiceClient();

	const { data: product } = await db
		.from('products')
		.select('*, categories(id, name, slug)')
		.eq('slug', params.slug)
		.eq('status', 'available')
		.single();

	if (!product) throw error(404, 'Producto no encontrado');

	const [{ data: variants }, { data: images }, { data: categories }] = await Promise.all([
		db.from('product_variants')
			.select('id, color, size, stock, low_stock_threshold')
			.eq('product_id', product.id)
			.order('color')
			.order('size'),
		db.from('product_images')
			.select('id, url, position, color')
			.eq('product_id', product.id)
			.order('position'),
		db.from('categories')
			.select('id, name, slug, parent_id')
			.order('name')
	]);

	return {
		product,
		variants: variants ?? [],
		images: images ?? [],
		categories: categories ?? []
	};
};
