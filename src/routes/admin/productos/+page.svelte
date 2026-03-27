<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	function clp(n: number) {
		return '$' + n.toLocaleString('es-CL');
	}
</script>

<svelte:head><title>Productos — IM Admin</title></svelte:head>

<div class="page-header">
	<h1>Productos</h1>
	<a href="/admin/productos/nuevo" class="btn btn-primary">+ Nuevo producto</a>
</div>

<div class="card" style="padding:0;overflow:hidden;">
	{#if data.products.length === 0}
		<div style="padding:48px;text-align:center;color:var(--muted);">
			<p style="margin-bottom:16px;">No hay productos aún.</p>
			<a href="/admin/productos/nuevo" class="btn btn-primary">Crear primer producto</a>
		</div>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Producto</th>
					<th>Estado</th>
					<th>Precio</th>
					<th>Stock total</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.products as p}
					<tr>
						<td>
							<div style="display:flex;align-items:center;gap:12px;">
								{#if p.image}
									<img src={p.image} alt={p.name} style="width:40px;height:40px;object-fit:cover;border-radius:4px;" />
								{:else}
									<div style="width:40px;height:40px;background:var(--bg);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--muted);">IM</div>
								{/if}
								<div>
									<p style="font-weight:500;">{p.name}</p>
									<p style="font-size:12px;color:var(--muted);">{p.subtitle ?? ''}</p>
								</div>
							</div>
						</td>
						<td><span class="status-badge status-{p.status}">{p.status}</span></td>
						<td>{clp(p.price)}</td>
						<td style="color:{p.totalStock === 0 ? 'var(--danger)' : p.totalStock <= 3 ? 'var(--warning)' : 'inherit'}">{p.totalStock}</td>
						<td>
							<div style="display:flex;gap:8px;">
								<a href="/admin/productos/{p.id}" class="btn btn-ghost" style="padding:6px 12px;">Editar</a>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={p.id} />
									<button
										type="submit"
										class="btn btn-ghost"
										style="padding:6px 12px;color:var(--danger);"
										onclick={(e) => { if (!confirm('¿Eliminar este producto?')) e.preventDefault(); }}
									>Eliminar</button>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; }
.page-header h1 { font-size:22px; font-weight:600; }
</style>
