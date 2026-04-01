# CHECKOUT — Spec & SDD

> Seguridad ante todo. El cliente nunca ingresa datos de tarjeta en nuestro código.

**Estado: ✅ Completo**

---

## Principio de seguridad

**SumUp maneja todos los datos sensibles de pago.** Nosotros solo:
1. Creamos el checkout via API REST (server-side — la API key nunca llega al browser)
2. Embebemos el widget de SumUp en nuestra página con el `checkoutId`
3. Recibimos confirmación via webhook firmado con HMAC-SHA256

Nunca tocamos números de tarjeta, CVV ni datos bancarios.

---

## Flujo completo

```
Cliente agrega productos al carrito (localStorage)
  ↓
/checkout → formulario contacto + dirección + resumen sticky
  ↓ submit (use:enhance inyecta cart JSON en formData)
  ↓
+page.server.ts → action create_order:
  1. Valida campos obligatorios + formato email
  2. Parsea cart JSON del formData
  3. Verifica stock en DB por cada variante (fuente de verdad)
  4. Calcula subtotal, shipping_cost, total, IVA
  5. Obtiene siguiente order_number (MAX + 1)
  6. INSERT orders → status='created', payment_status='pending'
  7. INSERT order_items (snapshot: nombre, color, talla, precio, product_image)
  8. Envía email "pedido recibido" via Brevo (no bloquea)
  9. POST https://api.sumup.com/v0.1/checkouts → checkoutId
  10. UPDATE orders SET sumup_checkout_id = checkoutId
  11. return { checkoutId, orderId }
  ↓
Cliente: SumUpCard.mount({ id: 'sumup-card', checkoutId, onResponse })
  → Widget embebido de SumUp aparece en la misma página
  → Cliente ingresa datos de tarjeta (PCI/3DS maneja SumUp)
  ↓
onResponse:
  'success' | 'sent' →
    1. POST /api/sumup/confirm { checkoutId, orderId }
       → Verifica estado con SumUp API
       → Si PAID: UPDATE payment_status='paid', status='preparing'
       → INSERT order_history
       → RPC decrement_stock por cada variante
       → Envía email Brevo "pago confirmado"
    2. cart.clear()
    3. window.location.href = /checkout/exito?ref=orderId
  'error' | 'fail'   → mostrar error + volver al formulario (showWidget=false, showForm=true)
  ↓
/checkout/exito?ref=<orderId>
  → Carga orden + items desde DB
  → Muestra banner estado pago, recibo, dirección, items, totales
  ↓
SumUp POST /api/sumup/webhook (asíncrono, puede llegar antes o después de la visita a éxito):
  → Verifica HMAC-SHA256
  → UPDATE orders SET payment_status='paid', status='preparing'
  → INSERT order_history
  → RPC decrement_stock por cada item
  → Envía email "pago confirmado" via Brevo
```

---

## Rutas

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/checkout` | `+page.svelte` + `+page.server.ts` | Formulario + widget SumUp |
| `/checkout/exito` | `+page.svelte` + `+page.server.ts` | Confirmación de pedido |
| `/api/sumup/webhook` | `+server.ts` | Webhook SumUp (POST) |
| `/api/sumup/confirm` | `+server.ts` | Confirma pago post-widget (POST) |
| `/api/test/simulate-payment` | `+server.ts` | Simula pago para tests (solo dev) |

---

## Regiones y comunas

Dropdown cascading con las 16 regiones de Chile y sus comunas. El campo `region` guarda el nombre de la región, `city` guarda el nombre de la comuna. Ambos se guardan en `shipping_address.region` y `shipping_address.city`.

---

## Cálculo de envío

```typescript
const shippingCost = subtotal >= shippingCfg.free_threshold ? 0 : shippingCfg.cost;
```

- Configurado en `settings.shipping`: `{ free_threshold, cost, days }`
- Default fallback: free_threshold=50000, cost=4990, days=5
- Envío gratis si subtotal ≥ free_threshold

---

## Variables de entorno requeridas

```env
SUMUP_API_KEY=sup_sk_...       # Bearer token — NUNCA en el frontend
SUMUP_MERCHANT_CODE=MR479AE1   # Código del merchant en SumUp
SUMUP_WEBHOOK_SECRET=          # Para verificar firma HMAC (vacío = skip en dev)
PUBLIC_SITE_URL=               # Para redirect_url en el checkout SumUp
```

---

## Modo desarrollo

### Sin SumUp configurado
Si `SUMUP_API_KEY` o `SUMUP_MERCHANT_CODE` están vacíos:
- La acción retorna `{ devMode: true, orderId }`
- El cliente llama `POST /api/test/simulate-payment { orderId }` (descuenta stock, actualiza estado, envía email)
- Luego redirige a `/checkout/exito?ref=orderId`

### Simular pago con SumUp configurado
`POST /api/test/simulate-payment { orderId }` — disponible en localhost/staging, bloqueado en producción.
Útil para Playwright tests sin tarjeta real.

---

## SDD — Decisiones de diseño

| Decisión | Alternativa | Razón |
|----------|-------------|-------|
| Widget embebido | Hosted checkout (redirect) | UX mejor — el cliente no abandona la página |
| Widget embebido | Formulario propio de tarjeta | PCI compliance — SumUp maneja todos los datos |
| Stock verify en server | Confiar en el client | El client puede ser manipulado |
| Crear orden antes del pago | Crear al confirmar | Evita pedidos sin orden en DB; el webhook la actualiza |
| Rollback si falla order_items | Dejar orden incompleta | Consistencia — una orden debe tener sus items |
| Email en create_order (no esperar webhook) | Solo email en webhook | El cliente recibe confirmación inmediata aunque el webhook demore |
| IVA incluido en precio | IVA encima | Ley chilena: precio al consumidor incluye IVA |

---

## Test Cases

### TC-CHK-01 — Checkout crea orden y monta widget
```
DADO un carrito con 1+ productos y stock suficiente
CUANDO el cliente completa el formulario y hace submit
ENTONCES se crea una orden en DB con status='created', payment_status='pending'
Y se llama a SumUp API y se recibe checkoutId
Y el widget SumUp aparece en la página
Y el cliente recibe email de confirmación del pedido
```

### TC-CHK-02 — Pago exitoso → confirmación inmediata
```
DADO un widget SumUp montado con checkoutId válido
CUANDO el cliente paga exitosamente
ENTONCES onResponse('success') llama POST /api/sumup/confirm
Y la orden cambia a payment_status='paid', status='preparing'
Y el stock de cada variante se descuenta
Y el cliente recibe email de confirmación de pago
Y cart.clear() se llama
Y el cliente es redirigido a /checkout/exito?ref=orderId con banner verde "Pago confirmado"
```

### TC-CHK-03 — Webhook confirma pago
```
DADO una orden con payment_status='pending'
CUANDO SumUp envía POST /api/sumup/webhook con status='PAID'
ENTONCES la orden cambia a payment_status='paid', status='preparing'
Y se inserta registro en order_history
Y el stock de cada variante se descuenta
Y el cliente recibe email de confirmación de pago
```

### TC-CHK-04 — Webhook con firma inválida es rechazado
```
DADO un POST a /api/sumup/webhook con firma HMAC incorrecta
Y SUMUP_WEBHOOK_SECRET está configurado
CUANDO el servidor lo recibe
ENTONCES responde 401
Y la orden NO se modifica
Y el stock NO se descuenta
```

### TC-CHK-05 — Stock insuficiente bloquea la orden
```
DADO un producto con stock=1 en el carrito con quantity=2
CUANDO el cliente intenta hacer checkout
ENTONCES el server retorna error 409
Y se muestra mensaje: "Sin stock suficiente para {producto}"
Y NO se crea ninguna orden
```

### TC-CHK-06 — Carrito vacío no puede hacer checkout
```
DADO un carrito vacío
CUANDO el cliente visita /checkout
ENTONCES se muestra "Tu carrito está vacío" con link a la tienda
Y el formulario no se muestra
```

### TC-CHK-07 — Campos obligatorios validados
```
DADO el formulario de checkout sin completar
CUANDO el cliente hace submit sin nombre, email, calle, región o ciudad
ENTONCES el server retorna error 400
Y se muestra el mensaje de error en la página
```

### TC-CHK-08 — Pago rechazado vuelve al formulario
```
DADO un widget SumUp montado
CUANDO SumUp retorna onResponse('error')
ENTONCES se muestra mensaje de error
Y el widget desaparece
Y el formulario vuelve a ser visible
Y la orden queda en payment_status='pending' (puede reintentarse)
```

### TC-CHK-09 — Página de éxito con pago pendiente
```
DADO una orden con payment_status='pending' (webhook aún no llegó)
CUANDO el cliente visita /checkout/exito?ref=orderId
ENTONCES se muestra banner amarillo "Pago pendiente"
Y se muestran todos los datos del pedido
```

### TC-CHK-10 — Página de éxito con pago confirmado
```
DADO una orden con payment_status='paid'
CUANDO el cliente visita /checkout/exito?ref=orderId
ENTONCES se muestra banner verde "Pago confirmado"
```

### TC-CHK-11 — Teléfono es campo obligatorio
```
DADO el formulario de checkout
CUANDO el cliente intenta hacer submit sin número de teléfono
ENTONCES el server retorna error 400
Y se muestra "Completa todos los campos obligatorios"
```

### TC-CHK-12 — Simulate payment descuenta stock (solo dev)
```
DADO una orden creada en modo dev/testing
CUANDO se llama POST /api/test/simulate-payment { orderId }
ENTONCES la orden cambia a payment_status='paid', status='preparing'
Y el stock de cada variante se descuenta
Y se envía email de pago confirmado
Y en producción (PUBLIC_SITE_URL sin localhost) → responde 403
```

---

## Notas de seguridad

- `SUMUP_API_KEY` solo se usa en `+page.server.ts` (acción server) — nunca llega al browser
- Webhook verifica HMAC-SHA256 antes de procesar cualquier cambio
- Orden se crea ANTES del pago para evitar pérdida de datos
- Stock se descuenta en `/api/sumup/confirm` (client-triggered tras pago) + webhook SumUp (server-triggered, como respaldo)
- `/api/sumup/confirm` verifica estado real con SumUp API antes de procesar cualquier cambio
- El checkout server verifica stock contra la DB, no contra el valor del cliente
- `checkout_reference` = `order.id` (UUID) — único por diseño
