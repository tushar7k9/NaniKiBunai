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
  stock_quantity INTEGER, -- NULL = stock not tracked (unlimited)
  low_stock_threshold INTEGER DEFAULT 10,
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
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'returned')),
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
  cancellation_reason TEXT CHECK (char_length(cancellation_reason) <= 300),
  customer_note TEXT CHECK (char_length(customer_note) <= 300),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4b. ORDER_EVENTS TABLE — audit trail of every order lifecycle change.
-- Rows are written ONLY by the log_order_event trigger (no INSERT policy).
CREATE TABLE IF NOT EXISTS order_events (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'status_change', 'payment_change')),
  from_status TEXT,
  to_status TEXT,
  actor TEXT NOT NULL CHECK (actor IN ('customer', 'admin', 'system')),
  note TEXT CHECK (char_length(note) <= 500),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);

-- ── Order lifecycle triggers ─────────────────────────────────

-- Audit: record creation, status changes, and payment changes with actor
CREATE OR REPLACE FUNCTION log_order_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor TEXT;
BEGIN
  IF (auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com' THEN
    v_actor := 'admin';
  ELSIF TG_OP = 'INSERT' THEN
    v_actor := 'customer'; -- orders are created by the buyer (incl. guests)
  ELSIF auth.uid() IS NOT NULL AND auth.uid() = NEW.user_id THEN
    v_actor := 'customer';
  ELSE
    v_actor := 'system';
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO order_events (order_id, event_type, to_status, actor)
    VALUES (NEW.id, 'created', NEW.status, v_actor);
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO order_events (order_id, event_type, from_status, to_status, actor, note)
      VALUES (
        NEW.id, 'status_change', OLD.status, NEW.status, v_actor,
        CASE
          WHEN NEW.status = 'cancelled' THEN NEW.cancellation_reason
          -- customer-facing note set alongside the change (e.g. delay
          -- explanation on a backward move) is kept in the timeline too
          WHEN NEW.customer_note IS DISTINCT FROM OLD.customer_note THEN NEW.customer_note
        END
      );
    END IF;
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
      INSERT INTO order_events (order_id, event_type, from_status, to_status, actor)
      VALUES (NEW.id, 'payment_change', OLD.payment_status, NEW.payment_status, v_actor);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS orders_log_event ON orders;
CREATE TRIGGER orders_log_event
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_event();

-- State machine guard: the database is the source of truth for which
-- transitions are legal, no matter which client attempts them.
-- Also enforces: refunds only for paid orders, and syncs payment_status
-- when an order becomes refunded.
CREATE OR REPLACE FUNCTION enforce_order_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- maintenance escape hatch: SQL editor (postgres) and service role
  IF current_user IN ('postgres', 'supabase_admin') OR auth.role() = 'service_role' THEN
    IF NEW.status = 'refunded' AND NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.payment_status := 'refunded';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'pending'    AND NEW.status IN ('confirmed', 'cancelled')) OR
      (OLD.status = 'confirmed'  AND NEW.status IN ('processing', 'cancelled')) OR
      (OLD.status = 'processing' AND NEW.status IN ('shipped', 'cancelled')) OR
      (OLD.status = 'shipped'    AND NEW.status IN ('delivered', 'processing')) OR
      (OLD.status = 'delivered'  AND NEW.status IN ('completed', 'returned', 'shipped')) OR
      (OLD.status = 'cancelled'  AND NEW.status = 'refunded') OR
      (OLD.status = 'returned'   AND NEW.status = 'refunded')
    ) THEN
      RAISE EXCEPTION 'INVALID_ORDER_TRANSITION: % -> %', OLD.status, NEW.status;
    END IF;

    IF NEW.status = 'refunded' THEN
      IF OLD.payment_status <> 'paid' THEN
        RAISE EXCEPTION 'REFUND_REQUIRES_PAYMENT';
      END IF;
      NEW.payment_status := 'refunded';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_enforce_transition ON orders;
CREATE TRIGGER orders_enforce_transition
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION enforce_order_transition();

-- Customer cancellation: the ONLY way customers mutate their orders.
-- Atomic status gate in the WHERE clause kills both the JS-only guard
-- and the cancel-vs-ship race.
CREATE OR REPLACE FUNCTION cancel_my_order(p_order_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS SETOF orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE orders
  SET status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = NULLIF(left(trim(coalesce(p_reason, '')), 300), ''),
      updated_at = now()
  WHERE id = p_order_id
    AND user_id = auth.uid()
    AND status IN ('pending', 'confirmed')
  RETURNING *;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_CANCELLABLE';
  END IF;
END;
$$;

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
  is_featured BOOLEAN NOT NULL DEFAULT false, -- hand-picked for the homepage
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. STORE_SETTINGS TABLE (singleton row — admin-controlled store-wide modes)
CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT DEFAULT '' CHECK (char_length(maintenance_message) <= 300),
  orders_paused BOOLEAN NOT NULL DEFAULT false,
  orders_paused_message TEXT DEFAULT '' CHECK (char_length(orders_paused_message) <= 250),
  banner_enabled BOOLEAN NOT NULL DEFAULT false,
  banner_text TEXT DEFAULT '' CHECK (char_length(banner_text) <= 250),
  theme TEXT NOT NULL DEFAULT 'default' CHECK (theme IN ('default', 'diwali', 'holiday')),
  -- Bumped by a trigger on any products change; clients watch it via the
  -- store_settings Realtime channel and refetch the catalog. (Realtime on
  -- products directly can't deliver deactivations to anonymous clients:
  -- an inactive row no longer passes the public SELECT policy.)
  catalog_version BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Signal catalog changes to all connected clients
CREATE OR REPLACE FUNCTION bump_catalog_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE store_settings SET catalog_version = catalog_version + 1 WHERE id = 1;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS products_bump_catalog_version ON products;
CREATE TRIGGER products_bump_catalog_version
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH STATEMENT EXECUTE FUNCTION bump_catalog_version();

-- Whether the store currently accepts new orders (used by the orders
-- INSERT policy). STABLE + pinned search_path; settings are public-read
-- so no SECURITY DEFINER is needed.
CREATE OR REPLACE FUNCTION store_accepts_orders()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NOT (maintenance_mode OR orders_paused) FROM store_settings WHERE id = 1
$$;

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
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

-- ORDER_EVENTS: readable by the order's owner (incl. their pre-signup guest
-- orders by verified email) and the admin; written only by triggers
CREATE POLICY "Order events viewable by owner and admin"
  ON order_events FOR SELECT
  USING (
    (auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com'
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_events.order_id
      AND (
        o.user_id = auth.uid()
        OR (o.user_id IS NULL AND lower(o.customer_email) = lower(auth.jwt() ->> 'email'))
      )
    )
  );

-- STORE_SETTINGS: public read (store modes are public info), admin-only
-- write, no INSERT/DELETE policies (seed row is created by the owner)
CREATE POLICY "Store settings are viewable by everyone"
  ON store_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin can update store settings"
  ON store_settings FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com');

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

-- Orders can be created while the store is open (maintenance / orders
-- pause blocks them at the database level, not just in the UI). The
-- admin can always place orders (e.g. test orders while paused).
CREATE POLICY "Orders allowed when store is open"
  ON orders FOR INSERT
  WITH CHECK (
    coalesce(store_accepts_orders(), true) -- fail-open if settings row missing
    OR (auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com'
  );

-- NOTE: customers have NO direct UPDATE policy on orders. Their only
-- mutation path is the cancel_my_order() RPC, which enforces ownership
-- and the pending/confirmed gate atomically. (A broad UPDATE policy
-- previously let any customer set arbitrary status/payment values.)

-- Guest orders are visible only to a signed-in user whose verified email
-- matches (NOT to anonymous visitors — that would expose all guest orders)
CREATE POLICY "Users can view guest orders matching their email"
  ON orders FOR SELECT
  USING (
    user_id IS NULL
    AND lower(customer_email) = lower(auth.jwt() ->> 'email')
  );

-- Let signed-in users claim guest orders placed with their email
-- (used by linkGuestOrdersToUser at login)
CREATE POLICY "Users can claim guest orders matching their email"
  ON orders FOR UPDATE
  USING (
    user_id IS NULL
    AND lower(customer_email) = lower(auth.jwt() ->> 'email')
  )
  WITH CHECK (user_id = auth.uid());

-- ORDER_ITEMS: Viewable if user owns the parent order (incl. their guest orders)
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid()
        OR (orders.user_id IS NULL AND lower(orders.customer_email) = lower(auth.jwt() ->> 'email'))
      )
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

-- ============================================
-- MIGRATION 2026-08: 'returned' status, disruption timestamps,
-- admin RLS for cart/favorites (Users + Analytics admin views).
-- The base definitions above already include these changes for
-- fresh installs — run ONLY this section in the SQL Editor to
-- upgrade an existing database. Idempotent: safe to re-run.
-- ============================================

-- 1. Allow 'returned' order status
--    (inline CHECK constraints get the auto-generated name orders_status_check;
--     verify with: SELECT conname FROM pg_constraint
--                  WHERE conrelid = 'orders'::regclass AND contype = 'c';)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered',
                    'completed', 'cancelled', 'refunded', 'returned'));

-- 2. Disruption timestamps (set from the app on status transitions,
--    like shipped_at/delivered_at; used by Analytics time-series)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- 3. Admin read access to carts and favorites (user drill-down view)
DROP POLICY IF EXISTS "Admin can read all cart items" ON cart_items;
CREATE POLICY "Admin can read all cart items"
  ON cart_items FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com');

DROP POLICY IF EXISTS "Admin can read all favorites" ON favorites;
CREATE POLICY "Admin can read all favorites"
  ON favorites FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com');

-- ============================================
-- MIGRATION 2026-08-23: guest order privacy.
-- The old "Guests can view orders by email" policy exposed EVERY guest
-- order (email, phone, shipping address) to anyone with the public anon
-- key. Guest orders are now visible/claimable only by a signed-in user
-- whose verified JWT email matches. Also fixes login-time guest-order
-- linking, which previously matched no rows (no UPDATE policy covered
-- guest orders). Idempotent: safe to re-run.
-- NOTE: deploy alongside the app update that stops using .select() on
-- guest checkout inserts (anonymous users can no longer read orders back).
-- ============================================

DROP POLICY IF EXISTS "Guests can view orders by email" ON orders;
DROP POLICY IF EXISTS "Users can view guest orders matching their email" ON orders;
CREATE POLICY "Users can view guest orders matching their email"
  ON orders FOR SELECT
  USING (
    user_id IS NULL
    AND lower(customer_email) = lower(auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS "Users can claim guest orders matching their email" ON orders;
CREATE POLICY "Users can claim guest orders matching their email"
  ON orders FOR UPDATE
  USING (
    user_id IS NULL
    AND lower(customer_email) = lower(auth.jwt() ->> 'email')
  )
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid()
        OR (orders.user_id IS NULL AND lower(orders.customer_email) = lower(auth.jwt() ->> 'email'))
      )
    )
  );

-- Stock columns the app already reads (Sold Out badges, quantity caps,
-- low-stock warnings) but which never existed in the live database —
-- every stock feature was silently dormant. NULL = stock not tracked.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;

-- ============================================
-- MIGRATION 2026-08-23b: store settings (admin-controlled maintenance
-- mode, announcement banner, orders pause, festive theme) with
-- database-level order blocking and Realtime broadcasting.
-- The base definitions above already include this for fresh installs —
-- run ONLY this section in the SQL Editor to upgrade an existing
-- database. Idempotent: safe to re-run.
-- ============================================

CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT DEFAULT '' CHECK (char_length(maintenance_message) <= 300),
  orders_paused BOOLEAN NOT NULL DEFAULT false,
  orders_paused_message TEXT DEFAULT '' CHECK (char_length(orders_paused_message) <= 250),
  banner_enabled BOOLEAN NOT NULL DEFAULT false,
  banner_text TEXT DEFAULT '' CHECK (char_length(banner_text) <= 250),
  theme TEXT NOT NULL DEFAULT 'default' CHECK (theme IN ('default', 'diwali', 'holiday')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store settings are viewable by everyone" ON store_settings;
CREATE POLICY "Store settings are viewable by everyone"
  ON store_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can update store settings" ON store_settings;
CREATE POLICY "Admin can update store settings"
  ON store_settings FOR UPDATE
  USING ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com');

CREATE OR REPLACE FUNCTION store_accepts_orders()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT NOT (maintenance_mode OR orders_paused) FROM store_settings WHERE id = 1
$$;

-- Enforce order blocking at the database (stale tabs / tampered clients
-- can't order while the store is paused); admin can always order
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Orders allowed when store is open" ON orders;
CREATE POLICY "Orders allowed when store is open"
  ON orders FOR INSERT
  WITH CHECK (
    coalesce(store_accepts_orders(), true)
    OR (auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com'
  );

-- Broadcast settings changes to all connected clients (safe to re-run)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE store_settings;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- MIGRATION 2026-08-23c: live catalog updates.
-- Any change to products (deactivation, stock, price, new item) bumps
-- store_settings.catalog_version via trigger; open tabs already
-- subscribed to store_settings Realtime see the bump and silently
-- refetch the catalog — so nobody can keep shopping stale products
-- without a reload. Idempotent: safe to re-run.
-- ============================================

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS catalog_version BIGINT NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION bump_catalog_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE store_settings SET catalog_version = catalog_version + 1 WHERE id = 1;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS products_bump_catalog_version ON products;
CREATE TRIGGER products_bump_catalog_version
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH STATEMENT EXECUTE FUNCTION bump_catalog_version();

-- ============================================
-- MIGRATION 2026-08-23d: payment-aware order lifecycle.
-- COD payment model (no more simulated 'paid'), order_events audit
-- trail, database-enforced status transitions (refunds only for paid
-- orders, payment auto-synced on refund), customer mutations locked
-- down to an atomic cancel RPC, cancellation reasons stored properly.
-- The base definitions above already include this for fresh installs —
-- run ONLY this section in the SQL Editor to upgrade an existing
-- database. Idempotent: safe to re-run.
-- ============================================

-- 1. Cancellation reason gets its own column (was hijacking admin_notes)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT CHECK (char_length(cancellation_reason) <= 300);

-- 2. Audit trail
CREATE TABLE IF NOT EXISTS order_events (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'status_change', 'payment_change')),
  from_status TEXT,
  to_status TEXT,
  actor TEXT NOT NULL CHECK (actor IN ('customer', 'admin', 'system')),
  note TEXT CHECK (char_length(note) <= 500),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);

ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Order events viewable by owner and admin" ON order_events;
CREATE POLICY "Order events viewable by owner and admin"
  ON order_events FOR SELECT
  USING (
    (auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com'
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_events.order_id
      AND (
        o.user_id = auth.uid()
        OR (o.user_id IS NULL AND lower(o.customer_email) = lower(auth.jwt() ->> 'email'))
      )
    )
  );

CREATE OR REPLACE FUNCTION log_order_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor TEXT;
BEGIN
  IF (auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com' THEN
    v_actor := 'admin';
  ELSIF TG_OP = 'INSERT' THEN
    v_actor := 'customer';
  ELSIF auth.uid() IS NOT NULL AND auth.uid() = NEW.user_id THEN
    v_actor := 'customer';
  ELSE
    v_actor := 'system';
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO order_events (order_id, event_type, to_status, actor)
    VALUES (NEW.id, 'created', NEW.status, v_actor);
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO order_events (order_id, event_type, from_status, to_status, actor, note)
      VALUES (
        NEW.id, 'status_change', OLD.status, NEW.status, v_actor,
        CASE WHEN NEW.status = 'cancelled' THEN NEW.cancellation_reason END
      );
    END IF;
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
      INSERT INTO order_events (order_id, event_type, from_status, to_status, actor)
      VALUES (NEW.id, 'payment_change', OLD.payment_status, NEW.payment_status, v_actor);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS orders_log_event ON orders;
CREATE TRIGGER orders_log_event
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_event();

-- 3. Database-enforced state machine
CREATE OR REPLACE FUNCTION enforce_order_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin') OR auth.role() = 'service_role' THEN
    IF NEW.status = 'refunded' AND NEW.status IS DISTINCT FROM OLD.status THEN
      NEW.payment_status := 'refunded';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (
      (OLD.status = 'pending'    AND NEW.status IN ('confirmed', 'cancelled')) OR
      (OLD.status = 'confirmed'  AND NEW.status IN ('processing', 'cancelled')) OR
      (OLD.status = 'processing' AND NEW.status IN ('shipped', 'cancelled')) OR
      (OLD.status = 'shipped'    AND NEW.status IN ('delivered', 'processing')) OR
      (OLD.status = 'delivered'  AND NEW.status IN ('completed', 'returned', 'shipped')) OR
      (OLD.status = 'cancelled'  AND NEW.status = 'refunded') OR
      (OLD.status = 'returned'   AND NEW.status = 'refunded')
    ) THEN
      RAISE EXCEPTION 'INVALID_ORDER_TRANSITION: % -> %', OLD.status, NEW.status;
    END IF;

    IF NEW.status = 'refunded' THEN
      IF OLD.payment_status <> 'paid' THEN
        RAISE EXCEPTION 'REFUND_REQUIRES_PAYMENT';
      END IF;
      NEW.payment_status := 'refunded';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_enforce_transition ON orders;
CREATE TRIGGER orders_enforce_transition
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION enforce_order_transition();

-- 4. Customers mutate orders ONLY through the atomic cancel RPC
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

CREATE OR REPLACE FUNCTION cancel_my_order(p_order_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS SETOF orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE orders
  SET status = 'cancelled',
      cancelled_at = now(),
      cancellation_reason = NULLIF(left(trim(coalesce(p_reason, '')), 300), ''),
      updated_at = now()
  WHERE id = p_order_id
    AND user_id = auth.uid()
    AND status IN ('pending', 'confirmed')
  RETURNING *;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_CANCELLABLE';
  END IF;
END;
$$;

-- 5. Honest data: undo the simulated 'paid' flags from the old checkout
UPDATE orders
SET payment_status = 'pending', payment_method = 'cod'
WHERE payment_intent_id = 'simulated-payment-intent'
  AND status <> 'refunded';


-- ============================================================
-- MIGRATION 2026-08-23e: customer-facing order note.
-- Run this in the Supabase SQL Editor (safe to re-run).
--
-- Adds orders.customer_note — a short message from the admin that the
-- customer sees on their order (e.g. a delay explanation when an order
-- is moved back from shipped to processing). The audit trigger records
-- the note in the timeline whenever it changes with a status change.
-- ============================================================

-- 1. Column (admin-written; customers read it via their own-orders SELECT)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_note TEXT CHECK (char_length(customer_note) <= 300);

-- 2. Audit trigger: keep customer_note changes in the timeline
CREATE OR REPLACE FUNCTION log_order_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor TEXT;
BEGIN
  IF (auth.jwt() ->> 'email') = 'nanikiibunai@gmail.com' THEN
    v_actor := 'admin';
  ELSIF TG_OP = 'INSERT' THEN
    v_actor := 'customer'; -- orders are created by the buyer (incl. guests)
  ELSIF auth.uid() IS NOT NULL AND auth.uid() = NEW.user_id THEN
    v_actor := 'customer';
  ELSE
    v_actor := 'system';
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO order_events (order_id, event_type, to_status, actor)
    VALUES (NEW.id, 'created', NEW.status, v_actor);
  ELSE
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO order_events (order_id, event_type, from_status, to_status, actor, note)
      VALUES (
        NEW.id, 'status_change', OLD.status, NEW.status, v_actor,
        CASE
          WHEN NEW.status = 'cancelled' THEN NEW.cancellation_reason
          -- customer-facing note set alongside the change (e.g. delay
          -- explanation on a backward move) is kept in the timeline too
          WHEN NEW.customer_note IS DISTINCT FROM OLD.customer_note THEN NEW.customer_note
        END
      );
    END IF;
    IF NEW.payment_status IS DISTINCT FROM OLD.payment_status THEN
      INSERT INTO order_events (order_id, event_type, from_status, to_status, actor)
      VALUES (NEW.id, 'payment_change', OLD.payment_status, NEW.payment_status, v_actor);
    END IF;
  END IF;
  RETURN NULL;
END;
$$;


-- ============================================================
-- MIGRATION 2026-08-23f: homepage-featured reviews.
-- Run this in the Supabase SQL Editor (safe to re-run).
--
-- Adds reviews.is_featured — reviews the admin hand-picks for the
-- "Stories of Warmth" section on the home page. Featured reviews are
-- shown first; the best recent approved reviews fill remaining slots.
-- Only approved reviews are ever publicly readable (existing policy).
-- ============================================================

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;


-- ============================================================
-- MIGRATION 2026-08-23g: self-maintaining featured testimonials.
-- Run this in the Supabase SQL Editor (safe to re-run).
--
-- The homepage calls get_home_testimonials(). If fewer than 3 approved
-- text reviews are featured, it PROMOTES the best remaining ones
-- (marking is_featured = true) so the admin panel always shows exactly
-- which reviews are on the homepage. Un-featuring one simply lets the
-- next best review be promoted on the next visit.
-- ============================================================

CREATE OR REPLACE FUNCTION get_home_testimonials()
RETURNS TABLE (
  id INTEGER,
  user_name TEXT,
  rating INTEGER,
  review_text TEXT,
  created_at TIMESTAMPTZ,
  is_verified_purchase BOOLEAN,
  product_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Top the featured set up to 3 with the best approved text reviews.
  -- (All columns table-qualified: the RETURNS TABLE names would otherwise
  -- shadow them and raise 42702 "ambiguous column".)
  UPDATE reviews SET is_featured = true
  WHERE reviews.id IN (
    SELECT r.id FROM reviews r
    WHERE r.is_approved
      AND NOT r.is_featured
      AND coalesce(r.review_text, '') <> ''
    ORDER BY r.rating DESC, r.is_verified_purchase DESC, r.created_at DESC
    LIMIT GREATEST(
      0,
      3 - (SELECT count(*) FROM reviews rf
           WHERE rf.is_approved AND rf.is_featured AND coalesce(rf.review_text, '') <> '')
    )
  );

  RETURN QUERY
  SELECT r.id, r.user_name, r.rating, r.review_text, r.created_at,
         r.is_verified_purchase, p.name
  FROM reviews r
  JOIN products p ON p.id = r.product_id
  WHERE r.is_approved AND r.is_featured AND coalesce(r.review_text, '') <> ''
  ORDER BY r.rating DESC, r.is_verified_purchase DESC, r.created_at DESC
  LIMIT 3;
END;
$$;
