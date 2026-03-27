# M5 · CATEGORÍAS — Spec

---

## Schema

```sql
categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  parent_id   uuid REFERENCES categories(id),  -- NULL = categoría raíz
  position    integer DEFAULT 0
)
```

## Árbol inicial

```
Tenis      (slug: tenis)
  └── Mujer    (slug: tenis-mujer)
  └── Hombre   (slug: tenis-hombre)
Running    (slug: running)
Urban      (slug: urban)
  └── Mujer    (slug: urban-mujer)
  └── Hombre   (slug: urban-hombre)
Accesorios (slug: accesorios)
```

---

## Test Cases

### TC-M5-01 — Crear subcategoría
```
DADO categoría "Tenis" existente
CUANDO se crea "Mujer" con parent_id = id de Tenis
ENTONCES aparece en el shop bajo Tenis como subcategoría
```
