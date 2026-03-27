# IM Sportswear Platform — Constitution

> Principios fundacionales. Antes de escribir código, antes de abrir un PR, antes de proponer un cambio — leer esto.

---

## Quiénes somos

IM Sportswear es una marca chilena de sportswear clásico. "IM" son las iniciales de las dos hijas del fundador. Vendemos calidad, minimalismo y rendimiento. No volumen, no descuentos agresivos, no fast fashion.

---

## El objetivo de este sistema

**Crear un producto en el panel y que quede publicado en la web.**

Todo lo demás es secundario a ese flujo.

---

## Principios de Arquitectura

### 1. Simple, sólido, extensible — en ese orden
No over-engineer. El sistema correcto no es el más complejo, es el que aguanta el crecimiento sin reescribirse. Tres líneas claras valen más que una abstracción prematura.

### 2. Un solo stack, sin mezclas innecesarias
- **Framework:** SvelteKit (frontend + backend en uno)
- **Base de datos:** Supabase (PostgreSQL + Auth + Storage)
- **Pagos:** SvelteKit API route → SumUp Checkout API
- **Deploy:** Netlify
- No agregar tecnologías sin justificación arquitectónica.

### 3. Modular desde el inicio
Cada módulo es una pieza independiente con su propio spec, sus propias rutas, su propia lógica. Un módulo no rompe otro. Se pueden agregar o quitar módulos sin tocar el resto.

### 4. SDD — Spec primero, código después
Antes de implementar cualquier módulo o feature: escribir el spec en `/docs/modules/`. El spec define inputs, outputs, comportamiento esperado, schema de datos. Si no hay spec, no hay código.

### 5. El panel es para el operador, el shop es para el cliente
Son dos contextos distintos con necesidades distintas. El panel puede ser funcional y directo. El shop debe ser impecable visualmente (ya existe el diseño).

---

## Módulos MVP (Fase 1)

| ID | Nombre | Estado |
|----|--------|--------|
| M1 | Dashboard | 🔲 pendiente |
| M2 | Pedidos | 🔲 pendiente |
| M3 | Productos | 🔲 pendiente |
| M4 | Inventario | 🔲 pendiente |
| M5 | Categorías | 🔲 pendiente |
| M6 | Configuración | 🔲 pendiente |
| AUTH | Autenticación Admin | 🔲 pendiente |
| MEDIA | Subida de fotos | 🔲 pendiente |
| SHOP | Shop público | 🔲 pendiente |
| CHECKOUT | Carrito + SumUp | 🔲 pendiente |

---

## Módulos Fase 2 (cuando haya volumen)

- Clientes
- Estadísticas e Informes
- Promociones / Descuentos
- Pedidos abandonados
- Reseñas

---

## Reglas de desarrollo

- **Cada módulo tiene su spec** en `/docs/modules/Mx-nombre.md`
- **Cada feature es un PR** con referencia al módulo
- **Sin código sin spec aprobado**
- **TypeScript estricto** en todo el proyecto
- **Variables de entorno** nunca en el código, siempre en `.env`
- **Row Level Security en Supabase** — nunca exponer datos sin RLS

---

## Stack de decisiones tomadas

| Decisión | Alternativa descartada | Razón |
|----------|----------------------|-------|
| SvelteKit | Next.js | Un solo lenguaje, más liviano, Netlify nativo |
| Supabase | PlanetScale + Clerk | Todo en uno: DB + Auth + Storage + RLS |
| SumUp Checkout API | Construir formulario propio | PCI/3DS manejado por SumUp |
| Netlify | Vercel | Dominio ya configurado, DNS ya propagado |
| Sin CMS externo | Decap CMS | El panel admin es el CMS |

---

## North Star

> Un operador entra al panel, sube un producto con foto, tallas y precio.
> El cliente entra al shop, lo ve, lo agrega al carrito y paga.
> La orden queda registrada. El stock baja.
> Todo en el mismo sistema, sin herramientas externas.
