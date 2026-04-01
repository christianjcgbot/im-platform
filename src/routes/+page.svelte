<script lang="ts">
	import ShopHeader from '$lib/components/ShopHeader.svelte';
	import ShopFooter from '$lib/components/ShopFooter.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Colores conocidos → hex
	const COLOR_HEX: Record<string, { bg: string; outline?: boolean }> = {
		'Negro':  { bg: '#141414' },
		'Navy':   { bg: '#18293d' },
		'Blanco': { bg: '#e8e5e0', outline: true },
		'Burdeo': { bg: '#6b1f2a' },
		'Gris':   { bg: '#9ca3af' },
		'Rojo':   { bg: '#dc2626' },
		'Azul':   { bg: '#3b82f6' },
		'Verde':  { bg: '#22c55e' },
		'Beige':  { bg: '#d4c4a8', outline: true },
	};

	function colorHex(name: string) {
		return COLOR_HEX[name] ?? { bg: '#94a3b8' };
	}

	function clp(n: number) {
		return '$' + (n ?? 0).toLocaleString('es-CL');
	}

	type Cat = { id: string; name: string; slug: string; parent_id: string | null };
	let cats = $derived(data.categories as Cat[]);

	// Categorías raíz para los tabs principales
	let rootCats = $derived(cats.filter(c => !c.parent_id));

	// Categoría activa y su contexto padre/hijo para el submenu
	let activeCat   = $derived(cats.find(c => c.slug === data.currentCategory) ?? null);
	let parentCat   = $derived(
		activeCat?.parent_id
			? (cats.find(c => c.id === activeCat!.parent_id) ?? null)
			: activeCat
	);
	let subCats     = $derived(parentCat ? cats.filter(c => c.parent_id === parentCat!.id) : []);
	let showSubMenu = $derived(subCats.length > 0);
</script>

<svelte:head>
	<title>Colección — IM Sportswear</title>
	<meta name="description" content="IM Sportswear — Sportswear clásico y minimalista para la vida moderna." />
</svelte:head>

<ShopHeader categories={data.categories} />

<!-- Trust bar -->
<div class="trust-bar">
	<div class="shop-container trust-wrap">
		<div class="trust-item">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
			<span>Envío gratis sobre $50.000</span>
		</div>
		<div class="trust-item">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
			<span>Devolución 30 días</span>
		</div>
		<div class="trust-item">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
			<span>Pago 100% seguro</span>
		</div>
	</div>
</div>

<!-- Hero -->
<div class="shop-hero">
	<p class="shop-hero-eyebrow">IM Sportswear · Colección 2026</p>
	<h1>Colección</h1>
	<p class="shop-hero-sub">Classic · Sport · Modern Life</p>
</div>

<!-- Category tabs -->
{#if rootCats.length > 0}
<div class="shop-cats">
	<div class="shop-container">
		<div class="shop-cats-inner">
			<a href="/" class="cat-btn" class:active={data.currentCategory === 'all'}>Todos</a>
			{#each rootCats as cat}
				<a
					href="/?categoria={cat.slug}"
					class="cat-btn"
					class:active={data.currentCategory === cat.slug || parentCat?.slug === cat.slug}
				>{cat.name}</a>
			{/each}
		</div>
	</div>
</div>

{#if showSubMenu && parentCat}
<div class="shop-subcats">
	<div class="shop-container">
		<div class="shop-cats-inner">
			<a href="/?categoria={parentCat.slug}" class="subcat-btn" class:active={data.currentCategory === parentCat.slug}>
				Todo {parentCat.name}
			</a>
			{#each subCats as sub}
				<a href="/?categoria={sub.slug}" class="subcat-btn" class:active={data.currentCategory === sub.slug}>
					{sub.name}
				</a>
			{/each}
		</div>
	</div>
</div>
{/if}
{/if}

<!-- Product grid -->
<main id="contenido">
	<div class="shop-section">
		<div class="shop-container">
			<div class="product-grid">
				{#if data.products.length === 0}
					<div class="shop-empty">
						<p>Sin productos en esta categoría.</p>
					</div>
				{:else}
					{#each data.products as p}
						<a href="/productos/{p.slug}" class="product-card">
							<div class="card-img-wrap">
								{#if p.imageUrl}
									<img src={p.imageUrl} alt={p.name} loading="lazy" />
								{:else}
									<div class="card-placeholder">
										<span class="card-placeholder-mark">IM</span>
										<span class="card-placeholder-sub">{p.subtitle ?? ''}</span>
									</div>
								{/if}
								{#if p.totalStock === 0}
									<span class="card-badge card-badge-out">Agotado</span>
								{:else if p.featured}
									<span class="card-badge card-badge-new">Nuevo</span>
								{/if}
							</div>

							{#if p.colors.length > 0}
								<div class="card-colors">
									{#each p.colors as c}
										{@const ch = colorHex(c)}
										<span
											class="c-dot"
											class:c-dot-outline={ch.outline}
											style="background:{ch.bg}"
											title={c}
										></span>
									{/each}
								</div>
							{/if}

							{#if p.categories}
								<p class="card-cat">{p.categories.name}</p>
							{/if}
							<p class="card-name">{p.name}</p>
							<p class="card-price">
								{clp(p.price)}
								{#if p.compare_price}
									<span class="card-compare">{clp(p.compare_price)}</span>
								{/if}
							</p>
						</a>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</main>

<ShopFooter />
