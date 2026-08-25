CREATE TABLE IF NOT EXISTS seller_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email_verified_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS seller_login_tokens (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  claim_link_id TEXT,
  terms_version TEXT,
  privacy_version TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  used_at TEXT
);

CREATE TABLE IF NOT EXISTS seller_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES seller_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS legal_acceptances (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  accepted_at TEXT NOT NULL,
  FOREIGN KEY (account_id) REFERENCES seller_accounts(id) ON DELETE CASCADE
);

ALTER TABLE seller_links ADD COLUMN owner_account_id TEXT;
ALTER TABLE seller_links ADD COLUMN claim_token_hash TEXT;
ALTER TABLE seller_links ADD COLUMN claim_expires_at TEXT;

CREATE INDEX IF NOT EXISTS idx_seller_links_owner ON seller_links(owner_account_id);
CREATE INDEX IF NOT EXISTS idx_seller_login_email ON seller_login_tokens(email);
CREATE INDEX IF NOT EXISTS idx_seller_sessions_account ON seller_sessions(account_id);
