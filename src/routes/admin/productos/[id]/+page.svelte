<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const COLORS = ['Negro', 'Navy', 'Blanco', 'Burdeo', 'Gris', 'Verde'];
	const SIZES  = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];

	type Variant = { id?: string; color: string; size: string; stock: number };
	let variants: Variant[] = $state(
		data.variants.length > 0
			? data.variants.map((v: any) => ({ id: v.id, color: v.color, size: v.size, stock: v.stock }))
			: [{ color: 'Negro', size: 'M', stock: 0 }]
	);

	function addVariant() { variants = [...variants, { color: 'Negro', size: 'M', stock: 0 }]; }
	function removeVariant(i: number) { variants = variants.filter((_, idx) => idx !== i); }

	let uploading = $state(false);
</script>

<svelte:head><title>{data.product.name} — IM Admin</title></svelte:head>

<div class="page-header">
	<div>
		<a href="/admin/productos" style="font-size:13px;color:var(--muted);">← Productos</a>
		<h1 style="margin-top:4px;">{data.product.name}</h1>
	</div>
	<button form="product-form" type="submit" formaction="?/update" class="btn btn-primary">Guardar cambios</button>
</div>

{#if form?.error}
	<div class="error-banner">{form.error}</div>
{/if}

<form id="product-form" method="POST">
	<div class="form-layout">

		<div class="form-main">
			<div class="card">
				<div class="form-group">
					<label class="form-label" for="name">Nombre *</label>
					<input id="name" name="name" type="text" class="form-input" value={data.product.name} required />
				</div>
				<div class="form-group">
					<label class="form-label" for="subtitle">Subtítulo</label>
					<input id="subtitle" name="subtitle" type="text" class="form-input" value={data.product.subtitle ?? ''} />
				</div>
				<div class="form-group" style="margin-bottom:0;">
					<label class="form-label" for="description">Descripción</label>
					<textarea id="description" name="description" class="form-textarea">{data.product.description ?? ''}</textarea>
				</div>
			</div>

			<!-- Fotos -->
			<div class="card" style="margin-top:16px;">
				<h3 class="section-title">Fotos del producto</h3>

				<div class="images-grid">
					{#each data.images as img}
						<div class="img-item">
							<img src={img.url} alt={img.alt ?? data.product.name} />
							<form method="POST" use:enhance>
								<input type="hidden" name="id" value={img.id} />
								<button formaction="?/delete_image" type="submit" class="img-delete" title="Eliminar">×</button>
							</form>
						</div>
					{/each}

					<form
						method="POST"
						enctype="multipart/form-data"
						use:enhance={() => {
							uploading = true;
							return async ({ update }) => { uploading = false; await update(); };
						}}
					>
						<label class="img-upload">
							{#if uploading}
								<span style="font-size:12px;color:var(--muted);">Subiendo...</span>
							{:else}
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
								<span style="font-size:12px;color:var(--muted);margin-top:4px;">Subir foto</span>
								<span style="font-size:10px;color:var(--muted);">Max 5MB</span>
							{/if}
							<input
								type="file"
								name="file"
								accept="image/*"
								style="display:none;"
								onchange={(e) => { if ((e.target as HTMLInputElement).files?.length) (e.target as HTMLInputElement).form?.requestSubmit(); }}
							/>
						</label>
						<button formaction="?/upload_image" type="submit" style="display:none;"></button>
					</form>
				</div>
				<p style="font-size:11px;color:var(--muted);margin-top:8px;">Recomendado: fotos en proporción 3:4, mínimo 800×1067px.</p>
			</div>

			<!-- Precios -->
			<div class="card" style="margin-top:16px;">
				<h3 class="section-title">Precios</h3>
				<div class="price-grid">
					<div class="form-group">
						<label class="form-label">Precio CLP *</label>
						<input name="price" type="number" class="form-input" value={data.product.price} min="0" required />
					</div>
					<div class="form-group">
						<label class="form-label">Precio tachado</label>
						<input name="compare_price" type="number" class="form-input" value={data.product.compare_price ?? ''} min="0" />
					</div>
					<div class="form-group">
						<label class="form-label">Costo (interno)</label>
						<input name="cost" type="number" class="form-input" value={data.product.cost ?? ''} min="0" />
					</div>
				</div>
			</div>

			<!-- Variantes -->
			<div class="card" style="margin-top:16px;">
				<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
					<h3 class="section-title" style="margin:0;">Variantes</h3>
					<button type="button" class="btn btn-ghost" onclick={addVariant} style="padding:6px 12px;font-size:12px;">+ Agregar</button>
				</div>
				<div class="variants-header"><span>Color</span><span>Talla</span><span>Stock</span><span></span></div>
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

			<div class="card" style="margin-top:16px;">
				<h3 class="section-title">Propiedades</h3>
				<div class="form-group" style="margin-bottom:0;">
					<label class="form-label">SKU</label>
					<input name="sku" type="text" class="form-input" value={data.product.sku ?? ''} />
				</div>
			</div>
		</div>

		<!-- Sidebar -->
		<div class="form-sidebar">
			<div class="card">
				<h3 class="section-title">Estado</h3>
				<div class="form-group">
					<label class="form-label">Visibilidad</label>
					<select name="status" class="form-select">
						<option value="draft" selected={data.product.status === 'draft'}>Borrador</option>
						<option value="available" selected={data.product.status === 'available'}>Disponible</option>
						<option value="sold_out" selected={data.product.status === 'sold_out'}>Agotado</option>
					</select>
				</div>
				<label class="checkbox-label">
					<input type="checkbox" name="featured" checked={data.product.featured} />
					<span>Producto destacado</span>
				</label>
			</div>

			<div class="card" style="margin-top:16px;">
				<h3 class="section-title">Categoría</h3>
				<select name="category_id" class="form-select">
					<option value="">Sin categoría</option>
					{#each data.categories.filter((c: any) => !c.parent_id) as cat}
						<option value={cat.id} selected={data.product.category_id === cat.id}>{cat.name}</option>
						{#each data.categories.filter((c: any) => c.parent_id === cat.id) as sub}
							<option value={sub.id} selected={data.product.category_id === sub.id}>  └ {sub.name}</option>
						{/each}
					{/each}
				</select>
			</div>
		</div>
	</div>
</form>

<style>
.page-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:24px; }
.page-header h1 { font-size:22px; font-weight:600; }
.error-banner { background:#fee2e2; color:var(--danger); padding:12px 16px; border-radius:6px; margin-bottom:16px; font-size:13px; }
.section-title { font-size:13px; font-weight:600; margin-bottom:16px; }
.form-layout { display:grid; grid-template-columns:1fr 300px; gap:20px; align-items:start; }
.price-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
.variants-header { display:grid; grid-template-columns:1fr 1fr 100px 32px; gap:8px; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); margin-bottom:8px; }
.variant-row { display:grid; grid-template-columns:1fr 1fr 100px 32px; gap:8px; margin-bottom:8px; align-items:center; }
.checkbox-label { display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer; }

/* Images */
.images-grid { display:flex; flex-wrap:wrap; gap:12px; }
.img-item { position:relative; width:100px; height:133px; }
.img-item img { width:100%; height:100%; object-fit:cover; border-radius:6px; border:1px solid var(--border); }
.img-delete { position:absolute; top:-8px; right:-8px; width:22px; height:22px; border-radius:50%; background:var(--danger); color:#fff; border:none; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; }
.img-upload { width:100px; height:133px; border:2px dashed var(--border); border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; transition:border-color 0.15s; }
.img-upload:hover { border-color:var(--navy); }

@media (max-width:900px) { .form-layout { grid-template-columns:1fr; } .price-grid { grid-template-columns:1fr 1fr; } }
</style>
