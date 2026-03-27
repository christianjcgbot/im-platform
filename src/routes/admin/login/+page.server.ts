import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = await locals.safeGetSession();
	if (session) throw redirect(303, '/admin');
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const email = form.get('email') as string;
		const password = form.get('password') as string;

		if (!email || !password) return fail(400, { error: 'Completa todos los campos.' });

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (error) return fail(401, { error: 'Credenciales incorrectas.' });

		throw redirect(303, '/admin');
	}
};
