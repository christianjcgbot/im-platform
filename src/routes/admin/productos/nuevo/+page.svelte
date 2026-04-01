<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const COLORS = ['Negro', 'Navy', 'Blanco', 'Burdeo', 'Gris', 'Verde'];
	const SIZES  = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];

	type Variant = { color: string; size: string; stock: number };
	let variants: Variant[] = $state([{ color: 'Negro', size: 'M', stock: 0 }]);

	function addVariant() { variants = [...variants, { color: 'Negro', size: 'M', stock: 0 }]; }
	function removeVariant(i: number) { variants = variants.filter((_, idx) => idx !== i); }

	// Categorías — copia local para actualizar sin reload
	type Cat = { id: string; name: string; parent_id: string | null };
	let categories = $state<Cat[]>([...data.categories]);
	let selectedCategoryId = $state('');
	let rootCats = $derived(categories.filter(c => !c.parent_id));
	function subCats(parentId: string) { return categories.filter(c => c.parent_id === parentId); }
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
	let productName = $state('');
	let slug = $state('');
	let metaDesc = $state('');
	let slugTouched = $state(false);
	let slugDisplay = $derived(slug || 'mi-producto');

	function slugify(text: string) {
		return text.toLowerCase()
			.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9\s-]/g, '')
			.trim().replace(/\s+/g, '-');
	}

	function onNameInput(e: Event) {
		productName = (e.target as HTMLInputElement).value;
		if (!slugTouched) slug = slugify(productName);
	}

	function onSlugInput(e: Event) {
		slugTouched = true;
		slug = slugify((e.target as HTMLInputElement).value);
	}

	// Fotos — preview antes de guardar
	let selectedFiles = $state<File[]>([]);
	let previews = $derived(selectedFiles.map(f => URL.createObjectURL(f)));

	function onImagesChange(e: Event) {
		const input = e.target as HTMLInputElement;
		selectedFiles = input.files ? [...input.files].filter(f => f.size <= 5 * 1024 * 1024) : [];
	}
	function removePreview(i: number) {
		selectedFiles = selectedFiles.filter((_, idx) => idx !== i);
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

<form id="product-form" method="POST" enctype="multipart/form-data" use:enhance>
	<div class="form-layout">

		<!-- Columna principal -->
		<div class="form-main">
			<div class="card">
				<div class="form-group">
					<label class="form-label" for="name">Nombre *</label>
					<input id="name" name="name" type="text" class="form-input" required oninput={onNameInput} />
				</div>
				<div class="form-group">
					<label class="form-label" for="subtitle">Subtítulo <span style="color:var(--muted);font-weight:400;">(ej: Tenis · Dryfit)</span></label>
					<input id="subtitle" name="subtitle" type="text" class="form-input" />
				</div>
				<div class="form-group" style="margin-bottom:0;">
					<label class="form-label">Descripción</label>
					<RichTextEditor name="description" />
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

			<!-- Fotos -->
			<div class="card" style="margin-top:16px;">
				<h3 class="section-title">Fotos del producto <span style="color:var(--muted);font-weight:400;">(opcional)</span></h3>

				{#if previews.length > 0}
					<div class="new-img-grid">
						{#each previews as src, i}
							<div class="new-img-item">
								<div class="new-img-photo">
									<img {src} alt="Preview {i + 1}" />
									<button type="button" class="new-img-remove" onclick={() => removePreview(i)} title="Quitar">×</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<label class="img-upload-btn" style="margin-top:{previews.length > 0 ? '12px' : '0'};">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
					{previews.length > 0 ? `${previews.length} foto${previews.length > 1 ? 's' : ''} seleccionada${previews.length > 1 ? 's' : ''} · Cambiar` : 'Seleccionar fotos'}
					<input type="file" name="images" accept="image/*" multiple style="display:none;" onchange={onImagesChange} />
				</label>
				<p style="font-size:11px;color:var(--muted);margin-top:6px;">Máx 5MB por foto · Se subirán al guardar el producto</p>
			</div>

			<!-- Propiedades -->
			<div class="card" style="margin-top:16px;">
				<h3 class="section-title">Propiedades</h3>
				<div class="form-group" style="margin-bottom:0;">
					<label class="form-label">SKU</label>
					<input name="sku" type="text" class="form-input" placeholder="ej: TT-MUJ-NEG-M" />
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
					<div class="seo-title">{productName || 'Nombre del producto'} — IM Sportswear</div>
					<div class="seo-url">shop.imsportswear.cl/productos/{slugDisplay}</div>
					<div class="seo-desc">{metaDesc || 'Agrega una meta descripción para mejorar el posicionamiento en Google.'}</div>
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
				<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
					<h3 class="section-title" style="margin:0;">Categoría</h3>
					<button type="button" class="btn btn-ghost" style="padding:4px 10px;font-size:12px;" onclick={() => showCategoryModal = true}>+ Nueva</button>
				</div>
				<input type="hidden" name="category_id" value={selectedCategoryId} />
				<select class="form-select" bind:value={selectedCategoryId}>
					<option value="">Sin categoría</option>
					{#each rootCats as cat}
						<option value={cat.id}>{cat.name}</option>
						{#each subCats(cat.id) as sub}
							<option value={sub.id}>  └ {sub.name}</option>
						{/each}
					{/each}
				</select>
			</div>
		</div>
	</div>
</form>

<!-- Modal nueva categoría -->
{#if showCategoryModal}
	<div class="modal-overlay" onclick={() => showCategoryModal = false} role="dialog">
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Nueva categoría</h3>
				<button type="button" class="modal-close" onclick={() => showCategoryModal = false}>×</button>
			</div>
			<form
				method="POST"
				action="?/create_category"
				use:enhance={handleCategoryCreate}
			>
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
/* Fotos nuevo */
.new-img-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(100px, 1fr)); gap:10px; margin-bottom:4px; }
.new-img-photo { position:relative; aspect-ratio:3/4; overflow:hidden; border-radius:6px; border:1px solid var(--border); }
.new-img-photo img { width:100%; height:100%; object-fit:cover; }
.new-img-remove { position:absolute; top:-6px; right:-6px; width:20px; height:20px; border-radius:50%; background:var(--danger); color:#fff; border:none; cursor:pointer; font-size:13px; display:flex; align-items:center; justify-content:center; }
.img-upload-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border:1px solid var(--border); border-radius:6px; font-size:13px; font-weight:500; cursor:pointer; color:var(--text); background:#fff; transition:border-color 0.15s; }
.img-upload-btn:hover { border-color:var(--navy); color:var(--navy); }
/* SEO */
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
@media (max-width:900px) { .form-layout { grid-template-columns:1fr; } .price-grid { grid-template-columns:1fr 1fr; } }
</style>
