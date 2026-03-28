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
	let images = $state([...data.images].sort((a, b) => a.position - b.position));
	let sortedImages = $derived(images);
	let dragIdx = $state<number | null>(null);

	function onDragStart(i: number) { dragIdx = i; }
	function onDragOver(e: DragEvent, i: number) {
		e.preventDefault();
		if (dragIdx === null || dragIdx === i) return;
		const reordered = [...images];
		const [moved] = reordered.splice(dragIdx, 1);
		reordered.splice(i, 0, moved);
		images = reordered;
		dragIdx = i;
	}
	function onDragEnd() {
		dragIdx = null;
		saveOrder();
	}

	async function saveOrder() {
		const order = images.map(img => img.id).join(',');
		const fd = new FormData();
		fd.append('order', order);
		await fetch('?/reorder_images', { method: 'POST', body: fd });
	}
</script>

<svelte:head><title>{data.product.name} — IM Admin</title></svelte:head>

<div class="page-header">
	<div>
		<a href="/admin/productos" style="font-size:13px;color:var(--muted);">← Productos</a>
		<h1 style="margin-top:4px;">{data.product.name}</h1>
	</div>
	<button form="product-form" type="submit" class="btn btn-primary">Guardar cambios</button>
</div>

{#if form?.error}
	<div class="error-banner">{form.error}</div>
{/if}

<div class="form-layout">

	<!-- Columna principal -->
	<div class="form-main">

		<!-- Info básica — dentro del form principal -->
		<form id="product-form" method="POST" action="?/update">
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

			<!-- Propiedades -->
			<div class="card" style="margin-top:16px;">
				<h3 class="section-title">Propiedades</h3>
				<div class="form-group" style="margin-bottom:0;">
					<label class="form-label">SKU</label>
					<input name="sku" type="text" class="form-input" value={data.product.sku ?? ''} />
				</div>
			</div>
		</form>

		<!-- Fotos — forms independientes, fuera del form principal -->
		<div class="card" style="margin-top:16px;">
			<h3 class="section-title">Fotos del producto</h3>
			<div class="images-grid">
				{#each sortedImages as img, i}
					<div
						class="img-item"
						class:dragging={dragIdx === i}
						draggable="true"
						ondragstart={() => onDragStart(i)}
						ondragover={(e) => onDragOver(e, i)}
						ondragend={onDragEnd}
						role="listitem"
					>
						{#if i === 0}
							<span class="img-primary-badge">Principal</span>
						{/if}
						<img src={img.url} alt={data.product.name} />
						<div class="img-actions">
							{#if i !== 0}
								<button
									type="button"
									class="img-action-btn"
									title="Hacer principal"
									onclick={() => { const reordered = [...images]; const [moved] = reordered.splice(i,1); reordered.unshift(moved); images = reordered; saveOrder(); }}
								>★</button>
							{/if}
							<form method="POST" action="?/delete_image" use:enhance>
								<input type="hidden" name="id" value={img.id} />
								<button type="submit" class="img-delete" title="Eliminar">×</button>
							</form>
						</div>
					</div>
				{/each}

				<form
					method="POST"
					action="?/upload_image"
					enctype="multipart/form-data"
					use:enhance={() => {
						uploading = true;
						return async ({ update }) => {
							uploading = false;
							await update({ reset: false });
						};
					}}
				>
					<label class="img-upload">
						{#if uploading}
							<span style="font-size:12px;color:var(--muted);">Subiendo...</span>
						{:else}
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
							<span style="font-size:12px;color:var(--muted);margin-top:4px;">Subir fotos</span>
							<span style="font-size:10px;color:var(--muted);">Múltiple · Max 5MB</span>
						{/if}
						<input
							type="file" name="files" accept="image/*" multiple style="display:none;"
							onchange={(e) => { if ((e.target as HTMLInputElement).files?.length) (e.target as HTMLInputElement).form?.requestSubmit(); }}
						/>
					</label>
				</form>
			</div>
			<p style="font-size:11px;color:var(--muted);margin-top:8px;">La primera foto es la principal · Proporción 3:4 recomendada · Max 5MB por foto.</p>
		</div>
	</div>

	<!-- Sidebar — usa form attribute para asociarse al form principal -->
	<div class="form-sidebar">
		<div class="card">
			<h3 class="section-title">Estado</h3>
			<div class="form-group">
				<label class="form-label">Visibilidad</label>
				<select name="status" form="product-form" class="form-select">
					<option value="draft" selected={data.product.status === 'draft'}>Borrador</option>
					<option value="available" selected={data.product.status === 'available'}>Disponible</option>
					<option value="sold_out" selected={data.product.status === 'sold_out'}>Agotado</option>
				</select>
			</div>
			<label class="checkbox-label">
				<input type="checkbox" name="featured" form="product-form" checked={data.product.featured} />
				<span>Producto destacado</span>
			</label>
		</div>

		<div class="card" style="margin-top:16px;">
			<h3 class="section-title">Categoría</h3>
			<select name="category_id" form="product-form" class="form-select">
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

<style>
.page-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:24px; }
.page-header h1 { font-size:22px; font-weight:600; }
.error-banner { background:#fee2e2; color:var(--danger); padding:12px 16px; border-radius:6px; margin-bottom:16px; font-size:13px; }
.section-title { font-size:13px; font-weight:600; margin-bottom:16px; }
.form-layout { display:grid; grid-template-columns:1fr 300px; gap:20px; align-items:start; }
.price-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
.variants-header { display:grid; grid-template-columns:1fr 1fr 100px 32px; gap:8px; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); margin-bottom:8px; }
.variant-row { display:grid; grid-template-columns:1fr 1fr 100px 32px; gap:8px; margin-bottom:8px; align-items:center; }
.checkbox-label { display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer; margin-top:12px; }
.images-grid { display:flex; flex-wrap:wrap; gap:12px; }
.img-item { position:relative; width:100px; height:133px; }
.img-item img { width:100%; height:100%; object-fit:cover; border-radius:6px; border:1px solid var(--border); }
.img-delete { position:absolute; top:-8px; right:-8px; width:22px; height:22px; border-radius:50%; background:var(--danger); color:#fff; border:none; cursor:pointer; font-size:14px; line-height:1; }
.img-upload { width:100px; height:133px; border:2px dashed var(--border); border-radius:6px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; transition:border-color 0.15s; }
.img-upload:hover { border-color:var(--navy); }
.img-item { cursor: grab; }
.img-item.dragging { opacity:0.4; cursor:grabbing; }
.img-primary-badge { position:absolute; top:6px; left:6px; background:var(--navy); color:#fff; font-size:9px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:2px 6px; border-radius:3px; z-index:1; }
.img-actions { position:absolute; bottom:6px; right:6px; display:flex; gap:4px; }
.img-action-btn { width:22px; height:22px; border-radius:50%; background:rgba(255,255,255,0.9); color:#b45309; border:none; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; }
.img-action-btn:hover { background:#fff; }
@media (max-width:900px) { .form-layout { grid-template-columns:1fr; } .price-grid { grid-template-columns:1fr 1fr; } }
</style>
