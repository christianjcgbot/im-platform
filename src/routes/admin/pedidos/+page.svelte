<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	const STATUSES = [
		{ value: 'all', label: 'Todos' },
		{ value: 'created', label: 'Creado' },
		{ value: 'preparing', label: 'En preparación' },
		{ value: 'shipped', label: 'Despachado' },
		{ value: 'delivered', label: 'Entregado' },
		{ value: 'cancelled', label: 'Cancelado' },
	];

	const STATUS_LABELS: Record<string, string> = {
		created: 'Creado',
		preparing: 'En preparación',
		shipped: 'Despachado',
		delivered: 'Entregado',
		cancelled: 'Cancelado',
	};

	function clp(n: number) {
		return '$' + n.toLocaleString('es-CL');
	}

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
	}
</script>

<svelte:head><title>Pedidos — IM Admin</title></svelte:head>

<div class="page-header">
	<h1>Pedidos</h1>
</div>

<!-- Tabs por estado -->
<div class="filter-tabs">
	{#each STATUSES as s}
		<a
			href="/admin/pedidos{s.value !== 'all' ? '?status=' + s.value : ''}"
			class:active={data.currentStatus === s.value}
		>
			{s.label}
			{#if s.value !== 'all' && data.statusCount[s.value]}
				<span class="tab-count">{data.statusCount[s.value]}</span>
			{/if}
		</a>
	{/each}
</div>

<div class="card" style="padding:0;overflow:hidden;">
	{#if data.orders.length === 0}
		<div style="padding:48px;text-align:center;color:var(--muted);">
			<p>No hay pedidos aún.</p>
		</div>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Pedido</th>
					<th>Cliente</th>
					<th>Total</th>
					<th>Pago</th>
					<th>Estado</th>
					<th>Fecha</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.orders as o}
					<tr onclick={() => window.location.href = `/admin/pedidos/${o.id}`} style="cursor:pointer;">
						<td style="font-weight:600;">#{o.order_number}</td>
						<td>
							<div style="font-weight:500;">{o.customer_name}</div>
							<div style="font-size:12px;color:var(--muted);">{o.customer_email}</div>
						</td>
						<td style="font-weight:600;">{clp(o.total)}</td>
						<td>
							<span class="pay-badge pay-{o.payment_status}">
								{o.payment_status === 'paid' ? 'Pagado' : o.payment_status === 'failed' ? 'Fallido' : 'Pendiente'}
							</span>
						</td>
						<td><span class="order-badge order-{o.status}">{STATUS_LABELS[o.status] ?? o.status}</span></td>
						<td style="font-size:12px;color:var(--muted);">{formatDate(o.created_at)}</td>
						<td onclick={(e) => e.stopPropagation()}>
							<a href="/admin/pedidos/{o.id}" class="btn btn-ghost" style="padding:6px 12px;">Ver</a>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
.page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
.page-header h1 { font-size:22px; font-weight:600; }
.filter-tabs { display:flex; gap:4px; margin-bottom:16px; border-bottom:1px solid var(--border); }
.filter-tabs a { text-decoration:none; padding:8px 16px; font-size:13px; color:var(--muted); border-bottom:2px solid transparent; margin-bottom:-1px; display:flex; align-items:center; gap:6px; }
.filter-tabs a.active { color:var(--navy); border-bottom-color:var(--navy); font-weight:500; }
.filter-tabs a:hover:not(.active) { color:var(--text); }
.tab-count { background:var(--navy); color:#fff; font-size:10px; font-weight:700; padding:1px 6px; border-radius:10px; }
/* Badges */
.order-badge, .pay-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; }
.order-badge.order-created { background:#e0f2fe; color:#0369a1; }
.order-badge.order-preparing { background:#fef3c7; color:#92400e; }
.order-badge.order-shipped { background:#ede9fe; color:#5b21b6; }
.order-badge.order-delivered { background:#dcfce7; color:#166534; }
.order-badge.order-cancelled { background:#fee2e2; color:#991b1b; }
.pay-badge.pay-paid { background:#dcfce7; color:#166534; }
.pay-badge.pay-pending { background:#f1f5f9; color:var(--muted); }
.pay-badge.pay-failed { background:#fee2e2; color:#991b1b; }
</style>
