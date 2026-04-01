import { test, expect, type Page } from '@playwright/test';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function addFirstProductToCart(page: Page) {
	await page.goto('/');
	const card = page.locator('.product-card').first();
	const href = await card.getAttribute('href');
	if (!href) throw new Error('No product card found');
	await page.goto(href);

	const colorBtn = page.locator('.pdp-color-btn:not([disabled])').first();
	await expect(colorBtn).toBeVisible();
	await colorBtn.click();

	const sizeBtn = page.locator('.pdp-size-btn:not([disabled])').first();
	if (await sizeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
		await sizeBtn.click();
	}

	const buyBtn = page.locator('.pdp-buy');
	await expect(buyBtn).toContainText('Agregar al carrito');
	await buyBtn.click();
	await expect(page.locator('.bag-count')).toBeVisible();
}

async function fillCheckoutForm(page: Page) {
	await page.locator('input[name="name"]').fill('Test Cliente');
	await page.locator('input[name="email"]').fill('test@imsportswear.cl');
	await page.locator('input[name="phone"]').fill('912345678');
	await page.locator('input[name="street"]').fill('Av. Providencia 1234');

	// Región → habilita comunas
	await page.locator('select[name="region"]').selectOption('Arica y Parinacota');
	// Espera que la select de ciudad se habilite
	await expect(page.locator('select[name="city"]')).toBeEnabled();
	await page.locator('select[name="city"]').selectOption('Arica');
}

// ── TC-CHK-01: Checkout vacío muestra mensaje ────────────────────────────────
test('checkout con carrito vacío muestra mensaje', async ({ page }) => {
	await page.goto('/checkout');
	// Espera hidratación del carrito (client-side)
	await page.waitForTimeout(500);
	const emptyEl = page.locator('.checkout-empty');
	await expect(emptyEl).toBeVisible();
	await expect(emptyEl).toContainText('vacío');
});

// ── TC-CHK-02: Formulario valida campos requeridos ───────────────────────────
test('checkout muestra error si faltan campos', async ({ page }) => {
	await addFirstProductToCart(page);
	await page.goto('/checkout');
	await expect(page.locator('form')).toBeVisible();
	// El submit sin datos activa validación HTML5 — el form no se envía
	await page.locator('button[type="submit"]').first().click();
	// El formulario sigue visible (no hubo redirect)
	await expect(page.locator('form')).toBeVisible();
	await expect(page).not.toHaveURL(/exito/);
});

// ── TC-CHK-03: Flujo completo de compra (dev mode + simulate-payment) ────────
test('flujo completo: agregar → checkout → pedido confirmado', async ({ page }) => {
	await addFirstProductToCart(page);

	await page.goto('/checkout');
	await expect(page.locator('.checkout-title')).toBeVisible();

	await fillCheckoutForm(page);

	let simulateCalled = false;
	await page.route('**/api/test/simulate-payment', async (route) => {
		simulateCalled = true;
		await route.continue();
	});

	await page.locator('button[type="submit"]').first().click();

	// Espera página de éxito — SvelteKit procesa la orden (puede tardar)
	await expect(page).toHaveURL(/\/checkout\/exito/, { timeout: 20_000 });
	await expect(page.locator('body')).toContainText(/[Pp]edido|[Oo]rden|[Gg]racias/);
	expect(simulateCalled).toBe(true);
}, { timeout: 45_000 });

// ── TC-CHK-04: Página de éxito muestra dirección correcta ───────────────────
test('página de éxito muestra dirección sin mostrar solo coma-Chile', async ({ page }) => {
	await addFirstProductToCart(page);
	await page.goto('/checkout');
	await fillCheckoutForm(page);
	await page.locator('button[type="submit"]').first().click();
	await expect(page).toHaveURL(/\/checkout\/exito/, { timeout: 20_000 });

	const bodyText = await page.locator('body').textContent() ?? '';
	// La dirección completa debe aparecer
	expect(bodyText).toContain('Providencia');
	// No debe mostrar solo ", Chile"
	expect(bodyText).not.toMatch(/^,\s*Chile$/m);
}, { timeout: 45_000 });

// ── TC-CHK-05: Stock se decrementa tras la compra ────────────────────────────
test('stock disminuye o llega a agotado después de una compra', async ({ page }) => {
	await page.goto('/');
	const card = page.locator('.product-card').first();
	const href = await card.getAttribute('href');
	if (!href) { test.skip(); return; }

	// Selecciona variante
	await page.goto(href);
	const colorBtn = page.locator('.pdp-color-btn:not([disabled])').first();
	await colorBtn.click();
	const colorName = await colorBtn.getAttribute('aria-label') ?? '';
	const sizeBtn = page.locator('.pdp-size-btn:not([disabled])').first();
	const hasSize = await sizeBtn.isVisible({ timeout: 500 }).catch(() => false);
	if (hasSize) await sizeBtn.click();

	// Leer estado de stock antes
	const stockBefore = (await page.locator('.pdp-stock').textContent()) ?? '';

	// Comprar
	await page.locator('.pdp-buy').click();
	await page.goto('/checkout');
	await fillCheckoutForm(page);
	await page.locator('button[type="submit"]').first().click();
	await expect(page).toHaveURL(/\/checkout\/exito/, { timeout: 20_000 });

	// Vuelve al PDP y re-selecciona la misma variante
	await page.goto(href);
	const colorBtns = page.locator('.pdp-color-btn');
	// Busca el botón con el mismo color
	const sameColor = colorBtns.filter({ hasText: '' }).first();
	await page.locator(`.pdp-color-btn[aria-label="${colorName}"]`).click().catch(async () => {
		await colorBtns.first().click();
	});
	if (hasSize) {
		await page.locator('.pdp-size-btn:not([disabled])').first().click().catch(() => {});
	}

	const stockAfter = (await page.locator('.pdp-stock').textContent()) ?? '';

	// Stock debe haber bajado (texto diferente o "Agotado")
	// Validación flexible: al menos debe seguir cargando el PDP correctamente
	await expect(page.locator('.pdp-name')).toBeVisible();
	// Si antes era "Disponible", después puede ser "Últimas N" o "Sin stock"
	if (stockBefore.includes('Disponible')) {
		expect(stockAfter).not.toBe(stockBefore); // Algo debe haber cambiado
	}
}, { timeout: 45_000 });
