import type { PageServerLoad } from './$types';
import { createServiceClient } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ url }) => {
	const db = createServiceClient();
	const categoria = url.searchParams.get('categoria') || 'all';

	// Categorías
	const { data: categories } = await db
		.from('categories')
		.select('id, name, slug, parent_id')
		.order('name');

	// Query productos disponibles
	let query = db
		.from('products')
		.select('id, name, subtitle, price, compare_price, slug, status, featured, category_id, categories(name, slug)')
		.eq('status', 'available')
		.order('featured', { ascending: false })
		.order('created_at', { ascending: false });

	// Filtrar por categoría
	if (categoria !== 'all') {
		const { data: cat } = await db
			.from('categories')
			.select('id')
			.eq('slug', categoria)
			.single();
		if (cat) {
			// Include subcategories in filter
			const { data: subcats } = await db
				.from('categories')
				.select('id')
				.eq('parent_id', cat.id);
			const catIds = [cat.id, ...(subcats?.map(s => s.id) ?? [])];
			query = query.in('category_id', catIds);
		}
	}

	const { data: products } = await query;

	if (!products || products.length === 0) {
		return { products: [], categories: categories ?? [], currentCategory: categoria };
	}

	const productIds = products.map(p => p.id);

	// Imagen principal por producto
	const { data: images } = await db
		.from('product_images')
		.select('product_id, url, position')
		.in('product_id', productIds)
		.order('position');

	// Colores por producto
	const { data: variants } = await db
		.from('product_variants')
		.select('product_id, color, stock')
		.in('product_id', productIds);

	// Mapas
	const imageByProduct: Record<string, string> = {};
	for (const img of images ?? []) {
		if (!imageByProduct[img.product_id]) imageByProduct[img.product_id] = img.url;
	}

	const colorsByProduct: Record<string, string[]> = {};
	const stockByProduct: Record<string, number> = {};
	for (const v of variants ?? []) {
		if (!colorsByProduct[v.product_id]) colorsByProduct[v.product_id] = [];
		if (!colorsByProduct[v.product_id].includes(v.color)) colorsByProduct[v.product_id].push(v.color);
		stockByProduct[v.product_id] = (stockByProduct[v.product_id] ?? 0) + v.stock;
	}

	return {
		products: products.map(p => ({
			...p,
			imageUrl: imageByProduct[p.id] ?? null,
			colors: colorsByProduct[p.id] ?? [],
			totalStock: stockByProduct[p.id] ?? 0
		})),
		categories: categories ?? [],
		currentCategory: categoria
	};
};
