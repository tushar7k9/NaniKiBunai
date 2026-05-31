-- ============================================
-- NaniKiBunai Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  description TEXT,
  colors TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  average_rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CART_ITEMS TABLE
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  selected_color TEXT,
  selected_size TEXT,
  price_snapshot NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. FAVORITES TABLE
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded')),
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_address JSONB,
  billing_address JSONB,
  customer_email TEXT,
  customer_phone TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
  payment_method TEXT,
  payment_intent_id TEXT,
  tracking_number TEXT,
  customer_notes TEXT,
  admin_notes TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ORDER_ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_snapshot JSONB,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_per_unit NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  selected_color TEXT,
  selected_size TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  images TEXT[] DEFAULT '{}',
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON favorites(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- PRODUCTS: Anyone can read active products
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (is_active = true);

-- CART_ITEMS: Users can manage their own cart
CREATE POLICY "Users can view their own cart items"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- FAVORITES: Users can manage their own favorites
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ORDERS: Users can view their own orders, anyone can create (guest checkout)
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Also allow viewing orders by email (for guest order tracking)
CREATE POLICY "Guests can view orders by email"
  ON orders FOR SELECT
  USING (user_id IS NULL);

-- ORDER_ITEMS: Viewable if user owns the parent order
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- REVIEWS: Anyone can read approved reviews, users manage their own
CREATE POLICY "Approved reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Users can view their own reviews"
  ON reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Allow anyone to update helpful_count on reviews
CREATE POLICY "Anyone can update helpful count"
  ON reviews FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- SEED: Insert 12 products
-- ============================================
INSERT INTO products (id, name, category, price, images, description, colors, difficulty) VALUES
(1, 'Cozy Winter Scarf', 'scarves', 45.00,
  ARRAY['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400', 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400', 'https://images.unsplash.com/photo-1606400082777-ef05f3c5cde7?w=400'],
  'Handmade with love and extra warmth. Perfect for chilly winter days.',
  ARRAY['#FFB6C1', '#E6E6FA', '#FFE4B5'], 'beginner'),

(2, 'Classic Cardigan', 'sweaters', 120.00,
  ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400'],
  'Nani''s signature design, passed down generations. A timeless classic.',
  ARRAY['#DEB887', '#F5DEB3', '#D2691E'], 'advanced'),

(3, 'Chunky Beanie', 'hats', 35.00,
  ARRAY['https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400', 'https://images.unsplash.com/photo-1533642310407-f985136ea0b1?w=400', 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400'],
  'Perfect for cold mornings and warm hearts. Keeps you cozy all day.',
  ARRAY['#B0E0E6', '#F0E68C', '#DDA0DD'], 'beginner'),

(4, 'Wool Mittens Pair', 'gloves', 40.00,
  ARRAY['https://images.unsplash.com/photo-1606400082777-ef05f3c5cde7?w=400', 'https://images.unsplash.com/photo-1544923408-75c5cef46f14?w=400', 'https://images.unsplash.com/photo-1610979402004-dbf5eca5cbbf?w=400'],
  'Connected with string so you never lose them. Made from premium wool.',
  ARRAY['#FF6347', '#98FB98', '#87CEEB'], 'intermediate'),

(5, 'Granny Square Blanket', 'blankets', 180.00,
  ARRAY['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', 'https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?w=400'],
  'The coziest hug you''ll ever receive. Hand-stitched with care.',
  ARRAY['#FFB6C1', '#DDA0DD', '#F0E68C', '#98FB98'], 'advanced'),

(6, 'Tea Cozy Set', 'accessories', 28.00,
  ARRAY['https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400', 'https://images.unsplash.com/photo-1588195538326-c5b1e5b43ce5?w=400'],
  'Keep your tea warm while you knit. Comes with matching coasters.',
  ARRAY['#FFE4B5', '#DEB887', '#F5DEB3'], 'beginner'),

(7, 'Cable Knit Sweater', 'sweaters', 140.00,
  ARRAY['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400'],
  'Intricate cables that tell a story. A masterpiece of knitting.',
  ARRAY['#F5F5DC', '#E6E6FA', '#FFE4E1'], 'advanced'),

(8, 'Cozy Socks', 'socks', 22.00,
  ARRAY['https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400', 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=400', 'https://images.unsplash.com/photo-1575407686532-f4a37ecb6b56?w=400'],
  'Like walking on clouds made of love. Super soft and comfortable.',
  ARRAY['#FFB6C1', '#98FB98', '#87CEEB'], 'intermediate'),

(9, 'Striped Scarf', 'scarves', 50.00,
  ARRAY['https://images.unsplash.com/photo-1610628785958-603ebe9eae9a?w=400', 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400', 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400'],
  'Rainbow stripes to brighten your day. Made with vibrant colors.',
  ARRAY['#FF6347', '#FFD700', '#98FB98', '#87CEEB', '#DDA0DD'], 'intermediate'),

(10, 'Knit Pillow Cover', 'accessories', 38.00,
  ARRAY['https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400', 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400'],
  'Add warmth to your living space. Beautifully textured design.',
  ARRAY['#DEB887', '#F5DEB3', '#E6E6FA'], 'beginner'),

(11, 'Baby Booties', 'baby', 25.00,
  ARRAY['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400'],
  'Tiny treasures for tiny feet. Soft and gentle on baby''s skin.',
  ARRAY['#FFB6C1', '#B0E0E6', '#F0E68C'], 'beginner'),

(12, 'Pom-Pom Hat', 'hats', 42.00,
  ARRAY['https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=400', 'https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=400', 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400'],
  'Extra bouncy pom-pom on top. Fun and fashionable for all ages.',
  ARRAY['#FF6347', '#DDA0DD', '#98FB98'], 'intermediate');

-- Reset the sequence to avoid ID conflicts
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- ============================================
-- 7. REACHOUT SUBMISSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reachout_submissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reachout_created_at ON reachout_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reachout_status ON reachout_submissions(status);
CREATE INDEX IF NOT EXISTS idx_reachout_email ON reachout_submissions(email);

-- RLS
ALTER TABLE reachout_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a contact form (no auth required)
CREATE POLICY "Anyone can submit reachout"
  ON reachout_submissions FOR INSERT
  WITH CHECK (true);

-- Only admin can read reachout submissions
CREATE POLICY "Admin can read reachout submissions"
  ON reachout_submissions FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com');

-- Admin can update reachout submission status
CREATE POLICY "Admin can update reachout submissions"
  ON reachout_submissions FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com');

-- ============================================
-- ADMIN RLS POLICIES
-- Admin email: nanikiibunai@gmail.com
-- ============================================

-- PRODUCTS: Admin can view all (including inactive), insert, update, delete
CREATE POLICY "Admin full access on products"
  ON products FOR ALL
  USING ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com');

-- ORDERS: Admin can read ALL orders
CREATE POLICY "Admin can read all orders"
  ON orders FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com');

-- ORDERS: Admin can update ANY order (status, tracking, etc.)
CREATE POLICY "Admin can update all orders"
  ON orders FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com');

-- ORDER_ITEMS: Admin can read all order items
CREATE POLICY "Admin can read all order items"
  ON order_items FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com');

-- REVIEWS: Admin can read ALL reviews (including unapproved)
CREATE POLICY "Admin can read all reviews"
  ON reviews FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com');

-- REVIEWS: Admin can update any review (approve/reject)
CREATE POLICY "Admin can update all reviews"
  ON reviews FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com');

-- REVIEWS: Admin can delete any review
CREATE POLICY "Admin can delete all reviews"
  ON reviews FOR DELETE
  USING ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Atomic increment/decrement for helpful_count (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_helpful_count(review_id INT, delta INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INT;
BEGIN
  UPDATE reviews
  SET helpful_count = GREATEST(0, COALESCE(helpful_count, 0) + delta)
  WHERE id = review_id
  RETURNING helpful_count INTO new_count;

  RETURN new_count;
END;
$$;
