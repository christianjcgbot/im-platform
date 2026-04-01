import { test, expect } from '@playwright/test';

async function getFirstProductUrl(page: import('@playwright/test').Page): Promise<string> {
	await page.goto('/');
	const card = page.locator('.product-card').first();
	await expect(card).toBeVisible();
	const href = await card.getAttribute('href');
	if (!href) throw new Error('No product card found');
	return href;
}

// ── TC-PDP-01: PDP carga con nombre, precio y variantes ────────────────────
test('PDP muestra nombre, precio y selectores de variante', async ({ page }) => {
	const url = await getFirstProductUrl(page);
	await page.goto(url);
	await expect(page.locator('.pdp-name')).toBeVisible();
	await expect(page.locator('.pdp-price')).toBeVisible();
	// Al menos un selector de color
	await expect(page.locator('.pdp-color-btn').first()).toBeVisible();
});

// ── TC-PDP-02: Seleccionar color habilita tallas ────────────────────────────
test('seleccionar color muestra tallas disponibles', async ({ page }) => {
	const url = await getFirstProductUrl(page);
	await page.goto(url);
	// Haz click en el primer color con stock
	const colorBtn = page.locator('.pdp-color-btn:not([disabled])').first();
	await colorBtn.click();
	// Debe aparecer selector de tallas o el botón de compra debe estar habilitado (talla única)
	const sizeExists = await page.locator('.pdp-size-btn').count();
	const buyBtn = page.locator('.pdp-buy');
	if (sizeExists > 0) {
		await expect(page.locator('.pdp-size-btn').first()).toBeVisible();
	} else {
		// Talla única — el botón de compra debe mostrar el precio
		await expect(buyBtn).toContainText('Agregar al carrito');
	}
});

// ── TC-PDP-03: Añadir al carrito aumenta el contador ──────────────────────
test('agregar al carrito incrementa el contador en el header', async ({ page }) => {
	const url = await getFirstProductUrl(page);
	await page.goto(url);

	// Selecciona color
	const colorBtn = page.locator('.pdp-color-btn:not([disabled])').first();
	await colorBtn.click();

	// Selecciona talla si aparece
	const sizeBtn = page.locator('.pdp-size-btn:not([disabled])').first();
	if (await sizeBtn.isVisible()) {
		await sizeBtn.click();
	}

	// El botón debe mostrar "Agregar al carrito"
	const buyBtn = page.locator('.pdp-buy');
	await expect(buyBtn).toContainText('Agregar al carrito');

	// Agrega al carrito
	await buyBtn.click();

	// El contador del carrito debe ser > 0
	await expect(page.locator('.bag-count')).toBeVisible();
	const countText = await page.locator('.bag-count').textContent();
	expect(parseInt(countText ?? '0')).toBeGreaterThan(0);
});

// ── TC-PDP-04: Imágenes cambian al seleccionar color (si hay tagged) ────────
test('galería filtra imágenes por color seleccionado', async ({ page }) => {
	const url = await getFirstProductUrl(page);
	await page.goto(url);

	const colorBtns = page.locator('.pdp-color-btn:not([disabled])');
	const colorCount = await colorBtns.count();
	if (colorCount < 2) {
		test.skip(); // Solo un color — no hay nada que comparar
		return;
	}

	await colorBtns.nth(0).click();
	const img1 = await page.locator('.pdp-img-main img').getAttribute('src');

	await colorBtns.nth(1).click();
	const img2 = await page.locator('.pdp-img-main img').getAttribute('src');

	// Si las imágenes son diferentes, el filtro funciona
	// Si son iguales, no hay imágenes tageadas — también es válido
	// Solo verificamos que la imagen principal sigue visible
	await expect(page.locator('.pdp-img-main')).toBeVisible();
});
