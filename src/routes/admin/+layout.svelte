<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';

	let { children } = $props();

	const nav = [
		{ label: 'Inicio', href: '/admin', icon: 'home', exact: true },
		{ divider: 'Gestión' },
		{
			label: 'Pedidos', icon: 'bag', children: [
				{ label: 'Todos los pedidos', href: '/admin/pedidos' },
				{ label: 'Despachados', href: '/admin/pedidos?status=shipped' },
			]
		},
		{ divider: 'Catálogo' },
		{
			label: 'Productos', icon: 'box', children: [
				{ label: 'Todos los productos', href: '/admin/productos' },
				{ label: 'Inventario', href: '/admin/inventario' },
				{ label: 'Categorías', href: '/admin/categorias' },
			]
		},
		{ divider: 'Sistema' },
		{ label: 'Configuración', href: '/admin/configuracion', icon: 'settings' },
	];

	let openMenus: Record<string, boolean> = $state({
		Pedidos: page.url.pathname.startsWith('/admin/pedidos'),
		Productos:
			page.url.pathname.startsWith('/admin/productos') ||
			page.url.pathname.startsWith('/admin/inventario') ||
			page.url.pathname.startsWith('/admin/categorias'),
	});

	function isActive(href: string, exact = false) {
		if (exact) return page.url.pathname === href;
		return page.url.pathname.startsWith(href);
	}
</script>

<div class="admin-shell">
	<!-- Sidebar -->
	<aside class="sidebar">
		<!-- Logo -->
		<div class="sidebar-header">
			<div class="sidebar-brand">
				<span class="sidebar-mark">IM</span>
				<div class="sidebar-brand-text">
					<span class="sidebar-name">Sportswear</span>
					<span class="sidebar-role">Panel Admin</span>
				</div>
			</div>
		</div>

		<!-- Nav -->
		<nav class="sidebar-nav">
			{#each nav as item}
				{#if 'divider' in item}
					<p class="nav-divider">{item.divider}</p>
				{:else if item.children}
					<div class="nav-group">
						<button
							class="nav-item nav-parent"
							class:open={openMenus[item.label]}
							onclick={() => openMenus[item.label] = !openMenus[item.label]}
						>
							<span class="nav-icon">{@html icons[item.icon]}</span>
							<span class="nav-label">{item.label}</span>
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
						<span class="nav-label">{item.label}</span>
					</a>
				{/if}
			{/each}
		</nav>

		<!-- Footer -->
		<div class="sidebar-footer">
			<a href="https://shop.imsportswear.cl" target="_blank" rel="noopener" class="footer-link">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
				Ver tienda
			</a>
			<form method="POST" action="/admin/logout" use:enhance>
				<button type="submit" class="footer-link footer-logout">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
					Cerrar sesión
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
		home:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
		bag:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>`,
		box:      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
		settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
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
	top: 0; left: 0;
	height: 100vh;
	overflow-y: auto;
	flex-shrink: 0;
	border-right: 1px solid var(--sidebar-border);
}

/* Header / Brand */
.sidebar-header {
	padding: 20px 16px 16px;
	border-bottom: 1px solid var(--sidebar-border);
}
.sidebar-brand {
	display: flex;
	align-items: center;
	gap: 10px;
}
.sidebar-mark {
	width: 34px;
	height: 34px;
	background: #fff;
	color: var(--sidebar-bg);
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 13px;
	font-weight: 800;
	letter-spacing: -0.04em;
	flex-shrink: 0;
}
.sidebar-brand-text {
	display: flex;
	flex-direction: column;
}
.sidebar-name {
	font-size: 13px;
	font-weight: 600;
	color: #f1f5f9;
	line-height: 1.2;
}
.sidebar-role {
	font-size: 10.5px;
	color: var(--sidebar-text);
	line-height: 1.2;
}

/* Nav */
.sidebar-nav {
	flex: 1;
	padding: 16px 0 8px;
	overflow-y: auto;
}
.nav-divider {
	font-size: 9.5px;
	font-weight: 700;
	letter-spacing: 0.1em;
	text-transform: uppercase;
	color: #475569;
	padding: 14px 16px 4px;
}
.nav-item {
	display: flex;
	align-items: center;
	gap: 9px;
	padding: 8px 12px;
	margin: 1px 8px;
	font-size: 13px;
	font-weight: 500;
	color: var(--sidebar-text);
	border-radius: 7px;
	transition: background 0.12s, color 0.12s;
	cursor: pointer;
	width: calc(100% - 16px);
	border: none;
	background: none;
	text-align: left;
}
.nav-item:hover { background: var(--sidebar-hover); color: var(--sidebar-text-active); }
.nav-item.active {
	background: var(--sidebar-active);
	color: var(--sidebar-text-active);
}
.nav-item.active .nav-icon { opacity: 1; }

.nav-icon {
	display: flex;
	align-items: center;
	flex-shrink: 0;
	opacity: 0.6;
	transition: opacity 0.12s;
}
.nav-item:hover .nav-icon { opacity: 1; }
.nav-label { flex: 1; }
.nav-chevron {
	margin-left: auto;
	opacity: 0.4;
	transition: transform 0.2s;
	flex-shrink: 0;
}
.nav-chevron.rotated { transform: rotate(180deg); }

.nav-children {
	margin: 2px 8px 4px;
	border-left: 1px solid rgba(255,255,255,0.08);
	margin-left: 27px;
}
.nav-child {
	display: block;
	padding: 6px 12px;
	font-size: 12.5px;
	color: var(--sidebar-text);
	border-radius: 6px;
	margin: 1px 4px;
	transition: color 0.12s, background 0.12s;
}
.nav-child:hover { color: var(--sidebar-text-active); background: var(--sidebar-hover); }
.nav-child.active { color: #f1f5f9; font-weight: 600; }

/* Footer */
.sidebar-footer {
	border-top: 1px solid var(--sidebar-border);
	padding: 8px 8px;
	display: flex;
	flex-direction: column;
	gap: 2px;
}
.footer-link {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 7px 10px;
	font-size: 12.5px;
	color: var(--sidebar-text);
	border-radius: 7px;
	transition: background 0.12s, color 0.12s;
	border: none;
	background: none;
	cursor: pointer;
	font-family: var(--font);
	width: 100%;
	text-align: left;
}
.footer-link:hover { background: var(--sidebar-hover); color: var(--sidebar-text-active); }
.footer-logout:hover { color: #f87171; }

/* ── Content ── */
.admin-content {
	margin-left: var(--sidebar-width);
	flex: 1;
	min-height: 100vh;
	padding: 36px 40px;
	max-width: calc(100vw - var(--sidebar-width));
}

@media (max-width: 768px) {
	.sidebar { display: none; }
	.admin-content { margin-left: 0; padding: 16px; max-width: 100vw; }
}
</style>
