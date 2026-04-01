# SHOP — Spec & SDD

> La cara pública del negocio. Debe ser impecable visualmente.

**Estado: ✅ Completo**

---

## Objetivo

Mostrar los productos de IM Sportswear al cliente final de manera atractiva, permitiendo explorar el catálogo, ver el detalle de cada producto y agregarlo al carrito para proceder al checkout.

---

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Listado de productos con filtros por categoría |
| `/productos/[slug]` | PDP — Product Detail Page |

---

## Listado de productos (`/`)

- Carga productos con `status='available'`
- Cada tarjeta muestra: imagen principal, nombre, subtítulo, precio, badge de estado
- **Filtro por categoría**: barra de tabs con todas las categorías activas + "Todos"
- Filtro por categoría incluye subcategorías: al filtrar por "Tenis" también aparecen productos asignados a subcategorías de "Tenis"
- Badge "Agotado" si todas las variantes tienen stock=0
- Badge "Nuevo" para productos creados en los últimos 30 días (o featured)
- Color dots: puntos circulares con el color de cada variante disponible
- Precio tachado si `compare_price` está configurado
- Orden: `featured` primero, luego por `created_at` desc

---

## PDP (`/productos/[slug]`)

### Galería de imágenes
- Imagen principal grande (cuadrada, object-cover)
- Thumbnails horizontales si hay más de 1 imagen para el color seleccionado
- Click en thumbnail → cambia imagen principal
- Sin imagen → placeholder con "IM" logo mark
- **Imágenes por color**: al seleccionar un color, la galería filtra a imágenes taggeadas con ese color
  - Si ninguna imagen tiene tag de color, muestra todas
  - Al cambiar de color → imagen principal vuelve a índice 0
  - El admin puede taggear cada imagen con un color desde el editor de producto

### Selector de variantes
**Color:**
- Swatches circulares con el color real (hex del mapa de colors en settings)
- Auto-selecciona el primer color con stock al cargar (`onMount`)
- Colores sin stock → deshabilitados (cursor not-allowed)
- Nombre del color seleccionado aparece junto al label

**Talla:**
- Solo se muestra si el color seleccionado tiene más de 1 talla, o si la talla no es "Única"
- Si solo existe "Única" → se auto-selecciona, el selector no aparece
- Tallas sin stock → deshabilitadas
- Se resetea al cambiar de color
- Tallas deduplicadas: si hay variantes duplicadas en DB, cada talla aparece solo una vez

### Stock badge
- `ok` (verde) → "Disponible"
- `low` (naranja) → "Últimas N unidades" — N ≤ `low_stock_threshold` (default: 3)
- `out` (rojo) → "Sin stock en esta talla"

### CTA — Agregar al carrito
- **Disabled + "Selecciona un color"** → si no hay color seleccionado
- **Disabled + "Selecciona una talla"** → si hay color pero no talla (y hay más de "Única")
- **Disabled + "Agotado"** → si la variante seleccionada tiene stock=0
- **Enabled + "Agregar al carrito — $XX.XXX"** → listo para comprar
- Al click: `cart.add(...)` + el drawer del carrito se abre

### Info de envío
- Línea fija: "Despacho en N días hábiles · Envío gratis sobre $XX.XXX" (valores de settings)

### Descripción
- HTML renderizado (rich text del admin)
- Solo se muestra si el producto tiene descripción

---

## ShopHeader

- Sticky al hacer scroll
- **Izquierda**: links de categorías principales
- **Centro**: logo "IM" con "SPORTSWEAR" debajo
- **Derecha**: ícono del carrito con badge contador de unidades
- Click en carrito → abre el `CartDrawer`
- **CartDrawer**: panel lateral derecho con items del carrito, totales, y botón "Ir al checkout"

---

## ShopFooter

- 4 columnas: brand (logo + tagline), navegación (Colección, Nosotros, FAQ), soporte (devoluciones, contacto), conecta (Instagram, Facebook)
- Fondo navy oscuro (#18293d)
- Copyright al fondo

---

## Cart Store (`src/lib/cart.svelte.ts`)

```typescript
cart.add(item)       // agrega (o suma +1 si ya existe), abre drawer
cart.remove(id)      // elimina por variantId
cart.update(id, qty) // actualiza cantidad (qty=0 → elimina)
cart.clear()         // vacía todo
cart.items           // CartItem[]
cart.total           // suma CLP
cart.count           // total unidades
cart.open            // estado del drawer
cart.show() / hide() / toggle()
initCart()           // hidrata desde localStorage (llamar en onMount)
```

**`CartItem`:**
```typescript
{
  variantId:   string
  productId:   string
  productName: string
  slug:        string
  color:       string
  size:        string
  price:       number
  imageUrl:    string | null
  quantity:    number
}
```

---

## SDD — Decisiones de diseño

| Decisión | Razón |
|----------|-------|
| Color → hex en cliente | El frontend del shop tiene un mapa `COLOR_HEX` local. En Fase 2 se migrará a usar el mapa de `settings.colors` del backend |
| Auto-selección del primer color | UX: el cliente ve inmediatamente el producto con una variante seleccionada |
| Auto-selección "Única" | UX: no tiene sentido mostrar un selector de una sola opción que siempre es igual |
| Cart en localStorage | No requiere login, persiste entre sesiones, cero latencia |
| `initCart()` en onMount | Evita hydration mismatch en SSR — el cart se hidrata solo en el cliente |

---

## Test Cases

### TC-SHOP-01 — Listado muestra solo productos disponibles
```
DADO productos con status='available', 'draft', 'discontinued'
CUANDO el cliente visita /
ENTONCES solo aparecen los productos con status='available'
```

### TC-SHOP-02 — Filtro por categoría
```
DADO productos en categorías "Poleras" y "Pantalones"
CUANDO el cliente hace click en "Poleras"
ENTONCES solo se muestran poleras
Y la URL cambia a /?categoria=poleras
```

### TC-SHOP-03 — Selector de variantes funciona correctamente
```
DADO un producto con Negro (M, L) y Blanco (S, M)
CUANDO el cliente selecciona "Negro"
ENTONCES aparecen tallas M y L
CUANDO cambia a "Blanco"
ENTONCES la talla seleccionada se resetea y aparecen S y M
```

### TC-SHOP-04 — Agregar al carrito
```
DADO una variante con stock > 0 seleccionada
CUANDO el cliente hace click en "Agregar al carrito"
ENTONCES el item aparece en el CartDrawer
Y el badge del carrito suma 1
Y el precio del drawer es correcto
```

### TC-SHOP-05 — No agregar variante agotada
```
DADO una variante con stock=0
CUANDO el cliente la selecciona
ENTONCES el botón dice "Agotado" y está disabled
Y no se puede hacer click
```

### TC-SHOP-06 — Cart persiste al recargar
```
DADO un carrito con 2 items
CUANDO el cliente recarga la página
ENTONCES los 2 items siguen en el carrito
Y el badge muestra el mismo número
```
