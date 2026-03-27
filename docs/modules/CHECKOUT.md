# CHECKOUT — Spec

> Seguridad ante todo. El cliente nunca ingresa datos de tarjeta en nuestro código.

---

## Principio de seguridad

**SumUp maneja todos los datos sensibles de pago.** Nosotros solo:
1. Creamos el checkout via API (server-side, clave nunca expuesta)
2. Embebemos el widget de SumUp en nuestra página
3. Recibimos confirmación via webhook

Nunca tocamos números de tarjeta, CVV ni datos bancarios.

---

## Flujo completo

```
Cliente en carrito → "Pagar"
  → Formulario: nombre, email, teléfono, dirección
  → POST /api/checkout (server-side)
      → Crea orden en DB con status='pending'
      → Llama SumUp API: POST /v0.1/checkouts
      → Recibe checkout_id
  → Frontend monta SumUp widget con checkout_id
  → Cliente paga (SumUp maneja 3DS, tokenización)
  → SumUp POST /api/webhook/sumup
      → Verifica firma del webhook
      → Actualiza orden a status='paid'
      → Descuenta stock (llama M4)
  → Cliente ve página de confirmación
```

---

## Rutas

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/checkout` | Page | Formulario + widget SumUp |
| `/api/checkout` | POST | Crea orden + checkout SumUp |
| `/api/webhook/sumup` | POST | Confirma pago |
| `/checkout/confirmacion` | Page | Gracias por tu compra |

---

## Variables de entorno requeridas

```env
SUMUP_API_KEY=          # Nunca en el frontend
SUMUP_MERCHANT_CODE=
SUMUP_WEBHOOK_SECRET=   # Para verificar firma del webhook
```

---

## Test Cases

### TC-CHK-01 — Checkout crea orden pendiente
```
DADO un carrito con 2 productos
CUANDO el cliente completa el formulario y hace POST /api/checkout
ENTONCES se crea una orden en DB con status='pending'
Y se recibe un checkout_id de SumUp
Y el widget se monta en la página
```

### TC-CHK-02 — Webhook confirma pago
```
DADO una orden con status='pending' y sumup_id=X
CUANDO SumUp envía POST /api/webhook/sumup con status='PAID'
ENTONCES la orden cambia a status='paid'
Y el stock se descuenta correctamente
Y el cliente puede ver su confirmación
```

### TC-CHK-03 — Webhook con firma inválida es rechazado
```
DADO un POST a /api/webhook/sumup con firma incorrecta
CUANDO el servidor lo recibe
ENTONCES responde 401
Y la orden NO se modifica
```

### TC-CHK-04 — Carrito vacío no puede hacer checkout
```
DADO un carrito vacío
CUANDO el cliente intenta ir a /checkout
ENTONCES es redirigido al shop
```

### TC-CHK-05 — Stock insuficiente al momento de pago
```
DADO un producto con stock=1 en el carrito de 2 clientes simultáneos
CUANDO ambos intentan pagar al mismo tiempo
ENTONCES solo uno puede completar la compra
Y el segundo recibe error de stock insuficiente
```

---

## Notas de seguridad

- SUMUP_API_KEY solo se usa en `+server.ts` — nunca llega al browser
- Webhook verifica HMAC signature antes de procesar
- Orden se crea ANTES de redirigir al pago (evita pedidos sin orden)
- Stock se descuenta SOLO después de confirmación del webhook (no antes)
