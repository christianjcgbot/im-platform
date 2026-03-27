# IM Platform — CLAUDE.md

## Stack
- SvelteKit + TypeScript
- Supabase (DB + Auth + Storage)
- SumUp Checkout API (widget embebido)
- Netlify (deploy)

## Reglas de desarrollo

1. **Leer CONSTITUTION.md antes de cualquier cambio arquitectónico**
2. **Spec primero** — toda feature nueva requiere spec aprobado en /docs/modules/
3. **Probar local antes de mergear** — nunca pushear código no probado a main
4. **Alta calidad de código** — el checkout maneja dinero real, sin bugs tolerados
5. **TypeScript estricto** — no usar `any`
6. **Variables de entorno** — nunca hardcodear keys

## Flujo de trabajo

```
feature/branch → probar local → PR → review → merge a main → deploy Netlify
```

## Carpetas clave

```
src/lib/modules/     ← lógica de cada módulo
src/routes/admin/    ← panel administrador
src/routes/api/      ← endpoints server-side
docs/modules/        ← specs SDD
.claude/skills/      ← skills de Claude Code
```

## Variables de entorno necesarias

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
SUMUP_API_KEY=
SUMUP_MERCHANT_CODE=
SUMUP_WEBHOOK_SECRET=
```

## Comandos

```bash
npm run dev      # desarrollo local
npm run build    # build producción
npm run preview  # preview del build
```

## Test Cases

Cada módulo tiene sus TCs en `/docs/modules/`. Antes de marcar un módulo como completo, todos sus TCs deben pasar manualmente (y eventualmente con Vitest).
