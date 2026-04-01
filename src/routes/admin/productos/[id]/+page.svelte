<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { PageData, ActionData } from './$types';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let justCreated = $derived($page.url.searchParams.get('created') === '1');

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
	function submitParentForm(e: Event) { (e.currentTarget as HTMLElement).closest('form')?.requestSubmit(); }
	let variantColors = $derived([...new Set(variants.map(v => v.color))]);
	let rootCategories = $derived((categories as { id: string; name: string; parent_id: string | null }[]).filter(c => !c.parent_id));
	function subCats(parentId: string) { return (categories as { id: string; name: string; parent_id: string | null }[]).filter(c => c.parent_id === parentId); }

	let uploading = $state(false);
	let preview = $state<string | null>(null);
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
	function onDragEnd() { dragIdx = null; saveOrder(); }

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.length) input.form?.requestSubmit();
	}

	async function saveOrder() {
		const order = images.map(img => img.id).join(',');
		const fd = new FormData();
		fd.append('order', order);
		await fetch('?/reorder_images', { method: 'POST', body: fd });
	}

	// Categorías inline
	let categories = $state([...data.categories]);
	let selectedCategoryId = $state(data.product.category_id ?? '');
	let showCategoryModal = $state(false);
	let newCategoryName = $state('');

	function handleCategoryCreate() {
		return async ({ result, update }: any) => {
			if (result.type === 'success' && result.data?.category) {
				categories = [...categories, result.data.category];
				selectedCategoryId = result.data.category.id;
			}
			showCategoryModal = false;
			newCategoryName = '';
			await update({ reset: true, invalidateAll: false });
		};
	}

	// SEO
	function slugify(text: string) {
		return text.toLowerCase()
			.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9\s-]/g, '')
			.trim().replace(/\s+/g, '-');
	}

	let slug = $state(data.product.slug ?? slugify(data.product.name));
	let metaDesc = $state(data.product.meta_description ?? '');
	let slugTouched = $state(!!data.product.slug);
	let slugDisplay = $derived(slug || 'mi-producto');

	function onNameInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		if (!slugTouched) slug = slugify(val);
	}
	function onSlugInput(e: Event) {
		slugTouched = true;
		slug = slugify((e.target as HTMLInputElement).value);
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

{#if justCreated}
	<div class="success-banner">✓ Producto creado. Ahora sube las fotos en la sección de abajo.</div>
{/if}
{#if form?.error}
	<div class="error-banner">{form.error}</div>
{/if}

<div class="form-layout">

	<!-- Columna principal -->
	<div class="form-main">

		<form id="product-form" method="POST" action="?/update">
			<div class="card">
				<div class="form-group">
					<label class="form-label" for="name">Nombre *</label>
					<input id="name" name="name" type="text" class="form-input" value={data.product.name} required oninput={onNameInput} />
				</div>
				<div class="form-group">
					<label class="form-label" for="subtitle">Subtítulo</label>
					<input id="subtitle" name="subtitle" type="text" class="form-input" value={data.product.subtitle ?? ''} />
				</div>
				<div class="form-group" style="margin-bottom:0;">
					<label class="form-label">Descripción</label>
					<RichTextEditor name="description" value={data.product.description ?? ''} />
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

			<!-- SEO -->
			<div class="card" style="margin-top:16px;">
				<h3 class="section-title">SEO</h3>
				<div class="form-group">
					<label class="form-label">URL (slug)</label>
					<div class="slug-row">
						<span class="slug-prefix">shop.imsportswear.cl/productos/</span>
						<input name="slug" type="text" class="form-input" value={slug} oninput={onSlugInput} placeholder="mi-producto" style="border-left:none;border-radius:0 6px 6px 0;" />
					</div>
				</div>
				<div class="form-group">
					<label class="form-label">
						Meta descripción
						<span style="color:var(--muted);font-weight:400;margin-left:6px;">{metaDesc.length}/155</span>
					</label>
					<textarea name="meta_description" class="form-textarea" style="height:72px;" maxlength="155" bind:value={metaDesc}></textarea>
				</div>
				<div class="seo-preview">
					<div class="seo-title">{data.product.name} — IM Sportswear</div>
					<div class="seo-url">shop.imsportswear.cl/productos/{slugDisplay}</div>
					<div class="seo-desc">{metaDesc || 'Agrega una meta descripción para mejorar el posicionamiento en Google.'}</div>
				</div>
			</div>
		</form>

		<!-- Fotos — fuera del form principal -->
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
						<!-- Zona de foto -->
						<div class="img-photo">
							{#if i === 0}
								<span class="img-primary-badge">Principal</span>
							{/if}
							<img src={img.url} alt={data.product.name} onclick={() => preview = img.url} style="cursor:zoom-in;" />
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
						<!-- Color tag -->
						<form method="POST" action="?/tag_image_color" use:enhance={() => async ({ update }) => update({ reset: false })}>
							<input type="hidden" name="id" value={img.id} />
							<select
								name="color"
								class="img-color-tag"
								title="Color de esta foto"
								onchange={submitParentForm}
							>
								<option value="">— Todos</option>
								{#each variantColors as c}
									<option value={c} selected={img.color === c}>{c}</option>
								{/each}
							</select>
						</form>
					</div>
				{/each}
			</div>

			<div class="img-upload-row">
				<form
					method="POST"
					action="?/upload_image"
					enctype="multipart/form-data"
					use:enhance={() => {
						uploading = true;
						return async ({ update }) => { uploading = false; await update({ reset: false }); };
					}}
				>
					<label class="img-upload-btn">
						{#if uploading}
							<span>Subiendo...</span>
						{:else}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
							Subir fotos
						{/if}
						<input type="file" name="files" accept="image/*" multiple style="display:none;" onchange={onFileChange} />
					</label>
				</form>
				<p style="font-size:11px;color:var(--muted);">Arrastra para reordenar · Primera foto = principal · Max 5MB</p>
			</div>
		</div>
	</div>

	<!-- Sidebar -->
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
			<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
				<h3 class="section-title" style="margin:0;">Categoría</h3>
				<button type="button" class="btn btn-ghost" style="padding:4px 10px;font-size:12px;" onclick={() => showCategoryModal = true}>+ Nueva</button>
			</div>
			<input type="hidden" name="category_id" form="product-form" value={selectedCategoryId} />
			<select class="form-select" bind:value={selectedCategoryId}>
				<option value="">Sin categoría</option>
			{#each rootCategories as cat}
					<option value={cat.id}>{cat.name}</option>
				{#each subCats(cat.id) as sub}
						<option value={sub.id}>  └ {sub.name}</option>
					{/each}
				{/each}
			</select>
		</div>
	</div>
</div>

<!-- Modal nueva categoría -->
{#if showCategoryModal}
	<div class="modal-overlay" onclick={() => showCategoryModal = false} role="dialog">
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Nueva categoría</h3>
				<button type="button" class="modal-close" onclick={() => showCategoryModal = false}>×</button>
			</div>
			<form method="POST" action="?/create_category" use:enhance={handleCategoryCreate}>
				<div class="modal-body">
					<label class="form-label">Nombre *</label>
					<input name="name" type="text" class="form-input" bind:value={newCategoryName} required autofocus placeholder="ej: Accesorios" />
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-ghost" onclick={() => showCategoryModal = false}>Cancelar</button>
					<button type="submit" class="btn btn-primary">Crear categoría</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Lightbox -->
{#if preview}
	<div class="lightbox" onclick={() => preview = null} role="dialog" aria-modal="true">
		<button class="lightbox-close" onclick={() => preview = null}>×</button>
		<img src={preview} alt="Preview" onclick={(e) => e.stopPropagation()} />
	</div>
{/if}

<style>
.page-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:24px; }
.page-header h1 { font-size:22px; font-weight:600; }
.error-banner { background:#fee2e2; color:var(--danger); padding:12px 16px; border-radius:6px; margin-bottom:16px; font-size:13px; }
.success-banner { background:#dcfce7; color:#166534; padding:12px 16px; border-radius:6px; margin-bottom:16px; font-size:13px; font-weight:500; }
.section-title { font-size:13px; font-weight:600; margin-bottom:16px; }
.form-layout { display:grid; grid-template-columns:1fr 300px; gap:20px; align-items:start; }
.price-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
.variants-header { display:grid; grid-template-columns:1fr 1fr 100px 32px; gap:8px; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); margin-bottom:8px; }
.variant-row { display:grid; grid-template-columns:1fr 1fr 100px 32px; gap:8px; margin-bottom:8px; align-items:center; }
.checkbox-label { display:flex; align-items:center; gap:8px; font-size:13px; cursor:pointer; margin-top:12px; }
/* Fotos */
.images-grid { display:flex; flex-wrap:wrap; gap:16px; }
.img-item { width:130px; cursor:grab; flex-shrink:0; }
.img-item.dragging { opacity:0.4; cursor:grabbing; }
.img-photo { position:relative; aspect-ratio:3/4; overflow:hidden; border-radius:6px; border:1px solid var(--border); }
.img-photo img { width:100%; height:100%; object-fit:cover; }
.img-primary-badge { position:absolute; top:5px; left:5px; background:var(--navy); color:#fff; font-size:9px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; padding:2px 5px; border-radius:3px; z-index:1; }
.img-actions { position:absolute; bottom:5px; right:5px; display:flex; gap:3px; }
.img-action-btn { width:22px; height:22px; border-radius:50%; background:rgba(255,255,255,0.92); color:#b45309; border:none; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; }
.img-action-btn:hover { background:#fff; }
.img-delete { position:absolute; top:-7px; right:-7px; width:20px; height:20px; border-radius:50%; background:var(--danger); color:#fff; border:none; cursor:pointer; font-size:13px; line-height:1; display:flex; align-items:center; justify-content:center; }
.img-color-tag { width:100%; margin-top:6px; font-size:11px; padding:4px 6px; border:1px solid var(--border); border-radius:4px; background:#fff; color:var(--text); cursor:pointer; display:block; }
.img-upload-row { display:flex; align-items:center; gap:16px; margin-top:16px; padding-top:16px; border-top:1px solid var(--border); }
.img-upload-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border:1px solid var(--border); border-radius:6px; font-size:13px; font-weight:500; cursor:pointer; color:var(--text); background:#fff; transition:border-color 0.15s; }
.img-upload-btn:hover { border-color:var(--navy); color:var(--navy); }/* SEO */
.slug-row { display:flex; align-items:center; }
.slug-prefix { background:var(--bg); border:1px solid var(--border); border-right:none; border-radius:6px 0 0 6px; padding:0 10px; height:36px; display:flex; align-items:center; font-size:12px; color:var(--muted); white-space:nowrap; flex-shrink:0; }
.seo-preview { border:1px solid var(--border); border-radius:6px; padding:12px; margin-top:8px; background:#fff; }
.seo-title { font-size:14px; color:#1a0dab; font-weight:500; margin-bottom:2px; }
.seo-url { font-size:12px; color:#006621; margin-bottom:4px; }
.seo-desc { font-size:12px; color:#545454; line-height:1.5; }
/* Modal */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:200; display:flex; align-items:center; justify-content:center; }
.modal { background:#fff; border-radius:10px; width:420px; max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
.modal-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px 0; }
.modal-header h3 { font-size:16px; font-weight:600; }
.modal-close { background:none; border:none; font-size:24px; cursor:pointer; color:var(--muted); line-height:1; padding:0 4px; }
.modal-body { padding:16px 24px; }
.modal-footer { display:flex; justify-content:flex-end; gap:8px; padding:16px 24px; border-top:1px solid var(--border); }
/* Lightbox */
.lightbox { position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:1000; display:flex; align-items:center; justify-content:center; cursor:zoom-out; }
.lightbox img { max-width:90vw; max-height:90vh; object-fit:contain; border-radius:6px; cursor:default; box-shadow:0 8px 40px rgba(0,0,0,0.5); }
.lightbox-close { position:fixed; top:20px; right:24px; background:none; border:none; color:#fff; font-size:32px; line-height:1; cursor:pointer; opacity:0.8; }
.lightbox-close:hover { opacity:1; }
@media (max-width:900px) { .form-layout { grid-template-columns:1fr; } .price-grid { grid-template-columns:1fr 1fr; } }
</style>
