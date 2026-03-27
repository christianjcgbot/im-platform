# M1 · DASHBOARD — Spec

---

## Objetivo

Vista inicial del panel. Resumen del estado del negocio en tiempo real.

---

## Widgets

| Widget | Dato | Fuente |
|--------|------|--------|
| Ventas hoy | Suma de órdenes pagadas hoy | orders |
| Ventas semana | Suma 7 días | orders |
| Órdenes pendientes | Count status='pending' | orders |
| Stock bajo | Productos con alguna variante ≤ 2 unidades | product_variants |
| Últimas 5 órdenes | Lista con cliente, total, estado | orders |

---

## Test Cases

### TC-M1-01 — Badge órdenes pendientes
```
DADO 3 órdenes con status='pending'
CUANDO el operador ve el dashboard
ENTONCES el badge muestra "3"
```

### TC-M1-02 — Alerta stock bajo
```
DADO una variante con stock=1
CUANDO el operador ve el dashboard
ENTONCES aparece alerta con nombre del producto y variante
```
