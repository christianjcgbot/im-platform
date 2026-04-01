<script lang="ts">
	import ShopHeader from '$lib/components/ShopHeader.svelte';
	import ShopFooter from '$lib/components/ShopFooter.svelte';
	import { cart, clp } from '$lib/cart.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let p = $derived(data.product);
	let variants = $derived(data.variants);

	// Color → hex
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

	// Galería — filtra por color seleccionado si hay imágenes taggeadas
	let images = $derived(data.images);
	let activeImgIdx = $state(0);

	let imagesForColor = $derived.by(() => {
		if (!selectedColor) return images;
		const tagged = images.filter((img: { color?: string }) => img.color === selectedColor);
		return tagged.length > 0 ? tagged : images;
	});

	let activeImg = $derived(imagesForColor[activeImgIdx]?.url ?? null);


	// Variant state
	let colors = $derived([...new Set(variants.map(v => v.color))]);
	let selectedColor = $state<string | null>(null);
	let selectedSize = $state<string | null>(null);

	// Auto-seleccionar primer color con stock al cargar
	onMount(() => {
		const first = colors.find(c =>
			variants.some(v => v.color === c && v.stock > 0)
		) ?? colors[0] ?? null;
		selectedColor = first;
	});

	let sizesForColor = $derived.by(() => {
		const seen = new Set<string>();
		return variants.filter((v: { color: string; size: string; stock: number; id: string; low_stock_threshold?: number }) => {
			if (v.color !== selectedColor) return false;
			if (seen.has(v.size)) return false;
			seen.add(v.size);
			return true;
		});
	});

	// Si solo hay una talla "Única", auto-seleccionar
	let autoSingleSize = $derived(
		sizesForColor.length === 1 && sizesForColor[0].size === 'Única'
	);

	let selectedVariant = $derived(
		variants.find(v => v.color === selectedColor && v.size === (autoSingleSize ? 'Única' : selectedSize))
	);

	let canBuy = $derived(!!selectedVariant && selectedVariant.stock > 0);

	let stockLabel = $derived.by(() => {
		if (!selectedVariant) return '';
		if (selectedVariant.stock === 0) return 'out';
		const threshold = selectedVariant.low_stock_threshold ?? 3;
		if (selectedVariant.stock <= threshold) return 'low';
		return 'ok';
	});

	let stockText = $derived.by(() => {
		if (!selectedVariant) return '';
		if (selectedVariant.stock === 0) return 'Sin stock en esta talla';
		const threshold = selectedVariant.low_stock_threshold ?? 3;
		if (selectedVariant.stock <= threshold) return `Últimas ${selectedVariant.stock} unidades`;
		return 'Disponible';
	});

	// Reset talla al cambiar color
	$effect(() => {
		selectedColor;
		selectedSize = null;
		activeImgIdx = 0;
	});

	function handleAddToCart() {
		if (!selectedVariant || !canBuy) return;
		cart.add({
			variantId: selectedVariant.id,
			productId: p.id,
			productName: p.name,
			slug: p.slug,
			color: selectedColor!,
			size: autoSingleSize ? 'Única' : selectedSize!,
			price: p.price,
			imageUrl: activeImg ?? (images[0]?.url ?? null)
		});
	}
</script>

<svelte:head>
	<title>{p.name} — IM Sportswear</title>
	<meta name="description" content={p.meta_description ?? p.subtitle ?? p.name} />
</svelte:head>

<ShopHeader categories={data.categories} />

<main id="contenido">
	<div class="shop-container">

		<!-- Breadcrumb -->
		<nav class="pdp-breadcrumb" aria-label="Breadcrumb">
			<a href="/">Colección</a>
			<span class="pdp-breadcrumb-sep">›</span>
			{#if p.categories}
				<a href="/?categoria={p.categories.slug}">{p.categories.name}</a>
				<span class="pdp-breadcrumb-sep">›</span>
			{/if}
			<span>{p.name}</span>
		</nav>

		<!-- PDP Layout -->
		<div class="pdp-layout">

			<!-- Media -->
			<div class="pdp-media">
				<div class="pdp-img-main">
					{#if activeImg}
						<img src={activeImg} alt={p.name} />
					{:else}
						<div class="pdp-img-placeholder">
							<span class="im-mark">IM</span>
							<span class="prod-ghost">{p.name}</span>
						</div>
					{/if}
				</div>

				{#if imagesForColor.length > 1}
					<div class="pdp-thumbs">
						{#each imagesForColor as img, i}
							<button
								class="pdp-thumb"
								class:active={activeImgIdx === i}
								onclick={() => activeImgIdx = i}
								aria-label="Imagen {i + 1}"
							>
								<img src={img.url} alt="{p.name} vista {i + 1}" />
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Info -->
			<div class="pdp-info">
				{#if p.categories}
					<p class="pdp-eyebrow">{p.categories.name}</p>
				{/if}
				<h1 class="pdp-name">{p.name}</h1>
				{#if p.subtitle}
					<p class="pdp-subtitle">{p.subtitle}</p>
				{/if}

				<div class="pdp-price-row">
					<span class="pdp-price">{clp(p.price)}</span>
					{#if p.compare_price}
						<span class="pdp-compare">{clp(p.compare_price)}</span>
					{/if}
				</div>

				<!-- Selectores de variante -->
				<div class="pdp-variants">
					<!-- Color -->
					{#if colors.length > 0}
						<div class="pdp-var-row">
							<div class="pdp-var-label">
								Color
								{#if selectedColor}
									<strong>{selectedColor}</strong>
								{/if}
							</div>
							<div class="pdp-var-opts">
								{#each colors as c}
									{@const ch = colorHex(c)}
									{@const hasStock = variants.some(v => v.color === c && v.stock > 0)}
									<button
										class="pdp-color-btn"
										class:sel={selectedColor === c}
										style="background:{ch.bg};{ch.outline ? 'border-color:#ccc;' : ''}"
										onclick={() => selectedColor = c}
										disabled={!hasStock}
										title={c}
										aria-label={c}
									></button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Talla (solo si hay más de una talla o no es "Única") -->
					{#if selectedColor && !autoSingleSize && sizesForColor.length > 0}
						<div class="pdp-var-row">
							<div class="pdp-var-label">
								Talla
								{#if selectedSize}
									<strong>{selectedSize}</strong>
								{/if}
							</div>
							<div class="pdp-var-opts">
								{#each sizesForColor as v}
									<button
										class="pdp-size-btn"
										class:sel={selectedSize === v.size}
										onclick={() => selectedSize = v.size}
										disabled={v.stock === 0}
									>{v.size}</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Stock indicator -->
				{#if selectedVariant}
					<p class="pdp-stock pdp-stock-{stockLabel}">
						{stockText}
					</p>
				{:else}
					<p class="pdp-stock">&nbsp;</p>
				{/if}

				<!-- CTA -->
				<button
					class="pdp-buy"
					disabled={!canBuy}
					onclick={handleAddToCart}
				>
					{#if !selectedColor}
						Selecciona un color
					{:else if !autoSingleSize && !selectedSize}
						Selecciona una talla
					{:else if !canBuy}
						Agotado
					{:else}
						Agregar al carrito — {clp(p.price)}
					{/if}
				</button>

				<!-- Envío -->
				<div class="pdp-shipping">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
					Despacho en 5 días hábiles · Envío gratis sobre $50.000
				</div>

				<!-- Descripción -->
				{#if p.description}
					<div class="pdp-description">
						<h3>Descripción</h3>
						<div class="pdp-description-body">
							{@html p.description}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</main>

<ShopFooter />
