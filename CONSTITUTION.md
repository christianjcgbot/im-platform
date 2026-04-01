# IM Sportswear Platform — Constitution

> Principios fundacionales. Antes de escribir código, antes de abrir un PR, antes de proponer un cambio — leer esto.

---

## Quiénes somos

IM Sportswear es una marca chilena de sportswear clásico. "IM" son las iniciales de las dos hijas del fundador. Vendemos calidad, minimalismo y rendimiento. No volumen, no descuentos agresivos, no fast fashion.

**Dominios:**
- Marca / home: `imsportswear.cl`
- Tienda: `shop.imsportswear.cl`
- Panel admin: `shop.imsportswear.cl/admin`

---

## El objetivo de este sistema

**Crear un producto en el panel y que quede publicado en la web. El cliente lo ve, lo paga, la orden queda registrada y el stock baja.**

Todo lo demás es secundario a ese flujo.

---

## Principios de Arquitectura

### 1. Simple, sólido, extensible — en ese orden
No over-engineer. El sistema correcto no es el más complejo, es el que aguanta el crecimiento sin reescribirse. Tres líneas claras valen más que una abstracción prematura.

### 2. Un solo stack, sin mezclas innecesarias
- **Framework:** SvelteKit (frontend + backend en uno, Svelte 5 con runes)
- **Base de datos:** Supabase (PostgreSQL + Auth + Storage + RLS)
- **Pagos:** SumUp Card Widget (widget embebido, sin redirección externa)
- **Deploy:** Netlify (adaptador configurado)
- **Email transaccional:** Brevo REST API
- No agregar tecnologías sin justificación arquitectónica.

### 3. Modular desde el inicio
Cada módulo es una pieza independiente con su propio spec, sus propias rutas, su propia lógica. Un módulo no rompe otro.

### 4. El panel es para el operador, el shop es para el cliente
Son dos contextos distintos. El panel puede ser funcional y directo. El shop debe ser impecable visualmente.

### 5. Seguridad de pagos por diseño
Nunca procesamos datos de tarjeta. SumUp maneja PCI/3DS. Nosotros solo creamos el checkout (server-side) y montamos el widget en cliente.

---

## Estado de Módulos

| ID | Nombre | Estado | Notas |
|----|--------|--------|-------|
| AUTH | Autenticación Admin | ✅ completo | Supabase Auth, sesión server-side, protección de rutas |
| M1 | Dashboard | ✅ completo | Stats básicos: productos activos, stock bajo |
| M2 | Pedidos | ✅ completo | Lista, detalle, estados, tracking, historial, email Brevo |
| M3 | Productos | ✅ completo | CRUD, variantes, imágenes, rich text, SEO, categoría inline |
| M4 | Inventario | ✅ completo | Edición inline stock + umbral de alerta por variante |
| M5 | Categorías | ✅ completo | CRUD con subcategorías, modal inline |
| M6 | Configuración | ✅ completo | Datos tienda, envío, colores, tallas predefinidas |
| SHOP | Shop público | ✅ completo | Listado + filtros + PDP con galería, carrito drawer |
| CHECKOUT | Carrito + SumUp | ✅ completo | Cart, checkout form, widget SumUp embebido, email, webhook |

---

## Módulos Fase 2

- Clientes (historial de compras por email)
- Estadísticas e Informes (revenue, productos más vendidos)
- Promociones / Descuentos (códigos, porcentaje, monto fijo)
- Pedidos abandonados (email recovery)
- Reseñas de productos
- Blue Express API (cotización de despacho en tiempo real)

---

## Stack de decisiones tomadas

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| SvelteKit | Next.js | Un solo lenguaje, más liviano, Netlify nativo |
| Svelte 5 runes | Svelte 4 | Reactividad más predecible, menos magia |
| Supabase | PlanetScale + Clerk | Todo en uno: DB + Auth + Storage + RLS |
| SumUp Card Widget | Hosted checkout redirect | Widget embebido = mejor UX, sin "Aquí no hay nada" en SumUp |
| SumUp Card Widget | Formulario propio de tarjeta | PCI/3DS manejado por SumUp, no nosotros |
| Netlify | Vercel | Dominio ya configurado, DNS ya propagado |
| Brevo REST API | SMTP / SendGrid | Gratis hasta 300/día, API simple, sin configuración SMTP |
| Precio fijo de envío | Blue Express API | Integración API pendiente Fase 2 |
| Sin CMS externo | Decap CMS | El panel admin es el CMS |

---

## North Star

> Un operador entra al panel, sube un producto con foto, tallas y precio.
> El cliente entra al shop, lo ve, lo agrega al carrito y paga con tarjeta.
> La orden queda registrada. El stock baja. El cliente recibe email de confirmación.
> Todo en el mismo sistema, sin herramientas externas.
