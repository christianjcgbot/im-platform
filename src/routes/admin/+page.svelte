<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Dashboard — IM Admin</title></svelte:head>

<div class="page-header">
	<h1>Dashboard</h1>
</div>

<!-- Stats -->
<div class="stats-grid">
	<div class="stat-card">
		<div class="stat-icon stat-icon-green">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
		</div>
		<div class="stat-body">
			<p class="stat-label">Ventas hoy</p>
			<p class="stat-value">$0</p>
		</div>
	</div>

	<div class="stat-card">
		<div class="stat-icon stat-icon-blue">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
		</div>
		<div class="stat-body">
			<p class="stat-label">Ventas esta semana</p>
			<p class="stat-value">$0</p>
		</div>
	</div>

	<div class="stat-card">
		<div class="stat-icon stat-icon-amber">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
		</div>
		<div class="stat-body">
			<p class="stat-label">Pedidos pendientes</p>
			<p class="stat-value">0</p>
		</div>
	</div>

	<div class="stat-card">
		<div class="stat-icon stat-icon-navy">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
		</div>
		<div class="stat-body">
			<p class="stat-label">Productos activos</p>
			<p class="stat-value">{data.productCount ?? 0}</p>
		</div>
	</div>
</div>

<!-- Low stock alert -->
{#if (data.lowStock ?? []).length > 0}
<div class="alert-card">
	<div class="alert-header">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
		Stock bajo — {(data.lowStock ?? []).length} variante{(data.lowStock ?? []).length > 1 ? 's' : ''}
	</div>
	<div class="alert-list">
		{#each data.lowStock as v}
			<div class="alert-item">
				<span class="alert-product">{v.product_name}</span>
				<span class="alert-variant">{v.color} · {v.size}</span>
				<span class="alert-stock">{v.stock} ud.</span>
			</div>
		{/each}
	</div>
	<a href="/admin/inventario" class="alert-link">Ir a inventario →</a>
</div>
{/if}

<!-- Recent orders -->
<div class="section-block">
	<div class="section-block-header">
		<h2 class="section-block-title">Últimos pedidos</h2>
		<a href="/admin/pedidos" class="section-block-action">Ver todos →</a>
	</div>
	<div class="empty-state">
		<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
		<p>Sin pedidos aún</p>
	</div>
</div>

<style>
/* Stats */
.stats-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16px;
	margin-bottom: 28px;
}
.stat-card {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	padding: 20px;
	display: flex;
	align-items: flex-start;
	gap: 16px;
	box-shadow: var(--shadow-sm);
	transition: box-shadow 0.15s;
}
.stat-card:hover { box-shadow: var(--shadow-md); }

.stat-icon {
	width: 40px;
	height: 40px;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}
.stat-icon-green { background: #dcfce7; color: #16a34a; }
.stat-icon-blue  { background: #dbeafe; color: #2563eb; }
.stat-icon-amber { background: #fef3c7; color: #d97706; }
.stat-icon-navy  { background: #e0e7ff; color: #3730a3; }

.stat-body { flex: 1; min-width: 0; }
.stat-label {
	font-size: 11.5px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.06em;
	color: var(--muted);
	margin-bottom: 6px;
}
.stat-value {
	font-size: 26px;
	font-weight: 700;
	color: var(--text);
	letter-spacing: -0.03em;
	line-height: 1;
}

/* Alert card */
.alert-card {
	background: #fffbeb;
	border: 1px solid #fde68a;
	border-radius: var(--radius);
	padding: 18px 20px;
	margin-bottom: 24px;
}
.alert-header {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	font-weight: 600;
	color: #92400e;
	margin-bottom: 12px;
}
.alert-list {
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-bottom: 14px;
}
.alert-item {
	display: flex;
	align-items: center;
	gap: 10px;
	font-size: 12.5px;
}
.alert-product { font-weight: 600; color: #78350f; }
.alert-variant { color: #92400e; }
.alert-stock {
	margin-left: auto;
	background: #fde68a;
	color: #78350f;
	padding: 2px 8px;
	border-radius: 12px;
	font-size: 11.5px;
	font-weight: 700;
}
.alert-link {
	font-size: 12.5px;
	font-weight: 600;
	color: #92400e;
	text-decoration: underline;
	text-underline-offset: 3px;
}

/* Section block */
.section-block {
	background: var(--surface);
	border: 1px solid var(--border);
	border-radius: var(--radius);
	overflow: hidden;
	box-shadow: var(--shadow-sm);
}
.section-block-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18px 20px;
	border-bottom: 1px solid var(--border);
}
.section-block-title {
	font-size: 14px;
	font-weight: 600;
	color: var(--text);
}
.section-block-action {
	font-size: 12.5px;
	color: var(--muted);
	transition: color 0.15s;
}
.section-block-action:hover { color: var(--text); }

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 48px 24px;
	color: var(--muted);
}
.empty-state p {
	font-size: 13px;
}

@media (max-width: 900px) {
	.stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
