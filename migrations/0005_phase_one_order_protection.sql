ALTER TABLE dispatch_orders ADD COLUMN amount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE dispatch_orders ADD COLUMN booking_snapshot TEXT;
ALTER TABLE dispatch_orders ADD COLUMN seller_confirmation_status TEXT NOT NULL DEFAULT 'not_required';
ALTER TABLE dispatch_orders ADD COLUMN seller_confirmation_token_hash TEXT;
ALTER TABLE dispatch_orders ADD COLUMN seller_confirmed_at TEXT;
ALTER TABLE dispatch_orders ADD COLUMN pickup_pin_hash TEXT;
ALTER TABLE dispatch_orders ADD COLUMN pickup_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE dispatch_orders ADD COLUMN pickup_report TEXT;
ALTER TABLE dispatch_orders ADD COLUMN delivery_report TEXT;

CREATE TABLE IF NOT EXISTS order_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES dispatch_orders(session_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_events_session ON order_events(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_dispatch_seller_confirmation ON dispatch_orders(seller_confirmation_status, updated_at);
