# M3 · PRODUCTOS — Spec

> Módulo central. Todo el sistema gira en torno a un producto bien definido.

---

## Objetivo

Permitir al operador crear, editar y publicar productos con variantes, fotos y stock. Un producto creado en este módulo debe aparecer inmediatamente en el shop público.

---

## Flujo principal (North Star)

```
Operador entra al panel
  → Va a Productos → Nuevo Producto
  → Completa formulario (nombre, descripción, categoría, precio, fotos)
  → Agrega variantes (color → talla → stock)
  → Cambia estado a "Disponible"
  → Guarda
  → El producto aparece en shop.imsportswear.cl
```

---

## Schema de datos (Supabase)

```sql
-- Tabla principal
products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  subtitle    text,
  description text,
  category_id uuid REFERENCES categories(id),
  price       integer NOT NULL,        -- en pesos CLP sin decimales
  compare_price integer,               -- precio tachado (opcional)
  cost        integer,                 -- costo interno (no público)
  sku         text UNIQUE,
  status      text DEFAULT 'draft',    -- 'available' | 'draft' | 'sold_out'
  featured    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
)

-- Variantes: cada combinación color+talla es una fila
product_variants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  color       text NOT NULL,
  size        text NOT NULL,
  stock       integer DEFAULT 0,
  sku_variant text
)

-- Imágenes
product_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid REFERENCES products(id) ON DELETE CASCADE,
  url         text NOT NULL,           -- URL de Supabase Storage
  position    integer DEFAULT 0,       -- orden de aparición
  alt         text
)
```

---

## Rutas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/admin/productos` | Page | Lista de todos los productos |
| `/admin/productos/nuevo` | Page | Formulario crear producto |
| `/admin/productos/[id]` | Page | Editar producto existente |
| `/api/products` | GET | Lista productos públicos (shop) |
| `/api/products/[id]` | GET | Detalle producto público |

---

## Formulario — campos

### Información principal
- **Nombre** — text, requerido
- **Subtítulo** — text (ej: "Tenis · Dryfit")
- **Descripción** — textarea
- **Categoría** — select (desde M5)

### Precios
- **Precio** — integer CLP, requerido
- **Precio comparación** — integer CLP, opcional (se muestra tachado)
- **Costo** — integer CLP, solo visible en admin

### Estado (sidebar)
- **Estado** — select: Disponible / Borrador / Agotado
- **Destacado** — checkbox (aparece en home)

### Imágenes
- Upload múltiple → Supabase Storage → URL pública
- Drag para reordenar
- Mínimo recomendado: 1 foto

### Variantes
- Agregar color (ej: Negro, Navy, Blanco, Burdeo)
- Por cada color: agregar tallas con stock
- Tallas predefinidas: XS, S, M, L, XL, Única
- Stock por variante: integer ≥ 0

### Propiedades
- **SKU** — text, único
- **Marca** — text (default: IM Sportswear)

---

## Comportamiento esperado

| Acción | Resultado |
|--------|-----------|
| Guardar con estado "Borrador" | No aparece en el shop |
| Cambiar a "Disponible" | Aparece en shop inmediatamente |
| Stock variante llega a 0 | Esa talla se muestra deshabilitada en PDP |
| Todas las variantes en 0 | Producto se marca "Agotado" automáticamente |
| Eliminar producto | Soft delete — no se borra de DB, status = 'archived' |

---

## Test Cases

### TC-M3-01 — Crear producto básico
```
DADO un operador autenticado
CUANDO completa nombre, precio y guarda con estado "Disponible"
ENTONCES el producto aparece en /admin/productos
Y aparece en el shop público
```

### TC-M3-02 — Crear producto con variantes
```
DADO un operador en formulario de nuevo producto
CUANDO agrega color "Negro" con tallas M:3, L:3
Y color "Navy" con talla M:2
Y guarda
ENTONCES en el shop la PDP muestra los 2 colores
Y al seleccionar Negro, muestra tallas M y L
Y al seleccionar Navy, muestra solo M
```

### TC-M3-03 — Producto en borrador no es público
```
DADO un producto con status "draft"
CUANDO el cliente visita el shop
ENTONCES el producto NO aparece en la lista
Y si accede directo por URL devuelve 404
```

### TC-M3-04 — Stock agotado
```
DADO una variante con stock = 0
CUANDO el cliente llega a la PDP
ENTONCES esa talla aparece deshabilitada
Y no se puede agregar al carrito
```

### TC-M3-05 — Subir foto
```
DADO un operador en formulario de producto
CUANDO sube una imagen JPG/PNG < 5MB
ENTONCES la imagen se guarda en Supabase Storage
Y la URL pública se asocia al producto
Y se muestra preview en el formulario
```

### TC-M3-06 — Precio tachado
```
DADO un producto con precio=25990 y compare_price=32000
CUANDO aparece en el shop
ENTONCES se muestra "$25.990" en negro y "$32.000" tachado en gris
```

---

## Dependencias

- **M5 Categorías** — para el select de categoría
- **MEDIA** — para upload de imágenes
- **AUTH** — todas las rutas /admin/* requieren sesión
- **M4 Inventario** — lectura/escritura de stock

---

## Estado de implementación

- [ ] Schema SQL en Supabase
- [ ] RLS policies
- [ ] GET /api/products
- [ ] GET /api/products/[id]
- [ ] UI lista productos
- [ ] UI formulario crear
- [ ] UI formulario editar
- [ ] Upload imágenes (MEDIA)
- [ ] Variantes dinámicas
- [ ] Test cases pasando
