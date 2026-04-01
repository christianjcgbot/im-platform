<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type Category = { id: string; name: string; slug: string; parent_id: string | null; position: number };

	let categories = $state([...data.categories] as Category[]);
	let parents = $derived(categories.filter(c => !c.parent_id));

	// Modal state
	type ModalMode = 'create' | 'edit' | null;
	let modal = $state<ModalMode>(null);
	let editing = $state<Category | null>(null);
	let formName = $state('');
	let formParentId = $state('');

	function openCreate() {
		editing = null;
		formName = '';
		formParentId = '';
		modal = 'create';
	}

	function openEdit(cat: Category) {
		editing = cat;
		formName = cat.name;
		formParentId = cat.parent_id ?? '';
		modal = 'edit';
	}

	function closeModal() { modal = null; }

	function handleSave() {
		return async ({ result, update }: any) => {
			await update();
			categories = [...data.categories] as Category[];
			closeModal();
		};
	}

	function handleDelete() {
		return async ({ result, update }: any) => {
			await update();
			categories = [...data.categories] as Category[];
		};
	}
</script>

<svelte:head><title>Categorías — IM Admin</title></svelte:head>

<div class="page-header">
	<h1>Categorías</h1>
	<button class="btn btn-primary" onclick={openCreate}>+ Nueva categoría</button>
</div>

{#if form?.error}
	<div class="error-banner">{form.error}</div>
{/if}

<div class="card" style="padding:0;overflow:hidden;">
	{#if parents.length === 0}
		<div style="padding:48px;text-align:center;color:var(--muted);">
			<p style="margin-bottom:16px;">No hay categorías aún.</p>
			<button class="btn btn-primary" onclick={openCreate}>Crear primera categoría</button>
		</div>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Nombre</th>
					<th>Slug</th>
					<th>Subcategorías</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each parents as cat}
					{@const subs = categories.filter(c => c.parent_id === cat.id)}
					<tr>
						<td style="font-weight:500;">{cat.name}</td>
						<td style="font-size:12px;color:var(--muted);">{cat.slug}</td>
						<td style="font-size:13px;color:var(--muted);">
							{#if subs.length > 0}
								{subs.map(s => s.name).join(', ')}
							{:else}
								—
							{/if}
						</td>
						<td>
							<div style="display:flex;gap:8px;justify-content:flex-end;">
								<button class="btn btn-ghost" style="padding:6px 12px;" onclick={() => openEdit(cat)}>Editar</button>
								<form method="POST" action="?/delete" use:enhance={handleDelete}>
									<input type="hidden" name="id" value={cat.id} />
									<button
										type="submit"
										class="btn btn-ghost"
										style="padding:6px 12px;color:var(--danger);"
										onclick={(e) => { if (!confirm('¿Eliminar esta categoría?')) e.preventDefault(); }}
									>Eliminar</button>
								</form>
							</div>
						</td>
					</tr>
					{#each subs as sub}
						<tr style="background:var(--bg);">
							<td style="padding-left:32px;color:var(--muted);">└ {sub.name}</td>
							<td style="font-size:12px;color:var(--muted);">{sub.slug}</td>
							<td>—</td>
							<td>
								<div style="display:flex;gap:8px;justify-content:flex-end;">
									<button class="btn btn-ghost" style="padding:6px 12px;" onclick={() => openEdit(sub)}>Editar</button>
									<form method="POST" action="?/delete" use:enhance={handleDelete}>
										<input type="hidden" name="id" value={sub.id} />
										<button
											type="submit"
											class="btn btn-ghost"
											style="padding:6px 12px;color:var(--danger);"
											onclick={(e) => { if (!confirm('¿Eliminar esta subcategoría?')) e.preventDefault(); }}
										>Eliminar</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<!-- Modal crear / editar -->
{#if modal}
	<div class="modal-overlay" onclick={closeModal} role="dialog" tabindex="-1">
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>{modal === 'create' ? 'Nueva categoría' : 'Editar categoría'}</h3>
				<button type="button" class="modal-close" onclick={closeModal}>×</button>
			</div>
			<form
				method="POST"
				action={modal === 'create' ? '?/create' : '?/update'}
				use:enhance={handleSave}
			>
				{#if modal === 'edit' && editing}
					<input type="hidden" name="id" value={editing.id} />
				{/if}
				<div class="modal-body">
					<div class="form-group">
						<label class="form-label" for="cat-name">Nombre *</label>
						<input id="cat-name" name="name" type="text" class="form-input" bind:value={formName} required autofocus />
					</div>
					<div class="form-group" style="margin-bottom:0;">
						<label class="form-label" for="cat-parent">Categoría padre</label>
						<select id="cat-parent" name="parent_id" class="form-select" bind:value={formParentId}>
							<option value="">Ninguna (categoría principal)</option>
							{#each parents.filter(p => p.id !== editing?.id) as p}
								<option value={p.id}>{p.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-ghost" onclick={closeModal}>Cancelar</button>
					<button type="submit" class="btn btn-primary">{modal === 'create' ? 'Crear' : 'Guardar'}</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.page-header h1 { font-size:22px; font-weight:600; }
.error-banner { background:#fee2e2; color:var(--danger); padding:12px 16px; border-radius:6px; margin-bottom:16px; font-size:13px; }
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:200; display:flex; align-items:center; justify-content:center; }
.modal { background:#fff; border-radius:10px; width:440px; max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
.modal-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px 0; }
.modal-header h3 { font-size:16px; font-weight:600; }
.modal-close { background:none; border:none; font-size:24px; cursor:pointer; color:var(--muted); line-height:1; padding:0 4px; }
.modal-body { padding:16px 24px; }
.modal-footer { display:flex; justify-content:flex-end; gap:8px; padding:16px 24px; border-top:1px solid var(--border); }
</style>
