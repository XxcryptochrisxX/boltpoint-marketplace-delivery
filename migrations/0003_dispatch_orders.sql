CREATE TABLE IF NOT EXISTS dispatch_orders (
  session_id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  shipday_order_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dispatch_orders_status ON dispatch_orders(status, updated_at);
