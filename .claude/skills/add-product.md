# Skill: add-product

Agrega un nuevo producto directamente al sistema vía Supabase.

## Pasos

1. Solicitar datos: nombre, subtítulo, descripción, categoría, precio, SKU
2. Solicitar variantes: color → tallas → stock por talla
3. Confirmar datos antes de insertar
4. INSERT en `products`
5. INSERT en `product_variants` por cada combinación
6. Confirmar que aparece en el shop

## Uso

/add-product
