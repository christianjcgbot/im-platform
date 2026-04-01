# M6 · CONFIGURACIÓN — Spec & SDD

**Estado: ✅ Completo**

---

## Objetivo

Permitir al operador configurar los parámetros globales de la tienda sin tocar código: datos de contacto, reglas de envío, tallas predefinidas y mapa de colores.

---

## Ruta

`/admin/configuracion`

---

## Secciones

### 1. Datos de la tienda
- Nombre de la tienda
- Email de contacto
- Teléfono (opcional)
- Dirección (opcional)
- Guardado en `settings` con key `'store'`

### 2. Configuración de envío
- **Umbral envío gratis** (CLP): si el subtotal ≥ este valor, envío = 0
- **Costo de envío** (CLP): cobro fijo si no alcanza el umbral
- **Días hábiles de despacho**: número que se muestra en el shop y en emails
- Guardado en `settings` con key `'shipping'`

### 3. Tallas predefinidas
- Lista ordenable de tallas (XS, S, M, L, XL, XXL, Única…)
- Botones ↑↓ para cambiar orden
- Agregar nueva talla con input + Enter o botón
- Eliminar talla con ×
- Orden guardado define cómo aparecen en el selector de variantes del shop
- Guardado en `settings` con key `'sizes'` como array JSON

### 4. Colores predefinidos
- Lista de colores con swatch visual
- Agregar: color picker nativo + campo nombre
- Eliminar color existente
- El mapa `name → hex` se usa en la PDP para colorear los botones de color
- Guardado en `settings` con key `'colors'` como array `[{ name, hex }]`

---

## Schema

```sql
settings (
  key        text PRIMARY KEY,  -- 'store' | 'shipping' | 'sizes' | 'colors'
  value      jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
)
```

Ejemplo de valores:
```json
// key='store'
{ "name": "IM Sportswear", "email": "hola@imsportswear.cl", "phone": "+56 9 1234 5678", "address": "Santiago, Chile" }

// key='shipping'
{ "free_threshold": 50000, "cost": 4990, "days": 5 }

// key='sizes'
["XS", "S", "M", "L", "XL", "XXL", "Única"]

// key='colors'
[{ "name": "Negro", "hex": "#141414" }, { "name": "Blanco", "hex": "#e8e5e0" }]
```

---

## SDD — Decisiones de diseño

| Decisión | Razón |
|----------|-------|
| 4 formularios independientes | Cada sección guarda sin afectar las otras — menos riesgo de perder datos |
| `upsert` en settings | Si no existe la key, la crea; si existe, la actualiza — idempotente |
| `$state` local + `$effect` para binding | `value={data.x}` no es reactivo después de edición del usuario — se necesita `bind:value={localState}` |
| Tallas como array JSON | Permite orden arbitrario definido por el operador |
| Colores como array `{ name, hex }` | Permite mostrar el swatch sin hardcodear colores en el frontend del shop |

---

## Test Cases

### TC-M6-01 — Guardar datos de tienda
```
DADO el operador en la sección "Datos de la tienda"
CUANDO cambia el nombre a "IM Sportswear Chile" y guarda
ENTONCES la página muestra "Guardado correctamente"
Y el campo sigue mostrando "IM Sportswear Chile" (no se resetea)
Y en DB: settings WHERE key='store' tiene el nuevo nombre
```

### TC-M6-02 — Configurar umbral de envío gratis
```
DADO shipping.free_threshold=50000
CUANDO el operador lo cambia a 30000 y guarda
ENTONCES en el checkout: subtotales ≥ $30.000 muestran envío gratis
Y subtotales < $30.000 muestran el costo configurado
```

### TC-M6-03 — Agregar nueva talla
```
DADO la lista de tallas existente
CUANDO el operador escribe "3XL" y hace click en Agregar
ENTONCES "3XL" aparece al final de la lista
Y al guardar, aparece disponible en el selector de variantes de M3
```

### TC-M6-04 — Reordenar tallas
```
DADO tallas en orden [XS, S, M, L, XL]
CUANDO el operador mueve "XL" hacia arriba hasta posición 1
Y guarda
ENTONCES el selector de variantes en M3 muestra XL primero
```

### TC-M6-05 — Agregar color con hex personalizado
```
DADO la lista de colores
CUANDO el operador selecciona hex #FF5733 y nombre "Coral" y agrega
ENTONCES el swatch muestra el color naranja-rojizo
Y al guardar, en la PDP del shop el botón del color "Coral" aparece con ese color
```

### TC-M6-06 — Datos persisten después de guardar
```
DADO el operador que acaba de guardar exitosamente
CUANDO recarga la página
ENTONCES todos los campos muestran los valores guardados
(No se resetean a valores anteriores)
```
