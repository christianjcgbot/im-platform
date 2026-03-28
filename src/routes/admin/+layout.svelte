<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';

	let { children } = $props();

	const nav = [
		{ label: 'Inicio', href: '/admin', icon: 'home', exact: true },
		{
			label: 'Pedidos', icon: 'bag', children: [
				{ label: 'Todos los pedidos', href: '/admin/pedidos' },
				{ label: 'Despachados', href: '/admin/pedidos/despachados' },
			]
		},
		{
			label: 'Productos', icon: 'box', children: [
				{ label: 'Todos los productos', href: '/admin/productos' },
				{ label: 'Inventario', href: '/admin/inventario' },
				{ label: 'Categorías', href: '/admin/categorias' },
			]
		},
		{ label: 'Configuración', href: '/admin/configuracion', icon: 'settings' },
	];

	let openMenus: Record<string, boolean> = $state({
		Pedidos: page.url.pathname.startsWith('/admin/pedidos'),
		Productos: page.url.pathname.startsWith('/admin/productos') || page.url.pathname.startsWith('/admin/inventario') || page.url.pathname.startsWith('/admin/categorias'),
	});

	function isActive(href: string, exact = false) {
		if (exact) return page.url.pathname === href;
		return page.url.pathname.startsWith(href);
	}
</script>

<div class="admin-shell">
	<!-- Sidebar -->
	<aside class="sidebar">
		<div class="sidebar-header">
			<a href="/" class="sidebar-logo" target="_blank" rel="noopener">
				<span class="sidebar-logo-mark">IM</span>
				<span class="sidebar-logo-label">Ver tienda ↗</span>
			</a>
		</div>

		<nav class="sidebar-nav">
			{#each nav as item}
				{#if item.children}
					<div class="nav-group">
						<button
							class="nav-item nav-parent"
							class:open={openMenus[item.label]}
							onclick={() => openMenus[item.label] = !openMenus[item.label]}
						>
							<span class="nav-icon">{@html icons[item.icon]}</span>
							<span>{item.label}</span>
							<span class="nav-chevron" class:rotated={openMenus[item.label]}>
								<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
							</span>
						</button>
						{#if openMenus[item.label]}
							<div class="nav-children">
								{#each item.children as child}
									<a
										href={child.href}
										class="nav-child"
										class:active={isActive(child.href)}
									>{child.label}</a>
								{/each}
							</div>
						{/if}
					</div>
				{:else}
					<a
						href={item.href}
						class="nav-item"
						class:active={isActive(item.href!, item.exact)}
					>
						<span class="nav-icon">{@html icons[item.icon!]}</span>
						<span>{item.label}</span>
					</a>
				{/if}
			{/each}
		</nav>

		<div class="sidebar-footer">
			<form method="POST" action="/admin/logout" use:enhance>
				<button type="submit" class="nav-item" style="width:100%;border:none;background:none;text-align:left;">
					<span class="nav-icon">{@html icons.logout}</span>
					<span>Cerrar sesión</span>
				</button>
			</form>
		</div>
	</aside>

	<!-- Content -->
	<main class="admin-content">
		{@render children()}
	</main>
</div>

<script module lang="ts">
	const icons: Record<string, string> = {
		home: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
		bag: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
		box: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
		settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
		logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
	};
</script>

<style>
.admin-shell {
	display: flex;
	min-height: 100vh;
}

/* ── Sidebar ── */
.sidebar {
	width: var(--sidebar-width);
	background: var(--sidebar-bg);
	display: flex;
	flex-direction: column;
	position: fixed;
	top: 0;
	left: 0;
	height: 100vh;
	overflow-y: auto;
	flex-shrink: 0;
}
.sidebar-header {
	padding: 20px 16px;
	border-bottom: 1px solid rgba(255,255,255,0.06);
}
.sidebar-logo {
	display: flex;
	align-items: center;
	gap: 10px;
	color: #fff;
}
.sidebar-logo-mark {
	font-size: 1.4rem;
	font-weight: 700;
	letter-spacing: -0.04em;
}
.sidebar-logo-label {
	font-size: 11px;
	color: var(--sidebar-text);
}
.sidebar-nav {
	flex: 1;
	padding: 12px 0;
}
.nav-item {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 16px;
	font-size: 13px;
	color: var(--sidebar-text);
	transition: background 0.15s, color 0.15s;
	border-radius: 0;
	cursor: pointer;
	width: 100%;
	text-align: left;
}
.nav-item:hover, .nav-item.open { background: var(--sidebar-hover); color: var(--sidebar-text-active); }
.nav-item.active { background: var(--sidebar-active); color: var(--sidebar-text-active); }
.nav-icon { display: flex; align-items: center; opacity: 0.7; }
.nav-parent { justify-content: flex-start; }
.nav-chevron { margin-left: auto; opacity: 0.5; transition: transform 0.2s; }
.nav-chevron.rotated { transform: rotate(180deg); }
.nav-children { background: rgba(0,0,0,0.15); }
.nav-child {
	display: block;
	padding: 8px 16px 8px 42px;
	font-size: 12.5px;
	color: var(--sidebar-text);
	transition: color 0.15s;
}
.nav-child:hover { color: var(--sidebar-text-active); }
.nav-child.active { color: #fff; font-weight: 500; }
.sidebar-footer {
	border-top: 1px solid rgba(255,255,255,0.06);
	padding: 8px 0;
}

/* ── Content ── */
.admin-content {
	margin-left: var(--sidebar-width);
	flex: 1;
	min-height: 100vh;
	padding: 32px;
}

@media (max-width: 768px) {
	.sidebar { display: none; }
	.admin-content { margin-left: 0; padding: 16px; }
}
</style>
