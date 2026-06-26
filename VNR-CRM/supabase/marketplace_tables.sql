-- ============================================
-- VNR CRM - MARKETPLACE TABLES
-- Ejecutar este script en Supabase SQL Editor
-- ============================================

-- ============================================
-- CATEGORIES (Categorías de productos)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  product_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTS (Productos)
-- ============================================
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'out_of_stock');
CREATE TYPE product_type AS ENUM ('sale', 'rental');

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  promotional_price DECIMAL(12, 2),
  images TEXT[],
  image_url TEXT,
  status product_status DEFAULT 'active',
  stock INTEGER,
  sku VARCHAR(100),
  barcode VARCHAR(100),
  show_price BOOLEAN DEFAULT true,
  free_shipping BOOLEAN DEFAULT false,
  product_type product_type DEFAULT 'sale',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alteraciones para tablas existentes (ejecutar si las tablas ya existen)
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS promotional_price DECIMAL(12, 2);
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100);
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS show_price BOOLEAN DEFAULT true;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS free_shipping BOOLEAN DEFAULT false;
-- ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type product_type DEFAULT 'sale';

-- ============================================
-- PRODUCT_VARIANTS (Variantes de productos)
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sku VARCHAR(100),
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COUPONS (Cupones de descuento)
-- ============================================
CREATE TYPE coupon_discount_type AS ENUM ('percentage', 'fixed', 'free_shipping');
CREATE TYPE coupon_apply_to AS ENUM ('all', 'category', 'product');
CREATE TYPE coupon_status AS ENUM ('active', 'inactive', 'expired');

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type coupon_discount_type NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(12, 2) DEFAULT 0,
  apply_to coupon_apply_to DEFAULT 'all',
  apply_to_id UUID,
  include_shipping BOOLEAN DEFAULT false,
  min_cart_amount DECIMAL(12, 2),
  max_uses INTEGER,
  max_uses_per_user INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  first_purchase_only BOOLEAN DEFAULT false,
  status coupon_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROMOTIONS (Promociones)
-- ============================================
CREATE TYPE promotion_discount_type AS ENUM ('progressive', 'percentage', 'fixed');
CREATE TYPE promotion_apply_to AS ENUM ('all', 'categories', 'products');
CREATE TYPE promotion_status AS ENUM ('active', 'inactive', 'expired');

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  discount_type promotion_discount_type NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(12, 2),
  buy_quantity INTEGER,
  pay_quantity INTEGER,
  apply_to promotion_apply_to DEFAULT 'all',
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  status promotion_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS (Pedidos)
-- ============================================
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('not_paid', 'pending', 'paid', 'refunded');

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_lastname VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_dni VARCHAR(20),
  shipping_street VARCHAR(255),
  shipping_number VARCHAR(20),
  shipping_floor VARCHAR(20),
  shipping_postal_code VARCHAR(20),
  shipping_neighborhood VARCHAR(255),
  shipping_city VARCHAR(255),
  shipping_province VARCHAR(255),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(12, 2) DEFAULT 0,
  discount DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'not_paid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDER_ITEMS (Items de pedidos)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  variant_name VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============================================
-- TRIGGERS para updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER para actualizar product_count en categories
-- ============================================
CREATE OR REPLACE FUNCTION update_category_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE categories SET product_count = product_count + 1 WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories SET product_count = product_count - 1 WHERE id = OLD.category_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
    IF OLD.category_id IS NOT NULL THEN
      UPDATE categories SET product_count = product_count - 1 WHERE id = OLD.category_id;
    END IF;
    IF NEW.category_id IS NOT NULL THEN
      UPDATE categories SET product_count = product_count + 1 WHERE id = NEW.category_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_category_count AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION update_category_product_count();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies para admins (lectura y escritura total)
CREATE POLICY "Admins can do everything on categories" ON categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can do everything on products" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can do everything on product_variants" ON product_variants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can do everything on coupons" ON coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can do everything on promotions" ON promotions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can do everything on orders" ON orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can do everything on order_items" ON order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- DATOS INICIALES (Opcional)
-- ============================================
INSERT INTO categories (name, description, is_active) VALUES
  ('Bicicletas', 'Bicicletas eléctricas y convencionales', true),
  ('Monopatines', 'Monopatines eléctricos', true),
  ('Accesorios', 'Accesorios para movilidad', true),
  ('Repuestos', 'Repuestos y partes', true)
ON CONFLICT DO NOTHING;
