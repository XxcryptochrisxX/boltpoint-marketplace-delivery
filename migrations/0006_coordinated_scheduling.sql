ALTER TABLE dispatch_orders ADD COLUMN scheduling_status TEXT NOT NULL DEFAULT 'not_required';
ALTER TABLE dispatch_orders ADD COLUMN seller_availability_windows TEXT;
ALTER TABLE dispatch_orders ADD COLUMN buyer_selection_token_hash TEXT;
ALTER TABLE dispatch_orders ADD COLUMN selected_delivery_window TEXT;
ALTER TABLE dispatch_orders ADD COLUMN schedule_confirmed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_dispatch_scheduling ON dispatch_orders(scheduling_status, updated_at);

