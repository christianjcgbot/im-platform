<script lang="ts">
	const year = new Date().getFullYear();
</script>

<footer class="shop-footer">
	<div class="shop-container">
		<div class="footer-grid">
			<div class="footer-brand">
				<a href="/" class="brand-logo">IM</a>
				<p>Redefiniendo el sportswear clásico para la vida moderna. Calidad, minimalismo y rendimiento en cada costura. Hecho para durar.</p>
			</div>

			<nav class="footer-nav" aria-label="Navegación">
				<h3>Navegación</h3>
				<ul>
					<li><a href="/?categoria=urban">Urban</a></li>
					<li><a href="/?categoria=tenis">Tenis</a></li>
					<li><a href="/?categoria=running">Running</a></li>
					<li><a href="/?categoria=accesorios">Accesorios</a></li>
					<li><a href="/">Tienda oficial</a></li>
				</ul>
			</nav>

			<nav class="footer-nav" aria-label="Soporte">
				<h3>Soporte</h3>
				<ul>
					<li><a href="/faq">FAQ</a></li>
					<li><a href="/devoluciones">Devoluciones</a></li>
					<li><a href="/envios">Envíos</a></li>
					<li><a href="/guia-de-tallas">Guía de tallas</a></li>
					<li><a href="mailto:hola@imsportswear.cl">Contacto</a></li>
				</ul>
			</nav>

			<div class="footer-social">
				<h3>Conecta</h3>
				<div class="social-links">
					<a href="https://instagram.com/imsportswear" target="_blank" rel="noopener" aria-label="Instagram">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
						Instagram
					</a>
					<a href="https://x.com/imsportswear" target="_blank" rel="noopener" aria-label="X / Twitter">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.844L2.25 2.25H8.08l4.26 5.635zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
						X
					</a>
					<a href="https://facebook.com/imsportswear" target="_blank" rel="noopener" aria-label="Facebook">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
						Facebook
					</a>
				</div>
			</div>
		</div>

		<div class="footer-bottom">
			<p>© {year} IM Sportswear. Todos los derechos reservados.</p>
			<div class="footer-bottom-links">
				<a href="/terminos">Términos de servicio</a>
				<a href="/privacidad">Privacidad</a>
			</div>
		</div>
	</div>
</footer>
