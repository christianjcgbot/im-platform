<script lang="ts">
	import { onMount } from 'svelte';
	import { cart, initCart, clp } from '$lib/cart.svelte';

	let { categories = [] }: { categories: Array<{ id: string; name: string; slug: string; parent_id: string | null }> } = $props();

	let menuOpen = $state(false);

	// Root categories only (parent_id = null)
	let rootCats = $derived(categories.filter(c => !c.parent_id));

	onMount(() => {
		initCart();
	});
</script>

<!-- Cart overlay -->
<div
	class="cart-overlay"
	class:open={cart.open}
	onclick={() => cart.hide()}
	role="presentation"
></div>

<!-- Cart drawer -->
<div class="cart-drawer" class:open={cart.open} aria-label="Carrito">
	<div class="cart-header">
		<span class="cart-title">Carrito</span>
		<button class="cart-close" onclick={() => cart.hide()} aria-label="Cerrar carrito">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
		</button>
	</div>

	<div class="cart-items">
		{#if cart.items.length === 0}
			<div class="cart-empty">
				<div class="cart-empty-icon">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M6 8h12l-1 12H7L6 8Zm3-1V6a3 3 0 1 1 6 0v1"/></svg>
				</div>
				<p>Tu carrito está vacío</p>
			</div>
		{:else}
			{#each cart.items as item (item.variantId)}
				<div class="cart-item">
					<div class="cart-item-img">
						{#if item.imageUrl}
							<img src={item.imageUrl} alt={item.productName} />
						{/if}
					</div>
					<div class="cart-item-body">
						<p class="cart-item-name">{item.productName}</p>
						<p class="cart-item-meta">{item.color} · {item.size}</p>
						<div class="cart-item-row">
							<span class="cart-item-price">{clp(item.price * item.quantity)}</span>
							<div style="display:flex;align-items:center;gap:12px;">
								<div style="display:flex;align-items:center;gap:6px;">
									<button
										style="width:22px;height:22px;border:1px solid rgba(24,41,61,0.15);background:none;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;"
										onclick={() => cart.update(item.variantId, item.quantity - 1)}
									>−</button>
									<span style="font-size:13px;min-width:16px;text-align:center;">{item.quantity}</span>
									<button
										style="width:22px;height:22px;border:1px solid rgba(24,41,61,0.15);background:none;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;"
										onclick={() => cart.update(item.variantId, item.quantity + 1)}
									>+</button>
								</div>
								<button class="cart-item-remove" onclick={() => cart.remove(item.variantId)}>Eliminar</button>
							</div>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if cart.items.length > 0}
		<div class="cart-footer">
			<div class="cart-subtotal">
				<span class="cart-subtotal-label">Total</span>
				<span class="cart-subtotal-value">{clp(cart.total)}</span>
			</div>
			<a href="/checkout" class="cart-checkout-btn">Ir al checkout</a>
		</div>
	{/if}
</div>

<!-- Header -->
<header class="site-header">
	<div class="shop-container nav-wrap">
		<!-- Nav izquierdo -->
		<nav class="site-nav" class:open={menuOpen} aria-label="Categorías">
			<ul id="site-menu" class="menu-left">
				<li><a href="/" onclick={() => menuOpen = false}>Todos</a></li>
				{#each rootCats as cat}
					<li><a href="/?categoria={cat.slug}" onclick={() => menuOpen = false}>{cat.name}</a></li>
				{/each}
			</ul>
		</nav>

		<!-- Logo centro -->
		<div class="brand-mark">
			<a href="/" class="brand-logo">IM</a>
			<span class="brand-tagline">Classic · Sport · Modern Life</span>
		</div>

		<!-- Acciones derecha -->
		<div class="nav-actions">
			<button
				class="bag-btn"
				onclick={() => cart.toggle()}
				aria-label="Abrir carrito"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
					<path d="M6 8h12l-1 12H7L6 8Zm3-1V6a3 3 0 1 1 6 0v1"/>
				</svg>
				{#if cart.count > 0}
					<span class="bag-count">{cart.count}</span>
				{/if}
			</button>

			<button
				class="menu-toggle"
				type="button"
				aria-expanded={menuOpen}
				aria-controls="site-menu"
				aria-label="Menú"
				onclick={() => menuOpen = !menuOpen}
			>
				<span></span><span></span><span></span>
			</button>
		</div>
	</div>
</header>
