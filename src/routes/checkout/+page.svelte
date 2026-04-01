<script lang="ts">
	import { enhance, applyAction } from '$app/forms';
	import { tick } from 'svelte';
	import ShopHeader from '$lib/components/ShopHeader.svelte';
	import ShopFooter from '$lib/components/ShopFooter.svelte';
	import { cart, clp, initCart } from '$lib/cart.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let loading     = $state(false);
	let errorMsg    = $state('');
	let showForm    = $state(true);
	let showWidget  = $state(false);
	let orderId     = $state('');

	const REGIONES: Array<{ region: string; comunas: string[] }> = [
		{ region: 'Arica y Parinacota', comunas: ['Arica', 'Camarones', 'Putre', 'General Lagos'] },
		{ region: 'Tarapacá', comunas: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Camiña', 'Colchane', 'Huara', 'Pica'] },
		{ region: 'Antofagasta', comunas: ['Antofagasta', 'Mejillones', 'Sierra Gorda', 'Taltal', 'Calama', 'Ollague', 'San Pedro de Atacama', 'Tocopilla', 'María Elena'] },
		{ region: 'Atacama', comunas: ['Copiapó', 'Caldera', 'Tierra Amarilla', 'Chañaral', 'Diego de Almagro', 'Vallenar', 'Alto del Carmen', 'Freirina', 'Huasco'] },
		{ region: 'Coquimbo', comunas: ['La Serena', 'Coquimbo', 'Andacollo', 'La Higuera', 'Paiguano', 'Vicuña', 'Illapel', 'Canela', 'Los Vilos', 'Salamanca', 'Ovalle', 'Combarbalá', 'Monte Patria', 'Punitaqui', 'Río Hurtado'] },
		{ region: 'Valparaíso', comunas: ['Valparaíso', 'Casablanca', 'Concón', 'Juan Fernández', 'Puchuncaví', 'Quintero', 'Viña del Mar', 'Isla de Pascua', 'Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban', 'La Ligua', 'Cabildo', 'Papudo', 'Petorca', 'Zapallar', 'Quillota', 'Calera', 'Hijuelas', 'La Cruz', 'Nogales', 'San Antonio', 'Algarrobo', 'Cartagena', 'El Quisco', 'El Tabo', 'Santo Domingo', 'San Felipe', 'Catemu', 'Llaillay', 'Panquehue', 'Putaendo', 'Santa María', 'Quilpué', 'Limache', 'Olmué', 'Villa Alemana'] },
		{ region: "O'Higgins", comunas: ['Rancagua', 'Codegua', 'Coinco', 'Coltauco', 'Doñihue', 'Graneros', 'Las Cabras', 'Machalí', 'Malloa', 'Mostazal', 'Olivar', 'Peumo', 'Pichidegua', 'Quinta de Tilcoco', 'Rengo', 'Requínoa', 'San Vicente', 'Pichilemu', 'La Estrella', 'Litueche', 'Marchihue', 'Navidad', 'Paredones', 'San Fernando', 'Chépica', 'Chimbarongo', 'Lolol', 'Nancagua', 'Palmilla', 'Peralillo', 'Placilla', 'Pumanque', 'Santa Cruz'] },
		{ region: 'Maule', comunas: ['Talca', 'Constitución', 'Curepto', 'Empedrado', 'Maule', 'Pelarco', 'Pencahue', 'Río Claro', 'San Clemente', 'San Rafael', 'Cauquenes', 'Chanco', 'Pelluhue', 'Curicó', 'Hualañé', 'Licantén', 'Molina', 'Rauco', 'Romeral', 'Sagrada Familia', 'Teno', 'Vichuquén', 'Linares', 'Colbún', 'Longaví', 'Parral', 'Retiro', 'San Javier', 'Villa Alegre', 'Yerbas Buenas'] },
		{ region: 'Ñuble', comunas: ['Cobquecura', 'Coelemu', 'Ninhue', 'Portezuelo', 'Quirihue', 'Ránquil', 'Treguaco', 'Bulnes', 'Chillán Viejo', 'Chillán', 'El Carmen', 'Pemuco', 'Pinto', 'Quillón', 'San Ignacio', 'Yungay', 'Coihueco', 'Ñiquén', 'San Carlos', 'San Fabián', 'San Nicolás'] },
		{ region: 'Biobío', comunas: ['Concepción', 'Coronel', 'Chiguayante', 'Florida', 'Hualqui', 'Lota', 'Penco', 'San Pedro de la Paz', 'Santa Juana', 'Talcahuano', 'Tomé', 'Hualpén', 'Lebu', 'Arauco', 'Cañete', 'Contulmo', 'Curanilahue', 'Los Álamos', 'Tirúa', 'Los Ángeles', 'Antuco', 'Cabrero', 'Laja', 'Mulchén', 'Nacimiento', 'Negrete', 'Quilaco', 'Quilleco', 'San Rosendo', 'Santa Bárbara', 'Tucapel', 'Yumbel', 'Alto Biobío'] },
		{ region: 'La Araucanía', comunas: ['Temuco', 'Carahue', 'Cunco', 'Curarrehue', 'Freire', 'Galvarino', 'Gorbea', 'Lautaro', 'Loncoche', 'Melipeuco', 'Nueva Imperial', 'Padre las Casas', 'Perquenco', 'Pitrufquén', 'Pucón', 'Saavedra', 'Teodoro Schmidt', 'Toltén', 'Vilcún', 'Villarrica', 'Cholchol', 'Angol', 'Collipulli', 'Curacautín', 'Ercilla', 'Lonquimay', 'Los Sauces', 'Lumaco', 'Purén', 'Renaico', 'Traiguén', 'Victoria'] },
		{ region: 'Los Ríos', comunas: ['Valdivia', 'Corral', 'Lanco', 'Los Lagos', 'Máfil', 'Mariquina', 'Paillaco', 'Panguipulli', 'La Unión', 'Futrono', 'Lago Ranco', 'Río Bueno'] },
		{ region: 'Los Lagos', comunas: ['Puerto Montt', 'Calbuco', 'Cochamó', 'Fresia', 'Frutillar', 'Los Muermos', 'Llanquihue', 'Maullín', 'Puerto Varas', 'Castro', 'Ancud', 'Chonchi', 'Curaco de Vélez', 'Dalcahue', 'Puqueldón', 'Queilén', 'Quellón', 'Quemchi', 'Quinchao', 'Osorno', 'Puerto Octay', 'Purranque', 'Puyehue', 'Río Negro', 'San Juan de la Costa', 'San Pablo', 'Chaitén', 'Futaleufú', 'Hualaihué', 'Palena'] },
		{ region: 'Aysén', comunas: ['Coihaique', 'Lago Verde', 'Aysén', 'Cisnes', 'Guaitecas', 'Cochrane', "O'Higgins", 'Tortel', 'Chile Chico', 'Río Ibáñez'] },
		{ region: 'Magallanes', comunas: ['Punta Arenas', 'Laguna Blanca', 'Río Verde', 'San Gregorio', 'Cabo de Hornos', 'Antártica', 'Porvenir', 'Primavera', 'Timaukel', 'Natales', 'Torres del Paine'] },
		{ region: 'Región Metropolitana', comunas: ['Santiago', 'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central', 'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda', 'Peñalolén', 'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal', 'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón', 'Vitacura', 'Puente Alto', 'Pirque', 'San José de Maipo', 'Colina', 'Lampa', 'Tiltil', 'San Bernardo', 'Buin', 'Calera de Tango', 'Paine', 'Melipilla', 'Alhué', 'Curacaví', 'María Pinto', 'San Pedro', 'Talagante', 'El Monte', 'Isla de Maipo', 'Padre Hurtado', 'Peñaflor'] },
	];

	let selectedRegion   = $state('');
	let comunasForRegion = $derived(REGIONES.find(r => r.region === selectedRegion)?.comunas ?? []);

	let shippingCost = $derived(cart.total >= data.shipping.free_threshold ? 0 : data.shipping.cost);
	let orderTotal   = $derived(cart.total + shippingCost);

	onMount(() => { initCart(); });

	function handleSubmit({ formData, cancel }: { formData: FormData; cancel: () => void }) {
		errorMsg = '';

		if (cart.items.length === 0) {
			errorMsg = 'Tu carrito está vacío.';
			cancel();
			return;
		}

		formData.set('cart', JSON.stringify(cart.items));
		loading = true;

		return async ({ result }: { result: import('@sveltejs/kit').ActionResult }) => {
			loading = false;

			if (result.type === 'success') {
				const d = result.data as { checkoutId?: string; orderId?: string; devMode?: boolean };

				if (d?.devMode && d?.orderId) {
					try {
						await fetch('/api/test/simulate-payment', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ orderId: d.orderId })
						});
					} catch (e) { console.warn('simulate-payment error:', e); }
					cart.clear();
					window.location.href = `/checkout/exito?ref=${d.orderId}`;
					return;
				}

				if (d?.checkoutId && d?.orderId) {
					orderId = d.orderId;
					showForm = false;
					showWidget = true;
					await tick();

					const SumUpCard = (window as unknown as { SumUpCard?: { mount: (opts: unknown) => void } }).SumUpCard;
					if (!SumUpCard) {
						errorMsg = 'No se pudo cargar el formulario de pago. Recarga la página.';
						showForm = true;
						showWidget = false;
						return;
					}

					SumUpCard.mount({
						id:         'sumup-card',
						checkoutId: d.checkoutId,
						async onResponse(type: string, body: unknown) {
							console.log('SumUp response:', type, body);
							if (type === 'success' || type === 'sent') {
								// Obtener checkoutId del body si viene
								const bid = (body as Record<string, unknown>)?.id as string | undefined;
								const cid = bid ?? d.checkoutId!;
								// Confirmar pago en servidor (verifica con SumUp y actualiza DB)
								try {
									await fetch('/api/sumup/confirm', {
										method: 'POST',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({ checkoutId: cid, orderId })
									});
								} catch (e) {
									console.warn('confirm error:', e);
								}
								cart.clear();
								window.location.href = `/checkout/exito?ref=${orderId}`;
							} else if (type === 'error' || type === 'fail') {
								errorMsg = 'El pago fue rechazado. Verifica los datos de tu tarjeta e intenta de nuevo.';
								showWidget = false;
								showForm = true;
							}
						},
					});
					return;
				}
			}

			if (result.type === 'failure') {
				errorMsg = (result.data as { error?: string })?.error ?? 'Error desconocido.';
			} else {
				await applyAction(result);
			}
		};
	}
</script>

<svelte:head>
	<title>Checkout — IM Sportswear</title>
	<script src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js"></script>
</svelte:head>

<ShopHeader categories={[]} />

<main id="contenido" class="checkout-page">
	<div class="shop-container">

		{#if cart.items.length === 0 && showForm}
			<div class="checkout-empty">
				<p>Tu carrito está vacío.</p>
				<a href="/" class="checkout-back">Volver a la tienda</a>
			</div>
		{:else}
			<div class="checkout-layout">

				<!-- ── Columna izquierda ── -->
				<div class="checkout-form-col">
					<h1 class="checkout-title">Finalizar compra</h1>

					{#if errorMsg}
						<div class="checkout-error">{errorMsg}</div>
					{/if}

					{#if showForm}
						<form method="POST" action="?/create_order" use:enhance={handleSubmit}>

							<div class="co-section">
								<h2 class="co-section-title">Contacto</h2>
								<div class="co-grid">
									<div class="co-field co-full">
										<label for="name">Nombre completo *</label>
										<input id="name" name="name" type="text" required autocomplete="name" />
									</div>
									<div class="co-field">
										<label for="email">Email *</label>
										<input id="email" name="email" type="email" required autocomplete="email" />
									</div>
									<div class="co-field">
										<label for="phone">Teléfono *</label>
										<div class="phone-wrap">
											<span class="phone-prefix">🇨🇱 +56</span>
											<input id="phone" name="phone" type="tel" required autocomplete="tel" placeholder="9 XXXX XXXX" class="phone-input" />
										</div>
									</div>
								</div>
							</div>

							<div class="co-section">
								<h2 class="co-section-title">Dirección de despacho</h2>
								<div class="co-grid">
									<div class="co-field co-full">
										<label for="street">Calle y número *</label>
										<input id="street" name="street" type="text" required autocomplete="street-address" placeholder="Av. Ejemplo 1234, Depto 5B" />
									</div>
									<div class="co-field">
										<label for="region">Región *</label>
										<select id="region" name="region" required bind:value={selectedRegion}>
											<option value="">Selecciona una región</option>
											{#each REGIONES as r}
												<option value={r.region}>{r.region}</option>
											{/each}
										</select>
									</div>
									<div class="co-field">
										<label for="city">Comuna *</label>
										<select id="city" name="city" required disabled={!selectedRegion}>
											<option value="">{selectedRegion ? 'Selecciona una comuna' : 'Primero elige la región'}</option>
											{#each comunasForRegion as c}
												<option value={c}>{c}</option>
											{/each}
										</select>
									</div>
									<div class="co-field co-full">
										<label for="notes">Notas del pedido (opcional)</label>
										<textarea id="notes" name="notes" rows="2" placeholder="Instrucciones especiales de despacho..."></textarea>
									</div>
								</div>
							</div>

							<button type="submit" class="co-submit" disabled={loading}>
								{#if loading}
									<span class="co-spinner"></span>
									Procesando...
								{:else}
									Ir al pago — {clp(orderTotal)}
								{/if}
							</button>

							<p class="co-secure">
								<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
								Pago 100% seguro · Procesado por SumUp
							</p>
						</form>
					{/if}

					{#if showWidget}
						<div class="sumup-wrap">
							<h2 class="co-section-title" style="margin-bottom:20px;">Datos de pago</h2>
							<div id="sumup-card"></div>
							<button
								type="button"
								class="co-back-link"
								onclick={() => { showWidget = false; showForm = true; errorMsg = ''; }}
							>
								← Volver al formulario
							</button>
						</div>
					{/if}
				</div>

				<!-- ── Resumen del pedido ── -->
				<div class="checkout-summary-col">
					<div class="co-summary">
						<h2 class="co-summary-title">Tu pedido</h2>

						<div class="co-items">
							{#each cart.items as item (item.variantId)}
								<div class="co-item">
									<div class="co-item-img">
										{#if item.imageUrl}
											<img src={item.imageUrl} alt={item.productName} />
										{/if}
										<span class="co-item-qty">{item.quantity}</span>
									</div>
									<div class="co-item-body">
										<p class="co-item-name">{item.productName}</p>
										<p class="co-item-meta">{item.color} · {item.size}</p>
									</div>
									<span class="co-item-price">{clp(item.price * item.quantity)}</span>
								</div>
							{/each}
						</div>

						<div class="co-totals">
							<div class="co-total-row">
								<span>Subtotal</span>
								<span>{clp(cart.total)}</span>
							</div>
							<div class="co-total-row">
								<span>Envío</span>
								<span>
									{#if shippingCost === 0}
										<span class="co-free">Gratis</span>
									{:else}
										{clp(shippingCost)}
									{/if}
								</span>
							</div>
							<div class="co-total-row co-total-final">
								<span>Total</span>
								<span>{clp(orderTotal)}</span>
							</div>
							<p class="co-iva-note">IVA 19% incluido</p>
						</div>

						{#if shippingCost > 0}
							<p class="co-ship-hint">
								Agrega {clp(data.shipping.free_threshold - cart.total)} más para envío gratis.
							</p>
						{/if}

						<div class="co-dispatch">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
							Despacho en {data.shipping.days} días hábiles
						</div>
					</div>
				</div>

			</div>
		{/if}
	</div>
</main>

<ShopFooter />

<style>
.checkout-page { padding: 48px 0 80px; min-height: 60vh; }

.checkout-empty { text-align: center; padding: 80px 0; }
.checkout-empty p { font-size: 16px; color: var(--shop-muted, #64748b); margin-bottom: 20px; }
.checkout-back {
	display: inline-block; padding: 10px 24px;
	background: var(--shop-navy, #18293d); color: #fff;
	border-radius: 4px; font-size: 13px; letter-spacing: 0.06em;
}

.checkout-title {
	font-family: var(--font-display, 'Cormorant Garamond', Georgia, serif);
	font-size: clamp(24px, 4vw, 32px); font-weight: 600;
	letter-spacing: -0.01em; margin-bottom: 32px;
	color: var(--shop-navy, #18293d);
}

.checkout-layout { display: grid; grid-template-columns: 1fr 380px; gap: 48px; align-items: start; }

.checkout-error {
	background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
	padding: 12px 16px; border-radius: 6px; font-size: 13.5px; margin-bottom: 24px;
}

.co-section { margin-bottom: 32px; }
.co-section-title {
	font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
	text-transform: uppercase; color: var(--shop-muted, #64748b);
	margin-bottom: 16px; padding-bottom: 8px;
	border-bottom: 1px solid var(--shop-line, #e8e4df);
}

.co-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.co-full { grid-column: 1 / -1; }

.co-field { display: flex; flex-direction: column; gap: 5px; }
.co-field label { font-size: 12px; font-weight: 500; color: var(--shop-navy, #18293d); letter-spacing: 0.02em; }
.co-field input, .co-field select, .co-field textarea {
	padding: 10px 12px; border: 1px solid var(--shop-line, #e8e4df);
	border-radius: 4px; font-size: 14px; color: var(--shop-navy, #18293d);
	background: #fff; transition: border-color 0.15s;
	font-family: var(--font-ui, 'Inter', sans-serif);
}
.co-field input:focus, .co-field select:focus, .co-field textarea:focus {
	outline: none; border-color: var(--shop-navy, #18293d);
}
.co-field textarea { resize: vertical; min-height: 64px; }

.co-submit {
	width: 100%; padding: 16px;
	background: var(--shop-navy, #18293d); color: #fff;
	border: none; border-radius: 4px;
	font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
	cursor: pointer; transition: background 0.2s;
	display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 8px;
}
.co-submit:hover:not(:disabled) { background: #0f172a; }
.co-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.co-spinner {
	width: 16px; height: 16px;
	border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
	border-radius: 50%; animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.co-secure {
	display: flex; align-items: center; justify-content: center; gap: 5px;
	margin-top: 12px; font-size: 11.5px; color: var(--shop-muted, #64748b);
}

/* Widget SumUp */
.sumup-wrap { padding: 0; }
:global(#sumup-card) { width: 100%; }
.co-back-link {
	margin-top: 20px; background: none; border: none; cursor: pointer;
	font-size: 13px; color: var(--shop-muted, #64748b); padding: 0;
	text-decoration: underline;
}
.co-back-link:hover { color: var(--shop-navy, #18293d); }

/* Resumen */
.co-summary {
	background: #f7f6f4; border: 1px solid var(--shop-line, #e8e4df);
	border-radius: 6px; padding: 24px; position: sticky; top: 100px;
}
.co-summary-title {
	font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
	text-transform: uppercase; color: var(--shop-muted, #64748b); margin-bottom: 20px;
}

.co-items { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
.co-item { display: flex; align-items: center; gap: 12px; }
.co-item-img {
	position: relative; width: 56px; height: 56px;
	border-radius: 4px; overflow: hidden; background: #e8e4df; flex-shrink: 0;
}
.co-item-img img { width: 100%; height: 100%; object-fit: cover; }
.co-item-qty {
	position: absolute; top: -6px; right: -6px;
	width: 18px; height: 18px; background: var(--shop-navy, #18293d);
	color: #fff; border-radius: 50%; font-size: 10px; font-weight: 700;
	display: flex; align-items: center; justify-content: center;
}
.co-item-body { flex: 1; min-width: 0; }
.co-item-name { font-size: 13px; font-weight: 500; color: var(--shop-navy, #18293d); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.co-item-meta { font-size: 11.5px; color: var(--shop-muted, #64748b); margin-top: 2px; }
.co-item-price { font-size: 13px; font-weight: 600; color: var(--shop-navy, #18293d); white-space: nowrap; }

.co-totals { border-top: 1px solid var(--shop-line, #e8e4df); padding-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.co-total-row { display: flex; justify-content: space-between; font-size: 13px; color: var(--shop-navy, #18293d); }
.co-total-final { font-weight: 700; font-size: 15px; padding-top: 8px; border-top: 1px solid var(--shop-line, #e8e4df); margin-top: 4px; }
.co-free { color: #16a34a; font-weight: 600; }
.co-iva-note { font-size: 11px; color: var(--shop-muted, #64748b); text-align: right; margin-top: 4px; }
.co-ship-hint {
	font-size: 12px; color: #92400e; background: #fef3c7;
	padding: 8px 10px; border-radius: 4px; margin-top: 12px;
}
.co-dispatch { display: flex; align-items: center; gap: 6px; margin-top: 16px; font-size: 12px; color: var(--shop-muted, #64748b); }

.phone-wrap { display: flex; align-items: center; border: 1px solid var(--shop-line, #e8e4df); border-radius: 4px; overflow: hidden; background: #fff; }
.phone-prefix { padding: 10px 12px; font-size: 14px; background: #f7f6f4; border-right: 1px solid var(--shop-line, #e8e4df); white-space: nowrap; color: var(--shop-navy, #18293d); }
.phone-input { flex: 1; padding: 10px 12px; border: none; font-size: 14px; color: var(--shop-navy, #18293d); font-family: var(--font-ui, 'Inter', sans-serif); outline: none; }
.phone-input:focus { outline: none; }

@media (max-width: 900px) {
	.checkout-layout { grid-template-columns: 1fr; }
	.checkout-summary-col { order: -1; }
	.co-summary { position: static; }
}
@media (max-width: 560px) {
	.co-grid { grid-template-columns: 1fr; }
	.co-full { grid-column: 1; }
	.checkout-page { padding: 24px 0 60px; }
}
</style>
