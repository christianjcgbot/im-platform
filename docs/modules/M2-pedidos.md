# M2 · PEDIDOS — Spec

---

## Schema

```sql
orders (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sumup_id      text UNIQUE,              -- ID del checkout en SumUp
  status        text DEFAULT 'pending',   -- pending | paid | shipped | delivered | cancelled
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  address       jsonb,                    -- {street, city, region, zip}
  total         integer NOT NULL,         -- CLP
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
)

order_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id  uuid REFERENCES products(id),
  variant_id  uuid REFERENCES product_variants(id),
  name        text NOT NULL,             -- snapshot del nombre al momento de compra
  color       text,
  size        text,
  qty         integer NOT NULL,
  unit_price  integer NOT NULL
)
```

---

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/admin/pedidos` | Lista todos los pedidos |
| `/admin/pedidos/[id]` | Detalle + cambiar estado |
| `/api/webhook/sumup` | Recibe confirmación de pago de SumUp |

---

## Estados del pedido

```
pending → paid → shipped → delivered
              ↘ cancelled
```

---

## Test Cases

### TC-M2-01 — Webhook SumUp marca orden como pagada
```
DADO una orden con status='pending'
CUANDO SumUp envía webhook con status='PAID'
ENTONCES la orden cambia a status='paid'
Y el stock de los items se descuenta
```

### TC-M2-02 — Cambio de estado manual
```
DADO una orden con status='paid'
CUANDO el operador cambia a 'shipped'
ENTONCES el estado se actualiza en DB
Y se muestra en la lista con el nuevo estado
```

### TC-M2-03 — Orden cancelada no descuenta stock
```
DADO una orden cancelada antes de ser pagada
CUANDO se cancela
ENTONCES el stock NO se modifica
```
