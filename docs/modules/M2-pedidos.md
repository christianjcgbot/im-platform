# M2 · PEDIDOS — Spec & SDD

**Estado: ✅ Completo**

---

## Objetivo

Permitir al operador ver, gestionar y actualizar el estado de todas las órdenes. Cada cambio de estado notifica al cliente por email.

---

## Schema

Ver `CLAUDE.md` para schema completo de `orders`, `order_items`, `order_history`.

**Estados del pedido (`orders.status`):**
```
created → preparing → shipped → delivered
                    ↘ cancelled
```

**Estados de pago (`orders.payment_status`):**
```
pending → paid
        ↘ failed
```

---

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/admin/pedidos` | Lista todos los pedidos con filtros por estado |
| `/admin/pedidos/[id]` | Detalle + cambiar estado + tracking + historial |

---

## Funcionalidad

### Lista de pedidos (`/admin/pedidos`)
- Filtros por estado via `?status=` (tabs: Todos, Creados, En preparación, Despachados, Entregados, Cancelados)
- Contador de pedidos por estado en cada tab
- Tabla: número, cliente, email, total, estado, estado pago, fecha
- Filas clickables → va al detalle
- Usa `locals.supabase` (sesión del operador)

### Detalle del pedido (`/admin/pedidos/[id]`)
**Columna principal:**
- Items del pedido: imagen, nombre, color, talla, SKU, cantidad × precio unitario = total
- Desglose de precios: subtotal, IVA 19% incluido, envío, total
- Dirección de despacho (calle, ciudad, región, país)
- Historial/timeline de eventos con timestamps

**Sidebar:**
- Info cliente: nombre, email, teléfono
- **Cambiar estado**: select + campo comentario opcional → `?/update_status`
- Info de pago: método, estado, sumup_checkout_id
- **Gestión despacho**: select proveedor + input tracking → `?/update_shipping`
- Link directo al tracking según proveedor

### Acciones server

#### `update_status`
1. Lee `status` + `comment` del formData
2. Obtiene orden + items para el email
3. UPDATE orders SET status
4. INSERT order_history (status + comentario)
5. Envía email Brevo con `buildOrderEmail({ status, items, totales })`
6. Si falla el email, no bloquea (try/catch)

#### `update_shipping`
1. Lee `shipping_provider` + `tracking_id`
2. UPDATE orders SET shipping_provider, tracking_id
3. Si hay tracking: INSERT order_history con el número

#### `add_comment`
1. Lee `comment` del formData
2. INSERT order_history con solo comentario (sin cambio de estado)

---

## Emails por estado

| Estado | Asunto email | Mensaje |
|--------|-------------|---------|
| `created` | Pedido #N — Orden creada | "Hemos recibido tu pedido y está siendo procesado." |
| `preparing` | Pedido #N — En preparación | "Tu pedido está siendo preparado con cuidado para ser despachado pronto." |
| `shipped` | Pedido #N — Despachado | "Tu pedido está en camino. ¡Pronto lo tendrás en tus manos!" |
| `delivered` | Pedido #N — Entregado | "¡Tu pedido fue entregado! Esperamos que lo disfrutes." |
| `cancelled` | Pedido #N — Cancelado | "Tu pedido ha sido cancelado. Si tienes dudas, contáctanos." |

---

## Test Cases

### TC-M2-01 — Webhook SumUp marca orden como pagada
```
DADO una orden con payment_status='pending' y sumup_checkout_id=X
CUANDO SumUp envía webhook con status='PAID'
ENTONCES la orden cambia a payment_status='paid', status='preparing'
Y se inserta en order_history
Y el stock de los items se descuenta via decrement_stock RPC
Y el cliente recibe email de confirmación
```

### TC-M2-02 — Cambio de estado manual envía email
```
DADO una orden con status='preparing'
CUANDO el operador cambia a 'shipped' con comentario "Enviado por Chilexpress"
ENTONCES el estado se actualiza en DB
Y se inserta en order_history con el comentario
Y el cliente recibe email con estado 'shipped'
```

### TC-M2-03 — Asignar tracking
```
DADO una orden en status='shipped'
CUANDO el operador ingresa tracking_id="12345678" y proveedor="chilexpress"
ENTONCES la orden se actualiza con esos datos
Y se inserta en order_history: "Tracking asignado: CHILEXPRESS — 12345678"
```

### TC-M2-04 — Historial registra todos los eventos
```
DADO una orden que pasó por created → preparing → shipped
ENTONCES el historial muestra 3+ entradas con timestamps
Y cada entrada tiene el estado y/o comentario correspondiente
```

### TC-M2-05 — Email falla sin bloquear
```
DADO que Brevo no responde o retorna error
CUANDO el operador cambia el estado de la orden
ENTONCES el estado se actualiza correctamente en DB
Y el error de email se loguea en consola
Y no se muestra error al operador (operación sigue siendo exitosa)
```
