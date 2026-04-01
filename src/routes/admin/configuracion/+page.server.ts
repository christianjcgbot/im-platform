import type { PageServerLoad, Actions } from './$types';
import { createServiceClient } from '$lib/server/supabase';
import { fail } from '@sveltejs/kit';

type StoreSettings   = { name: string; email: string; phone: string; address: string };
type ShippingSettings = { free_threshold: number; cost: number; days: number };
type ColorEntry      = { name: string; hex: string };

const DEFAULTS = {
	store:    { name: 'IM Sportswear', email: 'hola@imsportswear.cl', phone: '', address: '' } satisfies StoreSettings,
	shipping: { free_threshold: 50000, cost: 4990, days: 5 } satisfies ShippingSettings,
	sizes:    ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'] as string[],
	colors:   [
		{ name: 'Negro',  hex: '#141414' },
		{ name: 'Navy',   hex: '#18293d' },
		{ name: 'Blanco', hex: '#e8e5e0' },
		{ name: 'Burdeo', hex: '#6b1f2a' },
		{ name: 'Gris',   hex: '#9ca3af' },
		{ name: 'Rojo',   hex: '#dc2626' },
		{ name: 'Azul',   hex: '#3b82f6' },
		{ name: 'Verde',  hex: '#22c55e' },
		{ name: 'Beige',  hex: '#d4c4a8' },
	] as ColorEntry[],
};

export const load: PageServerLoad = async () => {
	const db = createServiceClient();
	const { data: rows } = await db.from('settings').select('key, value');

	const map: Record<string, unknown> = Object.fromEntries(
		(rows ?? []).map(r => [r.key, r.value])
	);

	return {
		store:    (map.store    as StoreSettings)   ?? DEFAULTS.store,
		shipping: (map.shipping as ShippingSettings) ?? DEFAULTS.shipping,
		sizes:    (map.sizes    as string[])        ?? DEFAULTS.sizes,
		colors:   (map.colors   as ColorEntry[])    ?? DEFAULTS.colors,
	};
};

export const actions: Actions = {
	save_store: async ({ request }) => {
		const db = createServiceClient();
		const fd = await request.formData();

		const value: StoreSettings = {
			name:    fd.get('name')?.toString().trim()    ?? '',
			email:   fd.get('email')?.toString().trim()   ?? '',
			phone:   fd.get('phone')?.toString().trim()   ?? '',
			address: fd.get('address')?.toString().trim() ?? '',
		};

		if (!value.name) return fail(400, { section: 'store', error: 'El nombre es obligatorio.' });

		const { error } = await db.from('settings').upsert({ key: 'store', value });
		if (error) return fail(500, { section: 'store', error: error.message });
		return { section: 'store', success: true };
	},

	save_shipping: async ({ request }) => {
		const db = createServiceClient();
		const fd = await request.formData();

		const free_threshold = Number(fd.get('free_threshold'));
		const cost           = Number(fd.get('cost'));
		const days           = Number(fd.get('days'));

		if (isNaN(free_threshold) || isNaN(cost) || isNaN(days)) {
			return fail(400, { section: 'shipping', error: 'Valores numéricos inválidos.' });
		}

		const value: ShippingSettings = { free_threshold, cost, days };
		const { error } = await db.from('settings').upsert({ key: 'shipping', value });
		if (error) return fail(500, { section: 'shipping', error: error.message });
		return { section: 'shipping', success: true };
	},

	save_sizes: async ({ request }) => {
		const db = createServiceClient();
		const fd = await request.formData();
		const raw = fd.get('sizes')?.toString() ?? '[]';

		let sizes: string[];
		try {
			sizes = JSON.parse(raw);
			if (!Array.isArray(sizes) || sizes.some(s => typeof s !== 'string')) throw new Error();
		} catch {
			return fail(400, { section: 'sizes', error: 'Formato de tallas inválido.' });
		}

		const { error } = await db.from('settings').upsert({ key: 'sizes', value: sizes });
		if (error) return fail(500, { section: 'sizes', error: error.message });
		return { section: 'sizes', success: true };
	},

	save_colors: async ({ request }) => {
		const db = createServiceClient();
		const fd = await request.formData();
		const raw = fd.get('colors')?.toString() ?? '[]';

		let colors: ColorEntry[];
		try {
			colors = JSON.parse(raw);
			if (!Array.isArray(colors) || colors.some(c => !c.name || !c.hex)) throw new Error();
		} catch {
			return fail(400, { section: 'colors', error: 'Formato de colores inválido.' });
		}

		const { error } = await db.from('settings').upsert({ key: 'colors', value: colors });
		if (error) return fail(500, { section: 'colors', error: error.message });
		return { section: 'colors', success: true };
	},
};
