<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// ── Datos tienda (local state sincronizado con data) ──
	let storeName    = $state(data.store.name);
	let storeEmail   = $state(data.store.email);
	let storePhone   = $state(data.store.phone);
	let storeAddress = $state(data.store.address);

	$effect(() => {
		storeName    = data.store.name;
		storeEmail   = data.store.email;
		storePhone   = data.store.phone;
		storeAddress = data.store.address;
	});

	// ── Envío (local state sincronizado con data) ──
	let shipThreshold = $state(data.shipping.free_threshold);
	let shipCost      = $state(data.shipping.cost);
	let shipDays      = $state(data.shipping.days);

	$effect(() => {
		shipThreshold = data.shipping.free_threshold;
		shipCost      = data.shipping.cost;
		shipDays      = data.shipping.days;
	});

	// ── Tallas ──
	let sizes   = $state<string[]>([...data.sizes]);
	let newSize = $state('');

	$effect(() => { sizes = [...data.sizes]; });

	function addSize() {
		const s = newSize.trim();
		if (!s || sizes.includes(s)) return;
		sizes = [...sizes, s];
		newSize = '';
	}
	function removeSize(i: number) { sizes = sizes.filter((_, idx) => idx !== i); }
	function moveSize(i: number, dir: -1 | 1) {
		const j = i + dir;
		if (j < 0 || j >= sizes.length) return;
		const arr = [...sizes];
		[arr[i], arr[j]] = [arr[j], arr[i]];
		sizes = arr;
	}

	// ── Colores ──
	let colors       = $state<Array<{ name: string; hex: string }>>([...data.colors]);
	let newColorName = $state('');
	let newColorHex  = $state('#000000');

	$effect(() => { colors = [...data.colors]; });

	function addColor() {
		const n = newColorName.trim();
		if (!n) return;
		colors = [...colors, { name: n, hex: newColorHex }];
		newColorName = '';
		newColorHex  = '#000000';
	}
	function removeColor(i: number) { colors = colors.filter((_, idx) => idx !== i); }
</script>

<div class="page-header">
	<h1>Configuración</h1>
</div>

<div class="config-stack">

	<!-- ── Datos de la tienda ── -->
	<div class="config-card">
		<div class="config-card-header">
			<h2>Datos de la tienda</h2>
			<p>Información general de contacto y nombre.</p>
		</div>
		<form method="POST" action="?/save_store" use:enhance class="config-form">
			{#if form?.section === 'store' && form.error}
				<p class="config-error">{form.error}</p>
			{/if}
			{#if form?.section === 'store' && form.success}
				<p class="config-ok">Guardado correctamente.</p>
			{/if}
			<div class="config-grid">
				<div class="field">
					<label for="store-name">Nombre de la tienda *</label>
					<input id="store-name" name="name" type="text" bind:value={storeName} required />
				</div>
				<div class="field">
					<label for="store-email">Email de contacto *</label>
					<input id="store-email" name="email" type="email" bind:value={storeEmail} required />
				</div>
				<div class="field">
					<label for="store-phone">Teléfono</label>
					<input id="store-phone" name="phone" type="tel" bind:value={storePhone} placeholder="+56 9 XXXX XXXX" />
				</div>
				<div class="field">
					<label for="store-address">Dirección</label>
					<input id="store-address" name="address" type="text" bind:value={storeAddress} placeholder="Av. Ejemplo 123, Santiago" />
				</div>
			</div>
			<div class="config-actions">
				<button type="submit" class="btn btn-primary">Guardar datos</button>
			</div>
		</form>
	</div>

	<!-- ── Envío ── -->
	<div class="config-card">
		<div class="config-card-header">
			<h2>Configuración de envío</h2>
			<p>Umbral de envío gratis, costo base y días de despacho.</p>
		</div>
		<form method="POST" action="?/save_shipping" use:enhance class="config-form">
			{#if form?.section === 'shipping' && form.error}
				<p class="config-error">{form.error}</p>
			{/if}
			{#if form?.section === 'shipping' && form.success}
				<p class="config-ok">Guardado correctamente.</p>
			{/if}
			<div class="config-grid config-grid-3">
				<div class="field">
					<label for="ship-threshold">Envío gratis sobre (CLP)</label>
					<input id="ship-threshold" name="free_threshold" type="number" min="0" step="1000" bind:value={shipThreshold} />
					<span class="field-hint">Ej: 50000 → gratis sobre $50.000</span>
				</div>
				<div class="field">
					<label for="ship-cost">Costo de envío (CLP)</label>
					<input id="ship-cost" name="cost" type="number" min="0" step="100" bind:value={shipCost} />
				</div>
				<div class="field">
					<label for="ship-days">Días hábiles despacho</label>
					<input id="ship-days" name="days" type="number" min="1" max="30" bind:value={shipDays} />
				</div>
			</div>
			<div class="config-actions">
				<button type="submit" class="btn btn-primary">Guardar envío</button>
			</div>
		</form>
	</div>

	<!-- ── Tallas ── -->
	<div class="config-card">
		<div class="config-card-header">
			<h2>Tallas predefinidas</h2>
			<p>Orden en que aparecen en el selector de variantes.</p>
		</div>
		<form method="POST" action="?/save_sizes" use:enhance class="config-form">
			{#if form?.section === 'sizes' && form.error}
				<p class="config-error">{form.error}</p>
			{/if}
			{#if form?.section === 'sizes' && form.success}
				<p class="config-ok">Guardado correctamente.</p>
			{/if}

			<input type="hidden" name="sizes" value={JSON.stringify(sizes)} />

			<div class="tag-list">
				{#each sizes as size, i}
					<div class="tag-row">
						<span class="tag-label">{size}</span>
						<div class="tag-actions">
							<button type="button" onclick={() => moveSize(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
							<button type="button" onclick={() => moveSize(i, 1)} disabled={i === sizes.length - 1} aria-label="Bajar">↓</button>
							<button type="button" class="tag-remove" onclick={() => removeSize(i)} aria-label="Eliminar">×</button>
						</div>
					</div>
				{/each}
			</div>

			<div class="tag-add">
				<input
					type="text"
					bind:value={newSize}
					placeholder="Nueva talla (ej: 3XL)"
					onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addSize())}
				/>
				<button type="button" class="btn btn-secondary" onclick={addSize}>Agregar</button>
			</div>

			<div class="config-actions">
				<button type="submit" class="btn btn-primary">Guardar tallas</button>
			</div>
		</form>
	</div>

	<!-- ── Colores ── -->
	<div class="config-card">
		<div class="config-card-header">
			<h2>Colores predefinidos</h2>
			<p>Mapa de nombre → hex para los círculos de color en la tienda.</p>
		</div>
		<form method="POST" action="?/save_colors" use:enhance class="config-form">
			{#if form?.section === 'colors' && form.error}
				<p class="config-error">{form.error}</p>
			{/if}
			{#if form?.section === 'colors' && form.success}
				<p class="config-ok">Guardado correctamente.</p>
			{/if}

			<input type="hidden" name="colors" value={JSON.stringify(colors)} />

			<div class="color-list">
				{#each colors as c, i}
					<div class="color-row">
						<span class="color-swatch" style="background:{c.hex}"></span>
						<span class="color-name">{c.name}</span>
						<span class="color-hex">{c.hex}</span>
						<button type="button" class="tag-remove" onclick={() => removeColor(i)} aria-label="Eliminar">×</button>
					</div>
				{/each}
			</div>

			<div class="color-add">
				<input type="color" bind:value={newColorHex} title="Elegir color" />
				<input
					type="text"
					bind:value={newColorName}
					placeholder="Nombre (ej: Coral)"
					onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
				/>
				<button type="button" class="btn btn-secondary" onclick={addColor}>Agregar</button>
			</div>

			<div class="config-actions">
				<button type="submit" class="btn btn-primary">Guardar colores</button>
			</div>
		</form>
	</div>

</div>

<style>
.config-stack { display: flex; flex-direction: column; gap: 24px; max-width: 800px; }

.config-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }

.config-card-header { padding: 20px 24px 16px; border-bottom: 1px solid var(--border); }
.config-card-header h2 { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
.config-card-header p { font-size: 12.5px; color: var(--text-secondary); }

.config-form { padding: 20px 24px; }

.config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.config-grid-3 { grid-template-columns: 1fr 1fr 1fr; }

.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 12.5px; font-weight: 500; color: var(--text-secondary); }
.field input, .field select {
	height: 36px; padding: 0 10px;
	border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
	font-size: 13px; color: var(--text); background: var(--surface);
	transition: border-color 0.15s;
}
.field input:focus { outline: none; border-color: var(--accent); }
.field-hint { font-size: 11.5px; color: var(--muted); }

.config-actions { display: flex; justify-content: flex-end; margin-top: 8px; }

.config-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 8px 12px; border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 14px; }
.config-ok    { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; padding: 8px 12px; border-radius: var(--radius-sm); font-size: 13px; margin-bottom: 14px; }

/* Tallas */
.tag-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.tag-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: var(--bg-subtle); border-radius: var(--radius-sm); }
.tag-label { flex: 1; font-size: 13px; font-weight: 500; }
.tag-actions { display: flex; gap: 4px; }
.tag-actions button { width: 26px; height: 26px; border: 1px solid var(--border); background: var(--surface); border-radius: 5px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); transition: background 0.12s; }
.tag-actions button:hover:not(:disabled) { background: var(--border); }
.tag-actions button:disabled { opacity: 0.3; cursor: default; }
.tag-remove { border-color: #fca5a5 !important; color: #ef4444 !important; }
.tag-remove:hover { background: #fef2f2 !important; }

.tag-add { display: flex; gap: 8px; margin-bottom: 16px; }
.tag-add input { flex: 1; height: 36px; padding: 0 10px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); font-size: 13px; }
.tag-add input:focus { outline: none; border-color: var(--accent); }

/* Colores */
.color-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.color-row { display: flex; align-items: center; gap: 10px; padding: 6px 10px; background: var(--bg-subtle); border-radius: var(--radius-sm); }
.color-swatch { width: 22px; height: 22px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.12); flex-shrink: 0; }
.color-name { flex: 1; font-size: 13px; font-weight: 500; }
.color-hex { font-size: 12px; color: var(--muted); font-family: monospace; }

.color-add { display: flex; gap: 8px; align-items: center; margin-bottom: 16px; }
.color-add input[type="color"] { width: 36px; height: 36px; padding: 2px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); cursor: pointer; background: var(--surface); }
.color-add input[type="text"] { flex: 1; height: 36px; padding: 0 10px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); font-size: 13px; }
.color-add input[type="text"]:focus { outline: none; border-color: var(--accent); }

.btn { height: 36px; padding: 0 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; border: none; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent-hover); }
.btn-secondary { background: var(--bg-subtle); color: var(--text); border: 1px solid var(--border-strong); }
.btn-secondary:hover { background: var(--border); }

@media (max-width: 600px) {
	.config-grid, .config-grid-3 { grid-template-columns: 1fr; }
}
</style>
