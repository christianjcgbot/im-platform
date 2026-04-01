import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	webServer: {
		// Puerto 5174 para no interferir con dev en 5173.
		// SUMUP vacío → devMode activo → simulate-payment + redirect a /checkout/exito
		command: 'SUMUP_API_KEY="" SUMUP_MERCHANT_CODE="" npm run dev -- --port 5174',
		url: 'http://localhost:5174',
		reuseExistingServer: false,
		timeout: 60_000,
		stdout: 'ignore',
		stderr: 'pipe',
	},
	testDir: 'tests/e2e',
	use: {
		baseURL: 'http://localhost:5174',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
	],
	reporter: [['list'], ['html', { open: 'never' }]],
});
