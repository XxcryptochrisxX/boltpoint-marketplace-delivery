CREATE TABLE IF NOT EXISTS seller_links (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active',
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_seller_links_created_at ON seller_links(created_at DESC);
