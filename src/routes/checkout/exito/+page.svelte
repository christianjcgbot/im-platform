<script lang="ts">
	import ShopHeader from '$lib/components/ShopHeader.svelte';
	import ShopFooter from '$lib/components/ShopFooter.svelte';
	import { onMount } from 'svelte';
	import { cart } from '$lib/cart.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let o           = $state(data.order);
	let addr        = $derived(o.shipping_address as Record<string, string> | null);
	let isPaid      = $derived(o.payment_status === 'paid');
	let confirming  = $state(false);

	onMount(async () => {
		// Flujo 3DS: SumUp redirige directamente aquí sin pasar por onResponse del widget
		// Si el pago sigue pendiente y tenemos checkout_id, confirmamos ahora
		const checkoutId = (o as Record<string, unknown>).sumup_checkout_id as string | null;
		if (o.payment_status === 'pending' && checkoutId) {
			confirming = true;
			try {
				const res = await fetch('/api/sumup/confirm', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ checkoutId, orderId: o.id })
				});
				const json = await res.json();
				if (json.ok) {
					o = { ...o, payment_status: 'paid', status: 'preparing' };
					cart.clear();
				}
			} catch (e) {
				console.warn('confirm error:', e);
			} finally {
				confirming = false;
			}
		} else if (o.payment_status === 'paid') {
			cart.clear();
		}
	});

	function clp(n: number) {
		return '$' + (n ?? 0).toLocaleString('es-CL');
	}
	function formatDate(ts: string) {
		return new Date(ts).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
	}
</script>

<svelte:head>
	<title>Pedido #{o.order_number} confirmado — IM Sportswear</title>
</svelte:head>

<ShopHeader categories={[]} />

<main id="contenido" class="exito-page">
	<div class="shop-container">
		<div class="exito-wrap">

			<!-- Banner de estado de pago -->
			{#if confirming}
				<div class="exito-banner exito-banner-pending">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
					<div>
						<strong>Verificando pago…</strong>
						<span>Estamos confirmando tu pago con SumUp, un momento.</span>
					</div>
				</div>
			{:else if !isPaid}
				<div class="exito-banner exito-banner-pending">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
					<div>
						<strong>Pago pendiente</strong>
						<span>El pago aún no se ha procesado. Finaliza el proceso de pago para completar el pedido.</span>
					</div>
				</div>
			{:else}
				<div class="exito-banner exito-banner-paid">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
					<div>
						<strong>Pago confirmado</strong>
						<span>Tu pago fue procesado correctamente. Ya estamos preparando tu pedido.</span>
					</div>
				</div>
			{/if}

			<!-- Encabezado -->
			<div class="exito-header">
				<h1 class="exito-title">¡Gracias, {o.customer_name.split(' ')[0]}!</h1>
				<p class="exito-subtitle">¡Tu pedido ha sido realizado!</p>
				<p class="exito-email-note">
					Se enviará una copia de tu recibo a <strong>{o.customer_email}</strong>
				</p>
			</div>

			<div class="exito-layout">

				<!-- Columna principal -->
				<div class="exito-main">

					<!-- Recibo del pedido -->
					<div class="exito-card">
						<div class="exito-card-title">
							<span>Recibo del pedido</span>
							<span class="exito-order-num">#{o.order_number}</span>
						</div>
						<div class="exito-card-body">
							<div class="exito-meta-row">
								<span class="exito-meta-label">Fecha</span>
								<span>{formatDate(o.created_at)}</span>
							</div>
							<div class="exito-meta-row">
								<span class="exito-meta-label">Estado del pedido</span>
								<span class="exito-status-badge exito-status-{o.status}">
									{#if o.status === 'created'}Creado
									{:else if o.status === 'preparing'}En preparación
									{:else if o.status === 'shipped'}Despachado
									{:else if o.status === 'delivered'}Entregado
									{:else if o.status === 'cancelled'}Cancelado
									{:else}{o.status}{/if}
								</span>
							</div>
							<div class="exito-meta-row">
								<span class="exito-meta-label">Forma de pago</span>
								<span>SumUp · <span class="exito-payment-{o.payment_status}">
									{#if o.payment_status === 'paid'}Pagado
									{:else if o.payment_status === 'pending'}Pendiente
									{:else if o.payment_status === 'failed'}Fallido
									{:else}{o.payment_status}{/if}
								</span></span>
							</div>
						</div>
					</div>

					<!-- Dirección de despacho -->
					{#if addr}
						<div class="exito-card">
							<div class="exito-card-title">Dirección de envío</div>
							<div class="exito-card-body">
								<p class="exito-addr-name">{o.customer_name}</p>
								{#if addr.street}<p>{addr.street}</p>{/if}
								{#if addr.city || addr.region}<p>{[addr.city, addr.region].filter(Boolean).join(', ')}</p>{/if}
								<p>{addr.country ?? 'Chile'}</p>
							</div>
						</div>
					{/if}

					<!-- Resumen del pedido -->
					<div class="exito-card">
						<div class="exito-card-title">
							<span>Resumen del pedido</span>
							<span class="exito-item-count">{data.items.length} {data.items.length === 1 ? 'artículo' : 'artículos'}</span>
						</div>
						<div class="exito-items">
							{#each data.items as item (item.id)}
								<div class="exito-item">
									<div class="exito-item-img">
										{#if item.product_image}
											<img src={item.product_image} alt={item.product_name} />
										{/if}
									</div>
									<div class="exito-item-body">
										<p class="exito-item-name">{item.product_name}</p>
										<p class="exito-item-meta">{item.color} · {item.size} · Cant. {item.quantity}</p>
									</div>
									<span class="exito-item-price">{clp(item.total)}</span>
								</div>
							{/each}
						</div>

						<div class="exito-totals">
							<div class="exito-total-row">
								<span>Subtotal</span>
								<span>{clp(o.subtotal)}</span>
							</div>
							<div class="exito-total-row">
								<span>Costo de envío</span>
								<span>{o.shipping_cost === 0 ? 'Gratis' : clp(o.shipping_cost)}</span>
							</div>
							<div class="exito-total-row">
								<span>IVA incluido (19%)</span>
								<span>{clp(o.iva)}</span>
							</div>
							<div class="exito-total-row exito-total-final">
								<span>Total</span>
								<span>{clp(o.total)}</span>
							</div>
						</div>
					</div>

					<p class="exito-contact-note">
						Si tienes alguna pregunta sobre tu pedido, contáctanos a
						<a href="mailto:hola@imsportswear.cl">hola@imsportswear.cl</a>
					</p>

					<div class="exito-actions">
						<a href="/" class="exito-btn">Seguir comprando</a>
					</div>

				</div>

			</div>
		</div>
	</div>
</main>

<ShopFooter />

<style>
.exito-page { padding: 48px 0 80px; min-height: 60vh; }
.exito-wrap { max-width: 680px; margin: 0 auto; }

/* Banner */
.exito-banner {
	display: flex; align-items: flex-start; gap: 12px;
	padding: 14px 18px; border-radius: 6px; margin-bottom: 28px;
	font-size: 13.5px; line-height: 1.5;
}
.exito-banner svg { flex-shrink: 0; margin-top: 2px; }
.exito-banner div { display: flex; flex-direction: column; gap: 2px; }
.exito-banner strong { font-weight: 700; }
.exito-banner span { opacity: 0.85; }
.exito-banner-pending { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
.exito-banner-paid    { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; }

/* Header */
.exito-header { margin-bottom: 28px; }
.exito-title {
	font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
	font-size: clamp(26px, 5vw, 36px); font-weight: 600;
	color: var(--shop-navy, #18293d); margin-bottom: 6px;
}
.exito-subtitle { font-size: 15px; color: var(--shop-navy, #18293d); margin-bottom: 6px; }
.exito-email-note { font-size: 13px; color: var(--shop-muted, #64748b); }
.exito-email-note strong { color: var(--shop-navy, #18293d); }

/* Cards */
.exito-card {
	background: #fff; border: 1px solid var(--shop-line, #e8e4df);
	border-radius: 6px; overflow: hidden; margin-bottom: 16px;
}
.exito-card-title {
	display: flex; justify-content: space-between; align-items: center;
	padding: 14px 20px; background: #f7f6f4;
	border-bottom: 1px solid var(--shop-line, #e8e4df);
	font-size: 13px; font-weight: 700; color: var(--shop-navy, #18293d);
}
.exito-order-num { font-size: 14px; font-weight: 700; }
.exito-item-count { font-size: 12px; font-weight: 500; color: var(--shop-muted, #64748b); }
.exito-card-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
.exito-card-body p { font-size: 13.5px; color: var(--shop-navy, #18293d); line-height: 1.5; margin: 0; }
.exito-addr-name { font-weight: 600; }

.exito-meta-row {
	display: flex; justify-content: space-between; align-items: center;
	font-size: 13px; color: var(--shop-navy, #18293d);
}
.exito-meta-label { color: var(--shop-muted, #64748b); }

/* Status badges */
.exito-status-badge {
	display: inline-block; padding: 2px 10px; border-radius: 20px;
	font-size: 11.5px; font-weight: 700;
}
.exito-status-created   { background: #e0f2fe; color: #0369a1; }
.exito-status-preparing { background: #fef3c7; color: #92400e; }
.exito-status-shipped   { background: #ede9fe; color: #5b21b6; }
.exito-status-delivered { background: #dcfce7; color: #166534; }
.exito-status-cancelled { background: #fee2e2; color: #991b1b; }

.exito-payment-paid    { color: #16a34a; font-weight: 600; }
.exito-payment-pending { color: #d97706; }
.exito-payment-failed  { color: #dc2626; }

/* Items */
.exito-items { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
.exito-item { display: flex; align-items: center; gap: 12px; }
.exito-item-img {
	width: 52px; height: 52px; border-radius: 4px;
	background: #e8e4df; flex-shrink: 0; overflow: hidden;
}
.exito-item-img img { width: 100%; height: 100%; object-fit: cover; }
.exito-item-body { flex: 1; }
.exito-item-name { font-size: 13.5px; font-weight: 500; color: var(--shop-navy, #18293d); }
.exito-item-meta { font-size: 12px; color: var(--shop-muted, #64748b); margin-top: 2px; }
.exito-item-price { font-size: 13px; font-weight: 600; color: var(--shop-navy, #18293d); white-space: nowrap; }

/* Totals */
.exito-totals {
	border-top: 1px solid var(--shop-line, #e8e4df); padding: 14px 20px;
	display: flex; flex-direction: column; gap: 8px;
}
.exito-total-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--shop-navy, #18293d); }
.exito-total-final { font-weight: 700; font-size: 15px; padding-top: 10px; border-top: 1px solid var(--shop-line, #e8e4df); margin-top: 4px; }

/* Bottom */
.exito-contact-note { font-size: 12.5px; color: var(--shop-muted, #64748b); text-align: center; margin: 8px 0 20px; }
.exito-contact-note a { color: var(--shop-navy, #18293d); }

.exito-actions { display: flex; justify-content: center; }
.exito-btn {
	display: inline-block; padding: 13px 36px;
	background: var(--shop-navy, #18293d); color: #fff;
	border-radius: 4px; font-size: 13px; font-weight: 600;
	letter-spacing: 0.06em; text-transform: uppercase;
	transition: background 0.15s;
}
.exito-btn:hover { background: #0f172a; }

@media (max-width: 600px) {
	.exito-page { padding: 24px 0 60px; }
	.exito-banner { flex-direction: column; gap: 8px; }
}
</style>
