ALTER TABLE users ADD COLUMN is_premium integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN premium_until text;
ALTER TABLE users ADD COLUMN stripe_customer_id text;
