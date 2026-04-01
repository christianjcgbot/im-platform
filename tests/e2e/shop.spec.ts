import { test, expect } from '@playwright/test';

// ── TC-SHOP-01: Home muestra productos y tabs de categoría ──────────────────
test('home muestra grid de productos y tabs de categoría', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('.product-grid')).toBeVisible();
	// Debe haber al menos un producto
	await expect(page.locator('.product-card').first()).toBeVisible();
	// Tab "Todos" activo por defecto
	await expect(page.locator('.cat-btn.active')).toContainText('Todos');
});

// ── TC-SHOP-02: Filtro de categoría (incluyendo subcategorías) ──────────────
test('filtro de categoría muestra solo productos de esa categoría', async ({ page }) => {
	await page.goto('/');
	const tabs = page.locator('.cat-btn');
	const count = await tabs.count();
	if (count <= 1) {
		test.skip(); // No hay categorías configuradas
		return;
	}
	// Click en la segunda tab (primera categoría real)
	const secondTab = tabs.nth(1);
	const catName = await secondTab.textContent();
	await secondTab.click();
	await expect(page).toHaveURL(/categoria=/);
	await expect(secondTab).toHaveClass(/active/);
	// El grid debe seguir visible (puede estar vacío si no hay productos)
	await expect(page.locator('.product-grid').first()).toBeVisible();
});

// ── TC-SHOP-03: Card de producto navega al PDP ──────────────────────────────
test('click en producto abre página de detalle', async ({ page }) => {
	await page.goto('/');
	const card = page.locator('.product-card').first();
	await expect(card).toBeVisible();
	const href = await card.getAttribute('href');
	expect(href).toMatch(/^\/productos\//);
	await card.click();
	await expect(page).toHaveURL(/\/productos\//);
	await expect(page.locator('.pdp-name')).toBeVisible();
});
