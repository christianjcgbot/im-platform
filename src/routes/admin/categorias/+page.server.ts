import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: categories } = await locals.supabase
		.from('categories')
		.select('id, name, slug, parent_id, position')
		.order('name');
	return { categories: categories ?? [] };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const name = (form.get('name') as string)?.trim();
		const parent_id = form.get('parent_id') as string || null;

		if (!name) return fail(400, { error: 'El nombre es requerido.' });

		const slug = name.toLowerCase()
			.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

		const { error } = await locals.supabase
			.from('categories')
			.insert({ name, slug, parent_id });

		if (error) return fail(500, { error: 'Error al crear la categoría.' });
		return { success: true };
	},

	update: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id') as string;
		const name = (form.get('name') as string)?.trim();
		const parent_id = form.get('parent_id') as string || null;

		if (!name) return fail(400, { error: 'El nombre es requerido.' });

		const slug = name.toLowerCase()
			.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

		const { error } = await locals.supabase
			.from('categories')
			.update({ name, slug, parent_id })
			.eq('id', id);

		if (error) return fail(500, { error: 'Error al actualizar.' });
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id') as string;

		// Reasignar subcategorías al root antes de eliminar
		await locals.supabase
			.from('categories')
			.update({ parent_id: null })
			.eq('parent_id', id);

		const { error } = await locals.supabase
			.from('categories')
			.delete()
			.eq('id', id);

		if (error) return fail(500, { error: 'Error al eliminar.' });
		return { success: true };
	}
};
