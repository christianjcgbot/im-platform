<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Variant = {
		id: string;
		color: string;
		size: string;
		stock: number;
		low_stock_threshold: number;
		product_id: string;
		products: { id: string; name: string; status: string };
	};

	let variants = $state([...data.variants] as Variant[]);
	let filter = $state<'all' | 'low' | 'out'>('all');
	let saving = $state<Record<string, boolean>>({});
	let saved = $state<Record<string, boolean>>({});

	let filtered = $derived(
		filter === 'out' ? variants.filter(v => v.stock === 0) :
		filter === 'low' ? variants.filter(v => v.stock > 0 && v.stock <= v.low_stock_threshold) :
		variants
	);

	let grouped = $derived.by(() => {
		const map = new Map<string, { name: string; status: string; variants: Variant[] }>();
		for (const v of filtered) {
			const pid = v.product_id;
			if (!map.has(pid)) map.set(pid, { name: v.products.name, status: v.products.status, variants: [] });
			map.get(pid)!.variants.push(v);
		}
		return [...map.entries()].map(([id, g]) => ({ id, ...g }));
	});

	let totalStock = $derived(variants.reduce((s, v) => s + v.stock, 0));
	let outCount = $derived(variants.filter(v => v.stock === 0).length);
	let lowCount = $derived(variants.filter(v => v.stock > 0 && v.stock <= v.low_stock_threshold).length);

	async function saveVariant(v: Variant) {
		saving = { ...saving, [v.id]: true };
		const fd = new FormData();
		fd.append('id', v.id);
		fd.append('stock', String(v.stock));
		fd.append('low_stock_threshold', String(v.low_stock_threshold));
		await fetch('?/update_stock', { method: 'POST', body: fd });
		saving = { ...saving, [v.id]: false };
		saved = { ...saved, [v.id]: true };
		setTimeout(() => { saved = { ...saved, [v.id]: false }; }, 2000);
	}
</script>

<svelte:head><title>Inventario — IM Admin</title></svelte:head>

<div class="page-header">
	<h1>Inventario</h1>
	<div class="stats-row">
		<div class="stat-chip">
			<span class="stat-num">{totalStock}</span>
			<span class="stat-label">unidades totales</span>
		</div>
		{#if outCount > 0}
			<div class="stat-chip danger">
				<span class="stat-num">{outCount}</span>
				<span class="stat-label">sin stock</span>
			</div>
		{/if}
		{#if lowCount > 0}
			<div class="stat-chip warning">
				<span class="stat-num">{lowCount}</span>
				<span class="stat-label">stock bajo</span>
			</div>
		{/if}
	</div>
</div>

<div class="filter-tabs">
	<button class:active={filter === 'all'} onclick={() => filter = 'all'}>Todos</button>
	<button class:active={filter === 'low'} onclick={() => filter = 'low'}>
		Stock bajo
		{#if lowCount > 0}<span class="badge warning">{lowCount}</span>{/if}
	</button>
	<button class:active={filter === 'out'} onclick={() => filter = 'out'}>
		Sin stock
		{#if outCount > 0}<span class="badge danger">{outCount}</span>{/if}
	</button>
</div>

{#if grouped.length === 0}
	<div class="card" style="padding:48px;text-align:center;color:var(--muted);">
		No hay variantes que coincidan.
	</div>
{:else}
	{#each grouped as group}
		<div class="card" style="margin-bottom:12px;padding:0;overflow:hidden;">
			<div class="group-header">
				<div>
					<span class="group-name">{group.name}</span>
					<a href="/admin/productos/{group.id}" class="group-link">Editar producto →</a>
				</div>
				<span class="status-badge status-{group.status}">
					{group.status === 'available' ? 'Disponible' : group.status === 'draft' ? 'Borrador' : 'Agotado'}
				</span>
			</div>
			<table>
				<thead>
					<tr>
						<th>Color</th>
						<th>Talla</th>
						<th style="width:120px;">Stock</th>
						<th style="width:140px;">Alerta en ≤</th>
						<th style="width:110px;"></th>
					</tr>
				</thead>
				<tbody>
					{#each group.variants as v}
						<tr>
							<td>{v.color}</td>
							<td>{v.size}</td>
							<td>
								<input
									type="number"
									min="0"
									class="num-input"
									class:num-out={v.stock === 0}
									class:num-low={v.stock > 0 && v.stock <= v.low_stock_threshold}
									bind:value={v.stock}
								/>
							</td>
							<td>
								<input
									type="number"
									min="0"
									class="num-input"
									bind:value={v.low_stock_threshold}
								/>
							</td>
							<td>
								{#if saved[v.id]}
									<span class="saved-label">✓ Guardado</span>
								{:else}
									<button
										type="button"
										class="btn btn-ghost"
										style="padding:5px 14px;font-size:12px;"
										disabled={saving[v.id]}
										onclick={() => saveVariant(v)}
									>
										{saving[v.id] ? '…' : 'Guardar'}
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/each}
{/if}

<style>
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-header h1 { font-size:22px; font-weight:600; }
.stats-row { display:flex; gap:10px; }
.stat-chip { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:6px 14px; display:flex; flex-direction:column; align-items:center; min-width:80px; }
.stat-chip.danger { border-color:#fca5a5; background:#fef2f2; }
.stat-chip.warning { border-color:#fcd34d; background:#fffbeb; }
.stat-num { font-size:18px; font-weight:700; line-height:1; }
.stat-chip.danger .stat-num { color:var(--danger); }
.stat-chip.warning .stat-num { color:#d97706; }
.stat-label { font-size:11px; color:var(--muted); margin-top:2px; }
.filter-tabs { display:flex; gap:4px; margin-bottom:16px; border-bottom:1px solid var(--border); }
.filter-tabs button { background:none; border:none; padding:8px 16px; font-size:13px; cursor:pointer; color:var(--muted); border-bottom:2px solid transparent; margin-bottom:-1px; display:flex; align-items:center; gap:6px; }
.filter-tabs button.active { color:var(--navy); border-bottom-color:var(--navy); font-weight:500; }
.filter-tabs button:hover:not(.active) { color:var(--text); }
.badge { font-size:10px; font-weight:700; padding:1px 6px; border-radius:10px; }
.badge.warning { background:#fef3c7; color:#92400e; }
.badge.danger { background:#fee2e2; color:#991b1b; }
.group-header { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; border-bottom:1px solid var(--border); background:var(--bg); }
.group-name { font-size:14px; font-weight:600; margin-right:12px; }
.group-link { font-size:12px; color:var(--navy); text-decoration:none; }
.group-link:hover { text-decoration:underline; }
.num-input { width:72px; border:1px solid var(--border); border-radius:6px; padding:5px 8px; font-size:14px; font-weight:600; text-align:center; background:#fff; }
.num-input:focus { outline:none; border-color:var(--navy); }
.num-input.num-out { color:var(--danger); border-color:#fca5a5; }
.num-input.num-low { color:#d97706; border-color:#fcd34d; }
.saved-label { font-size:12px; color:#16a34a; font-weight:500; }
</style>
