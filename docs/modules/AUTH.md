# AUTH — Spec

> Toda ruta /admin/* requiere sesión válida. Sin excepciones.

---

## Schema

```sql
-- Manejado por Supabase Auth (no crear tabla manual)
-- auth.users contiene: id, email, created_at
-- Rol admin se valida por email en hooks.server.ts
```

---

## Rutas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/admin/login` | Page | Formulario login |
| `/admin/logout` | POST | Cierra sesión |
| `src/hooks.server.ts` | Hook | Protege todas las rutas /admin/* |

---

## Comportamiento

- Login: email + password via Supabase Auth
- Sesión persiste en cookie httpOnly (Supabase SSR)
- Cualquier ruta `/admin/*` sin sesión → redirect a `/admin/login`
- Solo el email registrado en Supabase puede acceder

---

## Test Cases

### TC-AUTH-01 — Acceso sin sesión
```
DADO un usuario no autenticado
CUANDO accede a /admin/productos
ENTONCES es redirigido a /admin/login
```

### TC-AUTH-02 — Login correcto
```
DADO credenciales válidas
CUANDO hace login
ENTONCES es redirigido a /admin (dashboard)
Y la sesión persiste al refrescar
```

### TC-AUTH-03 — Login incorrecto
```
DADO credenciales inválidas
CUANDO hace login
ENTONCES ve mensaje de error
Y permanece en /admin/login
```
