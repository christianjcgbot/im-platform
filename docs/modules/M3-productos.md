# M3 · PRODUCTOS — Spec & SDD

> Módulo central. Todo el sistema gira en torno a un producto bien definido.

**Estado: ✅ Completo**

---

## Objetivo

Permitir al operador crear, editar y publicar productos con variantes, fotos y stock. Un producto publicado aparece inmediatamente en el shop público.

---

## Flujo principal (North Star)

```
Operador en panel
  → Productos → Nuevo Producto
  → Completa: nombre, descripción, categoría, precio, imágenes
  → Agrega variantes (color → talla → stock inicial)
  → Cambia estado a "Disponible"
  → Guarda
  → El producto aparece en shop.imsportswear.cl inmediatamente
```

## Flujo de creación de producto — `/admin/productos/nuevo`

El formulario usa `enctype="multipart/form-data"`. Incluye un selector de imágenes opcional (`input[name="images"]`, `multiple`).

Al guardar, el servidor ejecuta en orden:
1. Crea el producto (`products` INSERT)
2. Sube las fotos a Supabase Storage (si se adjuntaron)
3. Inserta las variantes en `product_variants`
4. Redirige a `/admin/productos/[id]` para continuar el setup del producto recién creado

```ts
throw redirect(303, `/admin/productos/${product.id}`);
```

La redirección lleva directamente al editor del producto (no a la lista), para que el operador pueda completar el tageo de imágenes, ajustar SEO y revisar variantes sin pasos adicionales.

---

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/admin/productos` | Lista de todos los productos |
| `/admin/productos/nuevo` | Formulario crear producto |
| `/admin/productos/[id]` | Editar producto existente |

---

## Schema de datos

Ver `CLAUDE.md` para schema completo de `products`, `product_variants`, `product_images`.

- `product_images.color` (text, nullable): nombre del color al que pertenece la imagen; null = todas

**Estados del producto:**
- `available` — visible en el shop
- `draft` — oculto en el shop (borrador)
- `discontinued` — descontinuado, oculto

---

## Formulario — campos implementados

### Información principal
- **Nombre** — text, requerido
- **Subtítulo** — text (ej: "Polera · Dryfit")
- **Descripción** — rich text (Tiptap: Bold, Italic, H2, H3, Bullet, Ordered)
- **Categoría** — select con opción "+" para crear inline sin salir del formulario

### Precios
- **Precio** — integer CLP, requerido
- **Precio comparación** — integer CLP, opcional (se muestra tachado en shop)
- **Costo** — integer CLP, solo visible en admin (no llega al shop)

### Estado (sidebar)
- **Estado** — select: Disponible / Borrador / Descontinuado
- **Destacado** — checkbox (marcado = aparece primero en home)

### Imágenes
- Upload múltiple → Supabase Storage (`products/` bucket) → URL pública
- Guardadas en tabla `product_images` con `position`
- Reordenamiento con flechas ↑↓ (actualiza `position` vía acción server)
- Delete individual con confirmación
- Lightbox al hacer click en preview
- **Selector de imágenes en `/nuevo`**: el formulario de creación incluye un campo `images` (multiple) para subir fotos al mismo tiempo que se crea el producto
- **Tag de color por imagen** (en `/admin/productos/[id]`): selector debajo de cada foto para asociarla a un color del producto
  - "Todos los colores" = imagen general, aparece para cualquier color
  - Al seleccionar un color específico, esa imagen solo se muestra en PDP cuando ese color está activo
  - Auto-guarda al cambiar el selector mediante la action `?/tag_image_color` (guarda `product_images.color`)

#### Estructura HTML de cada imagen en admin (`img-item`)

```html
<div class="img-item">
  <div class="img-photo">
    <!-- imagen, badge "Principal", botones de reorden y eliminar -->
  </div>
  <form method="POST" action="?/tag_image_color">
    <!-- select de color -->
  </form>
</div>
```

El grid usa `grid-template-columns: repeat(auto-fill, minmax(110px, 1fr))`.

### Variantes
- Tabla: Color + Talla + Stock inicial
- Agregar/eliminar filas dinámicamente
- Al guardar: INSERT/UPDATE/DELETE variantes en `product_variants`
- Los colores se muestran como swatches en el shop usando el mapa `colors` de settings

### SEO
- **Slug** — auto-generado desde nombre al escribir (editable manualmente)
- **Meta description** — textarea con counter de 155 chars
- **Google preview card** — preview en tiempo real de cómo aparece en buscadores

### Categoría inline
- Botón "+" al lado del select de categoría
- Abre modal con formulario de creación
- Al guardar: la nueva categoría aparece en el select y queda seleccionada automáticamente
- No sale del formulario de producto

---

## Comportamiento en el shop

| Acción | Resultado |
|--------|-----------|
| status = 'draft' | No aparece en listado ni en PDP (404) |
| status = 'available' | Aparece en listado y PDP |
| Variante stock = 0 | Esa talla/color aparece deshabilitada en PDP |
| compare_price > price | Se muestra precio tachado en gris |
| featured = true | Aparece primero en el listado |

### Galería de imágenes en PDP — filtrado por color

La PDP calcula `imagesForColor` en tiempo real al cambiar el color seleccionado:

```ts
// Si hay imágenes tageadas con el color activo, muestra solo esas.
// Fallback: si ninguna imagen tiene ese color, muestra todas.
$: imagesForColor = images.some(img => img.color === selectedColor)
  ? images.filter(img => img.color === selectedColor || img.color === null)
  : images;
```

Esto asegura que la galería nunca queda vacía: si el operador aún no tageó las fotos, el cliente igual ve todas las imágenes del producto.

---

## SDD — Decisiones de diseño

| Decisión | Razón |
|----------|-------|
| Imágenes en `product_images` separada de `products.images` | La tabla `product_images` permite queries, RLS y reordenamiento limpio. El campo `images` jsonb en products es un legado del diseño inicial |
| Rich text con Tiptap | Alternativa ligera a Quill/ProseMirror, sin dependencias pesadas |
| Slug auto-generado pero editable | UX: no hay que escribirlo, pero se puede personalizar para SEO |
| Variantes en tabla separada | Permite expandir colores/tallas sin cambiar el schema de products |
| Categoría inline | UX: el operador no pierde el contexto del producto al crear una categoría |
| Redirección a `[id]` al crear, no a la lista | El producto recién creado necesita tageo de imágenes, SEO y revisión de variantes — ir directo al editor evita un clic extra y reduce abandono del setup |
| `tag_image_color` como action separada | La actualización de color de imagen es atómica e independiente del resto del formulario; usar una action dedicada evita revalidar todo el producto en cada cambio de selector |
| Fallback "mostrar todas" en galería PDP | Si ninguna imagen está tageada con el color activo, mostrar vacío sería un bug visible para el cliente. El fallback es seguro y no requiere que el operador tagee fotos antes de publicar |

---

## Test Cases

### TC-M3-01 — Crear producto básico
```
DADO un operador autenticado
CUANDO completa nombre, precio y guarda con estado "Disponible"
ENTONCES el producto aparece en /admin/productos
Y aparece en el shop público en el listado
```

### TC-M3-02 — Crear producto con variantes
```
DADO un operador en formulario de nuevo producto
CUANDO agrega color "Negro" con tallas M:3, L:3
Y color "Navy" con talla M:2
Y guarda
ENTONCES en la PDP del shop se muestran los 2 colores
Y al seleccionar Negro, se muestran tallas M y L
Y al seleccionar Navy, solo se muestra M
```

### TC-M3-03 — Producto en borrador no es público
```
DADO un producto con status='draft'
CUANDO el cliente visita el shop
ENTONCES el producto NO aparece en el listado
Y si accede directamente por URL devuelve 404
```

### TC-M3-04 — Stock agotado deshabilita variante
```
DADO una variante con stock=0
CUANDO el cliente llega a la PDP
ENTONCES esa talla aparece deshabilitada (no clickeable)
Y el botón de agregar al carrito dice "Agotado" o está disabled
```

### TC-M3-05 — Subir imagen
```
DADO un operador en formulario de producto
CUANDO sube una imagen JPG/PNG
ENTONCES la imagen se guarda en Supabase Storage
Y la URL pública se asocia al producto en product_images
Y se muestra preview en el formulario
```

### TC-M3-06 — Precio tachado
```
DADO un producto con price=25990 y compare_price=32000
CUANDO aparece en el shop
ENTONCES se muestra "$25.990" y "$32.000" tachado en gris
```

### TC-M3-07 — Slug auto-generado
```
DADO un operador escribiendo nombre "Polera Dry Fit"
CUANDO escribe en el campo nombre
ENTONCES el slug se actualiza automáticamente a "polera-dry-fit"
Y el slug es editable manualmente si se necesita personalizar
```

### TC-M3-08 — Crear categoría inline
```
DADO un operador en el formulario de producto
CUANDO hace click en "+" junto al select de categoría
Y escribe "Poleras" en el modal y guarda
ENTONCES la nueva categoría aparece en el select
Y queda seleccionada automáticamente
Y el modal se cierra
```

### TC-M3-09 — Reordenar imágenes
```
DADO un producto con 3 imágenes
CUANDO el operador hace click en ↑ en la imagen 2
ENTONCES la imagen 2 pasa a posición 1
Y la imagen 1 pasa a posición 2
Y en el shop la primera imagen mostrada es la nueva posición 1
```

### TC-M3-10 — Crear producto con imágenes desde /nuevo
```
DADO un operador en /admin/productos/nuevo
CUANDO adjunta 2 imágenes, completa nombre y precio, y guarda
ENTONCES el servidor crea el producto, sube las fotos y redirige a /admin/productos/[id]
Y las 2 imágenes aparecen en la galería del editor
Y el operador puede tagear colores en esa misma pantalla
```

### TC-M3-11 — Tag de color en imagen
```
DADO un producto con color "Negro" y una imagen sin tag
CUANDO el operador selecciona "Negro" en el selector debajo de la imagen
ENTONCES se llama ?/tag_image_color y guarda product_images.color = 'Negro'
Y en el PDP del shop, al seleccionar Negro, esa imagen aparece en la galería
```

---

## Tests e2e relacionados

- **`tests/e2e/pdp.spec.ts` — TC-PDP-04**: verifica que la galería no rompe al cambiar de color. Test flexible: si ninguna imagen tiene tag de color, acepta que se muestren todas (el fallback es válido). No falla en tiendas donde las fotos aún no están tageadas.

---

## Dependencias

- **M5 Categorías** — para el select de categoría
- **Supabase Storage** — para upload de imágenes (`products/` bucket, público)
- **AUTH** — todas las rutas /admin/* requieren sesión
- **M4 Inventario** — lectura/escritura de stock de variantes
