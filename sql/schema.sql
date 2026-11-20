-- Buxin Store schema (Neon / Postgres)

CREATE TABLE IF NOT EXISTS store_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'Buxin Store',
  whatsapp_number text NOT NULL DEFAULT '',
  cloudinary_cloud_name text NOT NULL DEFAULT '',
  cloudinary_upload_preset text NOT NULL DEFAULT '',
  currency text NOT NULL DEFAULT 'GMD',
  currency_locale text NOT NULL DEFAULT 'en-GM',
  usd_to_inr numeric NOT NULL DEFAULT 88,
  inr_to_gmd numeric NOT NULL DEFAULT 0.8003321,
  price_markup numeric NOT NULL DEFAULT 1,
  shipping_fee numeric NOT NULL DEFAULT 0,
  price_factor numeric NOT NULL DEFAULT 1,
  price_offset numeric NOT NULL DEFAULT 0,
  price_last_operation text NOT NULL DEFAULT '',
  price_last_amount numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  title text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  cost_usd numeric,
  price_currency text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  images jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS price_currency text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS products_category_idx ON products (category);
CREATE INDEX IF NOT EXISTS products_name_idx ON products (name);

CREATE TABLE IF NOT EXISTS product_price_overrides (
  product_id text PRIMARY KEY REFERENCES products (id) ON DELETE CASCADE,
  price_gmd numeric NOT NULL CHECK (price_gmd >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gambia_products (
  product_id text PRIMARY KEY REFERENCES products (id) ON DELETE CASCADE,
  marked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS suppliers_name_lower_idx ON suppliers (lower(name));

CREATE TABLE IF NOT EXISTS supplier_products (
  id text PRIMARY KEY,
  supplier_id text NOT NULL REFERENCES suppliers (id) ON DELETE CASCADE,
  name text NOT NULL,
  title text NOT NULL DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'General',
  description text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS supplier_products_supplier_idx ON supplier_products (supplier_id, created_at DESC);
