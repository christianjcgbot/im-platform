/* Cart store — Svelte 5 runes */

export type CartItem = {
	variantId: string;
	productId: string;
	productName: string;
	slug: string;
	color: string;
	size: string;
	price: number;
	imageUrl: string | null;
	quantity: number;
};

const STORAGE_KEY = 'im-cart';

function loadFromStorage(): CartItem[] {
	if (typeof window === 'undefined') return [];
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
	} catch {
		return [];
	}
}

function persist(items: CartItem[]) {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
	}
}

let _items = $state<CartItem[]>([]);
let _open = $state(false);

export function initCart() {
	_items = loadFromStorage();
}

export const cart = {
	get items() { return _items; },
	get count() { return _items.reduce((n, i) => n + i.quantity, 0); },
	get total() { return _items.reduce((n, i) => n + i.price * i.quantity, 0); },
	get open() { return _open; },

	show() { _open = true; },
	hide() { _open = false; },
	toggle() { _open = !_open; },

	add(item: Omit<CartItem, 'quantity'>) {
		const existing = _items.find(i => i.variantId === item.variantId);
		if (existing) {
			existing.quantity++;
		} else {
			_items.push({ ...item, quantity: 1 });
		}
		persist(_items);
		_open = true;
	},

	remove(variantId: string) {
		_items = _items.filter(i => i.variantId !== variantId);
		persist(_items);
	},

	update(variantId: string, quantity: number) {
		if (quantity <= 0) {
			_items = _items.filter(i => i.variantId !== variantId);
		} else {
			const item = _items.find(i => i.variantId === variantId);
			if (item) item.quantity = quantity;
		}
		persist(_items);
	},

	clear() {
		_items = [];
		persist(_items);
	}
};

export function clp(n: number) {
	return '$' + (n ?? 0).toLocaleString('es-CL');
}
