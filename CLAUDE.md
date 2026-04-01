# IM Platform — CLAUDE.md

> Referencia técnica completa del proyecto. Leer antes de cualquier cambio.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | SvelteKit + TypeScript (Svelte 5 con runes) |
| Base de datos | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Email transaccional | Brevo REST API |
| Pagos | SumUp Card Widget (embebido, no hosted checkout) |
| Deploy | Netlify (adaptador configurado) |
| Envío | Precio fijo por configuración (Blue Express API pendiente Fase 2) |

---

## Variables de entorno

```env
PUBLIC_SUPABASE_URL=https://bvcgwolwhxuruibpqjzz.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_KEY=<service_key>
BREVO_API_KEY=<brevo_api_key>
STORE_EMAIL=hola@imsportswear.cl
STORE_NAME=IM Sportswear
PUBLIC_SITE_URL=http://localhost:5173   # producción: https://shop.imsportswear.cl
SUMUP_API_KEY=                         # Bearer token (sup_sk_...) del dashboard SumUp
SUMUP_MERCHANT_CODE=                   # Merchant code (ej: MR479AE1)
SUMUP_WEBHOOK_SECRET=                  # Secret para verificar firma HMAC-SHA256 webhook
```

---

## Comandos

```bash
npm run dev      # desarrollo local (http://localhost:5173)
npm run build    # build producción
npm run preview  # preview del build
```

---

## Estructura de rutas

```
src/routes/
  admin/
    +layout.server.ts       ← protección de rutas (redirige a /admin/login si no hay sesión)
    +layout.svelte          ← sidebar nav con enlaces a todos los módulos
    +page.svelte            ← M1 Dashboard
    login/                  ← AUTH Login (layout propio @)
    logout/                 ← AUTH Logout (page.server.ts con redirect)
    productos/              ← M3 Productos (lista)
    productos/nuevo/        ← M3 Crear producto
    productos/[id]/         ← M3 Editar producto
    categorias/             ← M5 Categorías
    inventario/             ← M4 Inventario
    pedidos/                ← M2 Pedidos (lista, filtros por estado)
    pedidos/[id]/           ← M2 Detalle + cambiar estado + tracking + historial
    configuracion/          ← M6 Configuración (tienda, envío, tallas, colores)

  +page.svelte              ← SHOP Listado de productos con filtros
  +page.server.ts           ← SHOP Queries: categorías, productos, imágenes, variantes
  productos/[slug]/         ← SHOP PDP (Product Detail Page)
  checkout/                 ← CHECKOUT Formulario datos + widget SumUp embebido
  checkout/exito/           ← CHECKOUT Confirmación de pedido
  api/sumup/webhook/        ← CHECKOUT Webhook SumUp (confirma pago, descuenta stock)
  api/sumup/confirm/        ← Confirma pago widget SumUp (verifica con API + actualiza DB + stock)
  api/test/                 ← Solo dev: simulate-payment endpoint

src/lib/
  components/
    RichTextEditor.svelte   ← Editor Tiptap (Bold, Italic, H2, H3, Bullet, Ordered)
    ShopHeader.svelte       ← Header shop: nav categorías, logo, carrito drawer
    ShopFooter.svelte       ← Footer shop: navegación, soporte, social
  cart.svelte.ts            ← Store del carrito (Svelte 5 runes, persiste en localStorage)
  server/
    email.ts                ← sendEmail() + buildOrderEmail() con Brevo REST API
    supabase.ts             ← createSupabaseServerClient() + createServiceClient()
```

---

## Schema de base de datos

### `products`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| name | text | |
| subtitle | text | tagline corto |
| description | text | HTML (rich text) |
| category_id | uuid FK → categories | nullable |
| price | integer | CLP sin decimales |
| compare_price | integer | precio tachado, nullable |
| cost | integer | costo interno, nullable |
| sku | text | nullable |
| status | text | `available` / `draft` / `discontinued` |
| featured | boolean | destacado en tienda |
| slug | text | para URL SEO |
| meta_description | text | max 155 chars |
| images | jsonb | array de `{ url, path, order }` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `product_variants`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| product_id | uuid FK → products | |
| color | text | |
| size | text | |
| stock | integer | unidades disponibles |
| low_stock_threshold | integer | umbral alerta stock bajo (por variante) |
| sku | text | nullable |
| created_at | timestamptz | |

### `product_images`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| product_id | uuid FK → products | |
| url | text | URL pública Supabase Storage |
| position | integer | orden de aparición |
| color | text | nullable — para filtrar imágenes por color en PDP |
| created_at | timestamptz | |

### `categories`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| name | text | |
| slug | text | auto-generado desde name |
| parent_id | uuid FK → categories | nullable (si es subcategoría) |
| position | integer | orden |

### `settings`
| Columna | Tipo | Notas |
|---------|------|-------|
| key | text PK | `store`, `shipping`, `sizes`, `colors` |
| value | jsonb | datos de la configuración |
| updated_at | timestamptz | |

- `store`: `{ name, email, phone, address }`
- `shipping`: `{ free_threshold, cost, days }` — ej: `{ free_threshold: 50000, cost: 4990, days: 5 }`
- `sizes`: `["XS","S","M","L","XL","XXL","Única"]`
- `colors`: `[{ name, hex }]`

### `orders`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | también es el `checkout_reference` enviado a SumUp |
| order_number | integer | auto-increment legible (#1000, #1001…) |
| customer_name | text | |
| customer_email | text | |
| customer_phone | text | nullable |
| status | text | `created` / `preparing` / `shipped` / `delivered` / `cancelled` |
| payment_status | text | `pending` / `paid` / `failed` / `refunded` |
| payment_method | text | `sumup` |
| sumup_checkout_id | text | ID retornado por SumUp al crear el checkout |
| subtotal | integer | suma de items (IVA ya incluido) |
| iva | integer | `round(subtotal * 19 / 119)` — IVA extraído |
| shipping_cost | integer | costo envío (0 si aplica envío gratis) |
| total | integer | subtotal + shipping_cost |
| shipping_provider | text | `chilexpress` / `blue_express` / nullable |
| tracking_id | text | número de seguimiento, nullable |
| shipping_address | jsonb | `{ street, city, region, country }` |
| notes | text | notas del cliente, nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | trigger automático |

### `order_items`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| order_id | uuid FK → orders | |
| product_id | uuid FK → products | nullable (si producto eliminado) |
| variant_id | uuid FK → product_variants | nullable |
| product_name | text | snapshot al momento de la compra |
| product_image | text | snapshot URL imagen principal |
| color | text | snapshot |
| size | text | snapshot |
| sku | text | snapshot, nullable |
| unit_price | integer | precio unitario CLP |
| quantity | integer | |
| total | integer | unit_price × quantity |
| created_at | timestamptz | |

### `order_history`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| order_id | uuid FK → orders | |
| status | text | nullable (si es solo comentario) |
| comment | text | texto del evento |
| created_at | timestamptz | |

---

## Módulos implementados

### AUTH — Autenticación Admin
- Login con Supabase Auth (email + password)
- Sesión server-side via cookies
- `+layout.server.ts` en `/admin/` redirige a `/admin/login` si no hay sesión
- Layout propio en login (`+layout@.svelte`) para saltar el layout admin
- Logout en `/admin/logout/+page.server.ts` con `signOut()` + redirect

### M1 — Dashboard
- Ruta: `/admin`
- Stats: productos activos (count), variantes con stock bajo (≤ umbral, > 0)
- Lista las top 10 variantes con stock bajo con nombre de producto

### M2 — Pedidos
- **Lista** (`/admin/pedidos`): filtros por estado via `?status=`, tabs con contadores, tabla clickable
- **Detalle** (`/admin/pedidos/[id]`): layout 2 columnas
  - Columna principal: items con imagen/color/talla/SKU, desglose de precios, dirección envío, historial/timeline
  - Sidebar: info cliente, cambio de estado, info de pago, gestión despacho (proveedor + tracking)
- **Acciones server**: `update_status`, `update_shipping`, `add_comment`
- Cada cambio de estado inserta en `order_history` y envía email Brevo al cliente
- Tracking link directo según proveedor (Chilexpress, Blue Express)

### M3 — Productos
- **Lista** (`/admin/productos`): tabla con imagen, nombre, precio, estado, categoría; filas clickables
- **Nuevo/Editar** (`/admin/productos/nuevo`, `/admin/productos/[id]`): formulario completo
- Campos: nombre, subtítulo, descripción (rich text), categoría (con creación inline), precio, precio comparativo, costo, SKU, estado, destacado
- **Imágenes**: upload a Supabase Storage, reordering con flechas ↑↓, delete, lightbox preview
- **Variantes**: tabla con color + talla + stock; agregar/eliminar filas
- **SEO**: slug (auto-generado desde nombre, editable), meta description (counter 155 chars), Google preview card
- **Categoría inline**: botón "+" abre modal sin salir del formulario; auto-selecciona la nueva

### M4 — Inventario
- Ruta: `/admin/inventario`
- Variantes agrupadas por producto
- Stats chips: total unidades, sin stock, stock bajo
- Filtros: Todos / Stock bajo / Sin stock
- Edición inline: stock + umbral de alerta (configurable por variante)
- Botón **Guardar** por variante — usa `fetch` directo (no `use:enhance`, por estar en tabla)
- Color coding: rojo = sin stock, amarillo = stock bajo (≤ threshold)

### M5 — Categorías
- Ruta: `/admin/categorias`
- Tabla con categorías padre y subcategorías
- Modal para crear/editar: nombre + selector de padre (filtrado para excluir self)
- Al eliminar un padre: subcategorías se reasignan a root (`parent_id = null`)
- Slug auto-generado desde nombre (sin acentos, sin caracteres especiales)

### M6 — Configuración
- Ruta: `/admin/configuracion`
- 4 secciones independientes: datos tienda, envío, tallas, colores
- Datos guardados en tabla `settings` (key/value jsonb) con `upsert`
- Tallas: lista ordenable con flechas ↑↓ y add/remove
- Colores: color picker nativo + nombre, lista con preview del swatch
- **Fix crítico**: usa `$state` local + `$effect(() => { local = data.x })` para sincronizar después del save

### SHOP — Tienda pública
- `/` → Listado con filtro por categoría, badge Agotado/Nuevo, color dots, precio
  - Filtro por categoría incluye subcategorías (busca `category_id` de la categoría y todas sus hijas)
- `/productos/[slug]` → PDP con:
  - Galería de imágenes (thumbnails con navegación)
    - Imágenes filtradas por color seleccionado (`imagesForColor`): si hay fotos taggeadas con ese color, muestra solo esas; si no, muestra todas
    - Al cambiar de color: imagen principal vuelve a índice 0
  - Selector color (swatches circulares con color real)
  - Selector talla (auto-oculto si solo hay "Única")
    - Tallas deduplicadas por color (evita repetidos en caso de variantes duplicadas en DB)
  - Stock badge: Disponible / Últimas N unidades / Sin stock
  - Botón CTA dinámico según selección
  - Info envío inline
  - Descripción HTML (rich text)
- `ShopHeader`: sticky, nav categorías izquierda, logo centro, ícono carrito derecha con drawer
- `ShopFooter`: 4 columnas (brand, navegación, soporte, social), navy dark
- `cart.svelte.ts`: store Svelte 5, persiste en localStorage, `initCart()` en onMount

### CHECKOUT — Flujo de pago
- `/checkout` → formulario datos + resumen sticky
  - Sección contacto: nombre, email, teléfono
  - Sección dirección: calle, región (16 regiones), comuna (cascading dropdown)
  - Resumen: items del carrito, subtotal, envío, total, días despacho
- **Flujo técnico**:
  1. Usuario llena form → submit con `use:enhance`
  2. `handleSubmit` inyecta `cart` JSON en formData antes de enviar
  3. Server valida campos + stock en DB (fuente de verdad)
  4. Server crea orden `status='created'`, `payment_status='pending'`
  5. Server envía email de confirmación al cliente ("pedido recibido")
  6. Server llama `POST https://api.sumup.com/v0.1/checkouts` → recibe `checkoutId`
  7. Server retorna `{ checkoutId, orderId }` al cliente
  8. Cliente monta `SumUpCard.mount({ id: 'sumup-card', checkoutId, onResponse })`
  9. Cliente paga en widget embebido (SumUp maneja PCI/3DS/tokenización)
  10. `onResponse('success'|'sent')` → cliente llama `POST /api/sumup/confirm { checkoutId, orderId }`, luego redirect a `/checkout/exito?ref=orderId`
      - `/api/sumup/confirm` verifica estado con SumUp API, actualiza `payment_status='paid'`, `status='preparing'`, decrementa stock, envía email Brevo
  11. `onResponse('error'|'fail')` → mostrar error, volver al formulario
- **Sin SumUp configurado** (dev): devMode=true → cliente llama `POST /api/test/simulate-payment { orderId }` (descuenta stock, actualiza estado, envía email), luego redirige a éxito
- `/checkout/exito` → carga orden + items, muestra resumen con:
  - Banner estado pago (verde=pagado / amarillo=pendiente)
  - Número de pedido, fecha, estado, forma de pago
  - Dirección de despacho
  - Items con imagen, color, talla, cantidad, precio
  - Totales: subtotal, envío, IVA 19% incluido, total
### Simular pago (solo dev/staging)
POST /api/test/simulate-payment { orderId }
- Bloqueado en producción (PUBLIC_SITE_URL contiene imsportswear.cl sin localhost)
- Marca orden como pagada, descuenta stock, envía email de confirmación
- Útil para tests end-to-end sin tarjeta real

- **Webhook** `/api/sumup/webhook`:
  - Verifica HMAC-SHA256 (`x-sumup-signature` o `x-hmac-signature`)
  - `PAID`/`SUCCESSFUL`/`COMPLETED` → `payment_status='paid'`, `status='preparing'`
  - Descuenta stock via `db.rpc('decrement_stock', { p_variant_id, p_quantity })`
  - Inserta en `order_history`
  - Envía email Brevo de confirmación de pago
  - Si `SUMUP_WEBHOOK_SECRET` está vacío → skip verificación (útil en dev)

---

## Funciones PostgreSQL

### `decrement_stock(p_variant_id uuid, p_quantity integer)`
- `SECURITY DEFINER` — ejecuta con permisos de owner
- Decrementa stock atómicamente: `stock = GREATEST(0, stock - p_quantity)`
- Llamada via `db.rpc('decrement_stock', {...})`

---

## Emails transaccionales (Brevo)

- **Endpoint**: `POST https://api.brevo.com/v3/smtp/email`
- **Auth**: header `api-key: <BREVO_API_KEY>`
- **Sender**: `STORE_NAME <STORE_EMAIL>` (hola@imsportswear.cl)
- Se envían en dos momentos:
  1. Al crear la orden (checkout submit) — estado `created`
  2. Al confirmar pago (webhook SumUp) — estado `preparing`
  3. Cada cambio de estado manual desde el admin
- Si falla, **no bloquea** la operación (try/catch)
- Template: header navy (#111827), body blanco, desglose de items + totales

---

## Componentes compartidos

### `RichTextEditor.svelte`
```svelte
<RichTextEditor name="description" value={product.description} />
```
- Basado en Tiptap (`@tiptap/core` + `@tiptap/starter-kit`)
- Toolbar: Bold, Italic, H2, H3, Lista con viñetas, Lista numerada
- Inicializado en `onMount` (seguro para SSR)
- `<input type="hidden">` lleva el HTML para el submit del formulario

### `src/lib/cart.svelte.ts`
```typescript
cart.add(item)       // agrega al carrito, abre drawer
cart.remove(id)      // elimina variante
cart.update(id, qty) // actualiza cantidad
cart.clear()         // vacía carrito
cart.items           // array de CartItem
cart.total           // suma total CLP
cart.count           // cantidad de unidades
initCart()           // llamar en onMount para hidratar desde localStorage
```

---

## Patrones técnicos importantes

### Svelte 5 runes
```svelte
let value    = $state(initialValue)
let derived  = $derived(expression)          // expresión simple
let computed = $derived.by(() => {           // bloque multi-línea
  return result;
})
let { data } = $props()
```
- `$derived` toma una expresión, NO una función
- `$derived.by(() => { ... })` para bloques multi-línea
- Para props: `let { data }: { data: PageData } = $props()`
- Para sincronizar state local con props: `$effect(() => { local = data.x; })`

### TypeScript en templates Svelte
- **No usar type assertions (`as Type`) dentro de `{}`** en templates — causa "Unexpected token"
- No usar `(v: any)` como anotación en callbacks dentro de `{#each}` o `$derived`
- Mover lógica con tipos a funciones o `$derived` en el bloque `<script>`

### Formularios dentro de tablas
- `<form>` dentro de `<tr>` es HTML inválido — usar `fetch` directo
- Para inventario: `saveVariant(v)` construye `FormData` manualmente y hace POST a `?/update_stock`

### `use:enhance` y redirect externo
- `use:enhance` intercepta el submit — un `redirect()` del servidor a URL externa **no funciona**
- Para redirigir a URL externa: el server retorna `{ url }` y el cliente hace `window.location.href = url`
- Para redirigir interno: `applyAction(result)` maneja el redirect del router

### Cart en formularios server
- El cart vive en localStorage (client-only)
- Para enviarlo al server: `formData.set('cart', JSON.stringify(cart.items))` en el `handleSubmit` de `use:enhance`
- El server parsea con `JSON.parse(fd.get('cart')?.toString() ?? '[]')`

### IVA Chile
- Los precios incluyen IVA (19%)
- IVA extraído = `Math.round(subtotal * 19 / 119)`
- El envío no lleva IVA adicional
- `total = subtotal + shipping_cost`

### Slugify
```typescript
function slugify(text: string) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}
```

---

## Reglas de desarrollo

1. **Leer CONSTITUTION.md antes de cualquier cambio arquitectónico**
2. **No over-engineer** — tres líneas claras valen más que una abstracción prematura
3. **No agregar tecnologías** sin justificación arquitectónica
4. **El panel puede ser funcional y directo; el shop debe ser impecable visualmente**
5. **Variables de entorno** — nunca hardcodear keys en el código
6. **No romper módulos existentes** al agregar nuevos
7. **Siempre verificar stock en DB** al crear órdenes — el client no es fuente de verdad

## Flujo de trabajo

```
feature/branch → probar local → PR → review → merge a main → deploy Netlify
```
