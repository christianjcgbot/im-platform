import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: variants } = await locals.supabase
		.from('product_variants')
		.select('id, color, size, stock, low_stock_threshold, product_id, products(id, name, status)')
		.order('stock', { ascending: true });

	return { variants: variants ?? [] };
};

export const actions: Actions = {
	update_stock: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		const stock = parseInt(form.get('stock') as string);
		const low_stock_threshold = parseInt(form.get('low_stock_threshold') as string);

		if (isNaN(stock) || stock < 0) return fail(400, { error: 'Stock inválido.' });

		const update: Record<string, number> = { stock };
		if (!isNaN(low_stock_threshold) && low_stock_threshold >= 0) {
			update.low_stock_threshold = low_stock_threshold;
		}

		const { error } = await locals.supabase
			.from('product_variants')
			.update(update)
			.eq('id', id);

		if (error) return fail(500, { error: 'Error al actualizar stock.' });
		return { success: true };
	}
};
