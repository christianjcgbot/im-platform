<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const STATUS_OPTIONS = [
		{ value: 'created', label: 'Creado' },
		{ value: 'preparing', label: 'En preparación' },
		{ value: 'shipped', label: 'Despachado' },
		{ value: 'delivered', label: 'Entregado' },
		{ value: 'cancelled', label: 'Cancelado' },
	];

	const STATUS_LABELS: Record<string, string> = {
		created: 'Creado', preparing: 'En preparación',
		shipped: 'Despachado', delivered: 'Entregado', cancelled: 'Cancelado',
	};

	function clp(n: number) {
		return '$' + (n ?? 0).toLocaleString('es-CL');
	}

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('es-CL', {
			day: '2-digit', month: 'short', year: 'numeric',
			hour: '2-digit', minute: '2-digit'
		});
	}

	let comment = $state('');
	let selectedStatus = $state(data.order.status);
	let addr = $derived((data.order.shipping_address ?? {}) as Record<string, string>);
</script>

<svelte:head><title>Pedido #{data.order.order_number} — IM Admin</title></svelte:head>

<div class="page-header">
	<div>
		<a href="/admin/pedidos" style="font-size:13px;color:var(--muted);">← Pedidos</a>
		<h1 style="margin-top:4px;">Pedido #{data.order.order_number}</h1>
		<div style="margin-top:4px;font-size:13px;color:var(--muted);">{formatDate(data.order.created_at)}</div>
	</div>
	<span class="order-badge order-{data.order.status}" style="font-size:13px;padding:6px 16px;">
		{STATUS_LABELS[data.order.status]}
	</span>
</div>

{#if form?.error}
	<div class="error-banner">{form.error}</div>
{/if}

<div class="order-layout">

	<!-- Columna principal -->
	<div class="order-main">

		<!-- Productos -->
		<div class="card">
			<h3 class="section-title">Productos</h3>
			<table class="items-table">
				<thead>
					<tr>
						<th>Producto</th>
						<th>SKU</th>
						<th style="text-align:right;">Precio</th>
						<th style="text-align:right;">Subtotal</th>
					</tr>
				</thead>
				<tbody>
					{#each data.items as item}
						<tr>
							<td>
								<div style="display:flex;align-items:center;gap:12px;">
									{#if item.product_image}
										<img src={item.product_image} alt={item.product_name} style="width:44px;height:44px;object-fit:cover;border-radius:4px;border:1px solid var(--border);" />
									{:else}
										<div style="width:44px;height:44px;background:var(--bg);border-radius:4px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--muted);">IM</div>
									{/if}
									<div>
										<div style="font-weight:500;">{item.product_name}</div>
										{#if item.color || item.size}
											<div style="font-size:12px;color:var(--muted);">{[item.color, item.size].filter(Boolean).join(' · ')}</div>
										{/if}
									</div>
								</div>
							</td>
							<td style="font-size:12px;color:var(--muted);">{item.sku ?? '—'}</td>
							<td style="text-align:right;">{clp(item.unit_price)} × {item.quantity}</td>
							<td style="text-align:right;font-weight:600;">{clp(item.total)}</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<td colspan="3" style="text-align:right;color:var(--muted);font-size:13px;">Subtotal</td>
						<td style="text-align:right;">{clp(data.order.subtotal)}</td>
					</tr>
					<tr>
						<td colspan="3" style="text-align:right;color:var(--muted);font-size:13px;">IVA (19% incluido)</td>
						<td style="text-align:right;">{clp(data.order.iva)}</td>
					</tr>
					<tr>
						<td colspan="3" style="text-align:right;color:var(--muted);font-size:13px;">Envío (sin IVA)</td>
						<td style="text-align:right;">{clp(data.order.shipping_cost)}</td>
					</tr>
					<tr class="total-row">
						<td colspan="3" style="text-align:right;font-weight:700;font-size:15px;">Total</td>
						<td style="text-align:right;font-weight:700;font-size:15px;">{clp(data.order.total)}</td>
					</tr>
				</tfoot>
			</table>
		</div>

		<!-- Direcciones -->
		<div class="address-grid" style="margin-top:16px;">
			<div class="card">
				<h3 class="section-title">Dirección de envío</h3>
				<div class="address-block">
					<p style="font-weight:600;">{data.order.customer_name}</p>
					{#if addr.street}<p>{addr.street}</p>{/if}
					{#if addr.city || addr.region}<p>{[addr.city, addr.region].filter(Boolean).join(', ')}</p>{/if}
					<p>{addr.country ?? 'Chile'}</p>
				</div>
			</div>
			<div class="card">
				<h3 class="section-title">Dirección de facturación</h3>
				<p style="font-size:13px;color:var(--muted);">Igual que la dirección de envío</p>
			</div>
		</div>

		<!-- Historial -->
		<div class="card" style="margin-top:16px;">
			<h3 class="section-title">Historial</h3>
			<div class="history-list">
				{#each data.history as h}
					<div class="history-item">
						<div class="history-dot"></div>
						<div class="history-content">
							{#if h.status}
								<span class="order-badge order-{h.status}" style="font-size:10px;padding:2px 8px;margin-bottom:4px;display:inline-block;">{STATUS_LABELS[h.status] ?? h.status}</span>
							{/if}
							<p>{h.comment}</p>
							<span class="history-time">{formatDate(h.created_at)}</span>
						</div>
					</div>
				{/each}
				{#if data.history.length === 0}
					<p style="color:var(--muted);font-size:13px;">Sin historial aún.</p>
				{/if}
			</div>

			<!-- Agregar comentario -->
			<form method="POST" action="?/add_comment" use:enhance style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);">
				<div style="display:flex;gap:8px;">
					<input name="comment" type="text" class="form-input" placeholder="Agregar comentario interno..." bind:value={comment} />
					<button type="submit" class="btn btn-ghost" style="white-space:nowrap;">+ Agregar</button>
				</div>
			</form>
		</div>
	</div>

	<!-- Sidebar -->
	<div class="order-sidebar">

		<!-- Info cliente -->
		<div class="card">
			<h3 class="section-title">Cliente</h3>
			<div class="info-row">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
				<span>{data.order.customer_name}</span>
			</div>
			<div class="info-row">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
				<a href="mailto:{data.order.customer_email}" style="color:var(--navy);text-decoration:none;">{data.order.customer_email}</a>
			</div>
			{#if data.order.customer_phone}
				<div class="info-row">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 9.76 19.79 19.79 0 01.03 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
					<span>{data.order.customer_phone}</span>
				</div>
			{/if}
		</div>

		<!-- Estado -->
		<div class="card" style="margin-top:12px;">
			<h3 class="section-title">Cambiar estado</h3>
			<form method="POST" action="?/update_status" use:enhance>
				<select name="status" class="form-select" bind:value={selectedStatus}>
					{#each STATUS_OPTIONS as s}
						<option value={s.value}>{s.label}</option>
					{/each}
				</select>
				<button type="submit" class="btn btn-primary" style="width:100%;margin-top:10px;">Actualizar estado</button>
			</form>
		</div>

		<!-- Pago -->
		<div class="card" style="margin-top:12px;">
			<h3 class="section-title">Pago</h3>
			<div class="info-row">
				<span class="pay-badge pay-{data.order.payment_status}">
					{data.order.payment_status === 'paid' ? 'Pagado' : data.order.payment_status === 'failed' ? 'Fallido' : 'Pendiente'}
				</span>
			</div>
			{#if data.order.payment_method}
				<p style="font-size:12px;color:var(--muted);margin-top:6px;">{data.order.payment_method}</p>
			{/if}
		</div>

		<!-- Despacho -->
		<div class="card" style="margin-top:12px;">
			<h3 class="section-title">Despacho</h3>
			<form method="POST" action="?/update_shipping" use:enhance>
				<div class="form-group">
					<label class="form-label">Proveedor</label>
					<select name="shipping_provider" class="form-select">
						<option value="">Sin asignar</option>
						<option value="chilexpress" selected={data.order.shipping_provider === 'chilexpress'}>Chilexpress</option>
						<option value="blue" selected={data.order.shipping_provider === 'blue'}>Blue Express</option>
					</select>
				</div>
				<div class="form-group" style="margin-bottom:0;">
					<label class="form-label">Número de tracking</label>
					<input
						name="tracking_id"
						type="text"
						class="form-input"
						value={data.order.tracking_id ?? ''}
						placeholder="ej: 1234567890"
					/>
				</div>
				{#if data.order.tracking_id}
					<div style="margin-top:8px;">
						{#if data.order.shipping_provider === 'chilexpress'}
							<a href="https://www.chilexpress.cl/tracking/{data.order.tracking_id}" target="_blank" class="tracking-link">Ver tracking Chilexpress →</a>
						{:else if data.order.shipping_provider === 'blue'}
							<a href="https://www.blueexpress.com/tracking/{data.order.tracking_id}" target="_blank" class="tracking-link">Ver tracking Blue Express →</a>
						{/if}
					</div>
				{/if}
				<button type="submit" class="btn btn-ghost" style="width:100%;margin-top:12px;">Guardar despacho</button>
			</form>
		</div>

		{#if data.order.notes}
			<div class="card" style="margin-top:12px;">
				<h3 class="section-title">Notas</h3>
				<p style="font-size:13px;color:var(--muted);">{data.order.notes}</p>
			</div>
		{/if}
	</div>
</div>

<style>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; }
.page-header h1 { font-size:22px; font-weight:600; }
.error-banner { background:#fee2e2; color:var(--danger); padding:12px 16px; border-radius:6px; margin-bottom:16px; font-size:13px; }
.section-title { font-size:13px; font-weight:600; margin-bottom:12px; }
.order-layout { display:grid; grid-template-columns:1fr 280px; gap:20px; align-items:start; }
.order-sidebar { display:flex; flex-direction:column; }
/* Items table */
.items-table { width:100%; border-collapse:collapse; }
.items-table th { font-size:11px; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); font-weight:500; padding:8px 0; border-bottom:1px solid var(--border); text-align:left; }
.items-table td { padding:12px 0; border-bottom:1px solid var(--border); font-size:14px; vertical-align:middle; }
.items-table tfoot td { border-bottom:none; padding:6px 0; font-size:13px; }
.items-table .total-row td { padding-top:12px; border-top:1px solid var(--border); }
/* Addresses */
.address-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.address-block p { font-size:13px; margin-bottom:3px; }
/* History */
.history-list { display:flex; flex-direction:column; gap:12px; }
.history-item { display:flex; gap:12px; }
.history-dot { width:8px; height:8px; border-radius:50%; background:var(--navy); flex-shrink:0; margin-top:4px; }
.history-content p { font-size:13px; margin:2px 0; }
.history-time { font-size:11px; color:var(--muted); }
/* Info rows */
.info-row { display:flex; align-items:center; gap:8px; font-size:13px; margin-bottom:8px; }
/* Badges */
.order-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; }
.order-badge.order-created { background:#e0f2fe; color:#0369a1; }
.order-badge.order-preparing { background:#fef3c7; color:#92400e; }
.order-badge.order-shipped { background:#ede9fe; color:#5b21b6; }
.order-badge.order-delivered { background:#dcfce7; color:#166534; }
.order-badge.order-cancelled { background:#fee2e2; color:#991b1b; }
.pay-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; text-transform:uppercase; }
.pay-badge.pay-paid { background:#dcfce7; color:#166534; }
.pay-badge.pay-pending { background:#f1f5f9; color:var(--muted); }
.pay-badge.pay-failed { background:#fee2e2; color:#991b1b; }
.tracking-link { font-size:12px; color:var(--navy); text-decoration:none; }
.tracking-link:hover { text-decoration:underline; }
@media (max-width:900px) {
	.order-layout { grid-template-columns:1fr; }
	.address-grid { grid-template-columns:1fr; }
}
</style>
