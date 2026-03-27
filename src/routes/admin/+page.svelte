<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Dashboard — IM Admin</title></svelte:head>

<div class="page-header">
	<h1>Inicio</h1>
</div>

<div class="stats-grid">
	<div class="card stat-card">
		<p class="stat-label">Ventas hoy</p>
		<p class="stat-value">$0</p>
	</div>
	<div class="card stat-card">
		<p class="stat-label">Ventas esta semana</p>
		<p class="stat-value">$0</p>
	</div>
	<div class="card stat-card">
		<p class="stat-label">Pedidos pendientes</p>
		<p class="stat-value">0</p>
	</div>
	<div class="card stat-card">
		<p class="stat-label">Productos activos</p>
		<p class="stat-value">{data.productCount ?? 0}</p>
	</div>
</div>

{#if (data.lowStock ?? []).length > 0}
<div class="card" style="margin-top:24px;border-left:3px solid var(--warning);">
	<h3 style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--warning)">⚠ Stock bajo</h3>
	{#each data.lowStock as v}
		<p style="font-size:13px;color:var(--muted);margin-bottom:4px;">
			{v.product_name} · {v.color} {v.size} — <strong>{v.stock} unidad{v.stock === 1 ? '' : 'es'}</strong>
		</p>
	{/each}
</div>
{/if}

<div class="card" style="margin-top:24px;">
	<h3 style="font-size:13px;font-weight:600;margin-bottom:16px;">Últimos pedidos</h3>
	<p style="font-size:13px;color:var(--muted);">Sin pedidos aún.</p>
</div>

<style>
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 22px; font-weight: 600; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { }
.stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 700; color: var(--navy); }
@media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
