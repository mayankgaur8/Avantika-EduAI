-- ============================================================
--  Avantika AI — Billing Tables
--  Run AFTER schema.sql
-- ============================================================

-- ── Plan prices (INR paise — Razorpay uses smallest currency unit) ────────────
CREATE TABLE plan_prices (
  plan          plan_type   PRIMARY KEY REFERENCES plan_limits (plan),
  display_name  TEXT        NOT NULL,
  amount_paise  INT         NOT NULL,   -- e.g. 29900 = ₹299
  currency      TEXT        NOT NULL DEFAULT 'INR',
  billing_cycle TEXT        NOT NULL DEFAULT 'monthly',  -- monthly | yearly
  description   TEXT
);

INSERT INTO plan_prices (plan, display_name, amount_paise, billing_cycle, description) VALUES
  ('free',      'Free',                    0,       'monthly', '10 quizzes/month'),
  ('teacher',   'Teacher Plan',        29900,       'monthly', 'Unlimited quizzes, PDF export'),
  ('institute', 'Coaching Institute', 199900,       'monthly', 'Multi-teacher, branding'),
  ('school',    'School Plan',        999900,       'yearly',  'Admin dashboard, bulk export');

-- ── Orders (one row per Razorpay order created) ──────────────────────────────
CREATE TABLE billing_orders (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  razorpay_order_id  TEXT        NOT NULL UNIQUE,
  plan               plan_type   NOT NULL,
  amount_paise       INT         NOT NULL,
  currency           TEXT        NOT NULL DEFAULT 'INR',
  status             TEXT        NOT NULL DEFAULT 'created',  -- created | paid | failed
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id         ON billing_orders (user_id);
CREATE INDEX idx_orders_razorpay_order  ON billing_orders (razorpay_order_id);

-- ── Payments (one row per successful Razorpay payment) ───────────────────────
CREATE TABLE billing_payments (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID        NOT NULL REFERENCES billing_orders (id),
  user_id              UUID        NOT NULL REFERENCES users (id),
  razorpay_payment_id  TEXT        NOT NULL UNIQUE,
  razorpay_signature   TEXT        NOT NULL,
  plan                 plan_type   NOT NULL,
  amount_paise         INT         NOT NULL,
  paid_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON billing_payments (user_id);

-- ── Auto updated_at on billing_orders ────────────────────────────────────────
CREATE TRIGGER billing_orders_updated_at
  BEFORE UPDATE ON billing_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
