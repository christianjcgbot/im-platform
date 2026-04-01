-- ─────────────────────────────────────────────────────────────────────────────
-- M6 Settings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT 'null'::jsonb,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_all" ON settings;
CREATE POLICY "service_all" ON settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO settings (key, value) VALUES
  ('store',    '{"name":"IM Sportswear","email":"hola@imsportswear.cl","phone":"","address":""}'::jsonb),
  ('shipping', '{"free_threshold":50000,"cost":4990,"days":5}'::jsonb),
  ('sizes',    '["XS","S","M","L","XL","XXL","Única"]'::jsonb),
  ('colors',   '[{"name":"Negro","hex":"#141414"},{"name":"Navy","hex":"#18293d"},{"name":"Blanco","hex":"#e8e5e0"},{"name":"Burdeo","hex":"#6b1f2a"},{"name":"Gris","hex":"#9ca3af"},{"name":"Rojo","hex":"#dc2626"},{"name":"Azul","hex":"#3b82f6"},{"name":"Verde","hex":"#22c55e"},{"name":"Beige","hex":"#d4c4a8"}]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number            integer UNIQUE,
  customer_name           text NOT NULL,
  customer_email          text NOT NULL,
  customer_phone          text,
  status                  text NOT NULL DEFAULT 'created'
                          CHECK (status IN ('created','preparing','shipped','delivered','cancelled')),
  payment_status          text NOT NULL DEFAULT 'pending'
                          CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_method          text,
  sumup_checkout_id       text,
  subtotal                integer NOT NULL DEFAULT 0,
  iva                     integer NOT NULL DEFAULT 0,
  shipping_cost           integer NOT NULL DEFAULT 0,
  total                   integer NOT NULL DEFAULT 0,
  shipping_provider       text,
  tracking_id             text,
  shipping_address        jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes                   text,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_all" ON orders;
CREATE POLICY "service_all" ON orders FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Order items
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id   uuid REFERENCES products(id) ON DELETE SET NULL,
  variant_id   uuid REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name text    NOT NULL,
  color        text    NOT NULL,
  size         text    NOT NULL,
  sku          text,
  image_url    text,
  unit_price   integer NOT NULL,
  quantity     integer NOT NULL DEFAULT 1,
  total        integer NOT NULL,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_all" ON order_items;
CREATE POLICY "service_all" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Order history
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_history (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id  uuid REFERENCES orders(id) ON DELETE CASCADE,
  status    text,
  comment   text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_all" ON order_history;
CREATE POLICY "service_all" ON order_history FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Product images (si no existe aún)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  url        text NOT NULL,
  position   integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read"   ON product_images;
DROP POLICY IF EXISTS "service_all" ON product_images;
CREATE POLICY "anon_read"   ON product_images FOR SELECT USING (true);
CREATE POLICY "service_all" ON product_images FOR ALL    USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Función: descontar stock de variante (usada desde webhook SumUp)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_stock(p_variant_id uuid, p_quantity integer)
RETURNS void AS $$
BEGIN
  UPDATE product_variants
  SET stock = GREATEST(0, stock - p_quantity)
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: updated_at en orders
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_updated_at ON orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
