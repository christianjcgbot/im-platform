# M4 · INVENTARIO — Spec

---

## Objetivo

Vista consolidada del stock. Ajuste manual por variante.

---

## Vista principal

Tabla con columnas: Producto | Color | Talla | Stock | Acción

Filtros: por categoría, por stock bajo (≤ 2), por agotado (= 0)

---

## Reglas de negocio

- Stock nunca puede ser negativo
- Ajuste de stock genera log con timestamp y motivo
- Cuando stock = 0: variante se deshabilita en el shop automáticamente
- Cuando TODAS las variantes de un producto = 0: producto se marca sold_out

---

## Schema adicional

```sql
inventory_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id  uuid REFERENCES product_variants(id),
  delta       integer NOT NULL,      -- positivo = entrada, negativo = salida
  reason      text,                  -- 'sale' | 'manual' | 'adjustment'
  order_id    uuid REFERENCES orders(id),
  created_at  timestamptz DEFAULT now()
)
```

---

## Test Cases

### TC-M4-01 — Ajuste manual de stock
```
DADO una variante con stock=3
CUANDO el operador ajusta a stock=5
ENTONCES stock queda en 5
Y se registra en inventory_log con reason='manual'
```

### TC-M4-02 — Stock no puede ser negativo
```
DADO una variante con stock=2
CUANDO se intenta ajustar a -1
ENTONCES el sistema rechaza con error de validación
```

### TC-M4-03 — Venta descuenta stock automáticamente
```
DADO variante Negro/M con stock=3
CUANDO se confirma una orden con 1 unidad de esa variante
ENTONCES stock queda en 2
Y se registra en inventory_log con reason='sale', order_id=X
```
