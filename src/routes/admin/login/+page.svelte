<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<svelte:head><title>Login — IM Admin</title></svelte:head>

<div class="login-wrap">
	<div class="login-card">
		<div class="login-brand">IM</div>
		<p class="login-sub">Panel de administración</p>

		<form method="POST" use:enhance>
			{#if form?.error}
				<p class="login-error">{form.error}</p>
			{/if}
			<div class="form-group">
				<label class="form-label" for="email">Correo electrónico</label>
				<input id="email" name="email" type="email" class="form-input" required autocomplete="email" />
			</div>
			<div class="form-group">
				<label class="form-label" for="password">Contraseña</label>
				<input id="password" name="password" type="password" class="form-input" required autocomplete="current-password" />
			</div>
			<button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;">
				Ingresar
			</button>
		</form>
	</div>
</div>

<style>
.login-wrap {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f1f5f9;
}
.login-card {
	background: #fff;
	border: 1px solid var(--border);
	border-radius: 12px;
	padding: 48px 40px;
	width: 100%;
	max-width: 380px;
}
.login-brand {
	font-size: 2.5rem;
	font-weight: 700;
	letter-spacing: -0.04em;
	color: var(--navy);
	margin-bottom: 4px;
}
.login-sub {
	font-size: 13px;
	color: var(--muted);
	margin-bottom: 32px;
}
.login-error {
	background: #fee2e2;
	color: #dc2626;
	padding: 10px 14px;
	border-radius: 6px;
	font-size: 13px;
	margin-bottom: 16px;
}
</style>
