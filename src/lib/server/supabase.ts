import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_KEY } from '$env/static/private';
import type { Cookies } from '@sveltejs/kit';

export function createSupabaseServerClient(cookies: Cookies) {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => cookies.set(name, value, { ...options, path: '/' }));
			}
		}
	});
}

// Client con service key para queries públicas del shop (server-side only, nunca llega al browser)
export function createServiceClient() {
	return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY);
}
