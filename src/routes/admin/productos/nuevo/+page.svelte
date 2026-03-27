<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const COLORS = ['Negro', 'Navy', 'Blanco', 'Burdeo', 'Gris', 'Verde'];
	const SIZES  = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];

	type Variant = { color: string; size: string; stock: number };
	let variants: Variant[] = $state([{ color: 'Negro', size: 'M', stock: 0 }]);

	function addVariant() {
		variants = [...variants, { color: 'Negro', size: 'M', stock: 0 }];
	}
	function removeVariant(i: number) {
		variants = variants.filter((_, idx) => idx !== i);
	}
</script>

<svelte:head><title>Nuevo producto — IM Admin</title></svelte:head>

<div class="page-header">
	<div>
		<a href="/admin/productos" style="font-size:13px;color:var(--muted);">← Productos</a>
		<h1 style="margin-top:4px;">Nuevo producto</h1>
	</div>
	<button form="product-form" type="submit" class="btn btn-primary">Guardar</button>
</div>

{#if form?.error}
	<div class="error-banner">{form.error}</div>
{/if}

<form id="product-form" method="POST" use:enhance>
	<div class="form-layout">

		<!-- Columna principal -->
		<div class="form-main">
			<div class="card">
				<div class="form-group">
					<label class="form-label" for="name">Nombre *</label>
					<input id="name" name="name" type="text" class="form-input" required />
				</div>
				<div class="form-group">
					<label class="form-label" for="subtitle">Subtítulo <span style="color:var(--muted);font-weight:400;">(ej: Tenis · Dryfit)</span></label>
					<input id="subtitle" name="subtitle" type="text" class="form-input" />
				</div>
				<div class="form-group" style="margin-bottom:0;">
					<label class="form-label" for="description">Descripción</label>
					<textarea id="description" name="description" class="form-textarea"></textarea>
				</div>
			</div>

			<!-- Precios -->
			<div class="card" style="margin-top:16px;">
				<h3 class="section-title">Precios</h3>
				<div class="price-grid">
					<div class="form-group">
						<label class="form-label" for="price">Precio CLP *</label>
						<input id="price" name="price" type="number" class="form-input" min="0" required />
					</div>
					<div class="form-group">
						<label class="form-label" for="compare_price">Precio tachado</label>
						<input id="compare_price" name="compare_price" type="number" class="form-input" min="0" />
					</div>
					<div class="form-group">
						<label class="form-label" for="cost">Costo (interno)</label>
						<input id="cost" name="cost" type="number" class="form-input" min="0" />
					</div>
				</div>
			</div>

			<!-- Variantes -->
			<div class="card" style="margin-top:16px;">
				<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
					<h3 class="section-title" style="margin:0;">Variantes</h3>
					<button type="button" class="btn btn-ghost" onclick={addVariant} style="padding:6px 12px;font-size:12px;">+ Agregar variante</button>
				</div>

				<div class="variants-header">
					<span>Color</span><span>Talla</span><span>Stock</span><span></span>
				</div>
				{#each variants as v, i}
					<div class="variant-row">
						<select name="variants[{i}][color]" class="form-select" bind:value={v.color}>
							{#each COLORS as c}<option value={c}>{c}</option>{/each}
						</select>
						<select name="variants[{i}][size]" class="form-select" bind:value={v.size}>
							{#each SIZES as s}<option value={s}>{s}</option>{/each}
						</select>
						<input name="variants[{i}][stock]" type="number" class="form-input" min="0" bind:value={v.stock} />
						<button type="button" onclick={() => removeVariant(i)} style="background:none;border:none;color:var(--danger);font-size:18px;cursor:pointer;">×</button>
					</div>
				{/each}
			</div>

			<!-- Propiedades -->
			<div class="card" style="margin-top:16px;">
				<h3 class="section-title">Propiedades</h3>
				<div class="form-group" style="margin-bottom:0;">
					<label class="form-label" for="sku">SKU</label>
					<input id="sku" name="sku" type="text" class="form-input" placeholder="ej: TT-MUJ-NEG-M" />
				</div>
			</div>
		</div>

		<!-- Sidebar derecho -->
		<div class="form-sidebar">
			<div class="card">
				<h3 class="section-title">Estado</h3>
				<div class="form-group">
					<label class="form-label" for="status">Visibilidad</label>
					<select id="status" name="status" class="form-select">
						<option value="draft">Borrador</option>
						<option value="available">Disponible</option>
					</select>
				</div>
				<label class="checkbox-label">
					<input type="checkbox" name="featured" />
					<span>Producto destacado</span>
				</label>
			</div>

			<div class="card" style="margin-top:16px;">
				<h3 class="section-title">Categoría</h3>
				<select name="category_id" class="form-select">
					<option value="">Sin categoría</option>
					{#each data.categories.filter((c: any) => !c.parent_id) as cat}
						<option value={cat.id}>{cat.name}</option>
						{#each data.categories.filter((c: any) => c.parent_id === cat.id) as sub}
							<option value={sub.id}>  └ {sub.name}</option>
						{/each}
					{/each}
				</select>
			</div>

			<div class="card" style="margin-top:16px;">
				<h3 class="section-title">Imagen</h3>
				<p style="font-size:12px;color:var(--muted);">Upload de fotos disponible en la siguiente versión.</p>
			</div>
		</div>
	</div>
</form>

<style>
.page-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:24px; }
.page-header h1 { font-size:22px; font-weight:600; }
.error-banner { background:#fee2e2; color:var(--danger); padding:12px 16px; border-radius:6px; margin-bottom:16px; font-size:13px; }
.section-title { font-size:13px; font-weight:600; margin-bottom:16px; color:var(--text); }
.form-layout { display:grid; grid-template-columns: 1fr 300px; gap:20px; align-items:start; }
.price-grid { display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px; }
.variants-header { display:grid; grid-template-columns:1fr 1fr 100px 32px; gap:8px; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); margin-bottom:8px; }
.variant-row { display:grid; grid-template-columns:1fr 1fr 100px 32px; gap:8px; margin-bottom:8px; align-items:center; }
.checkbox-label { display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer; }
.checkbox-label input { width:14px; height:14px; }
@media (max-width: 900px) {
	.form-layout { grid-template-columns: 1fr; }
	.price-grid { grid-template-columns: 1fr 1fr; }
}
</style>
