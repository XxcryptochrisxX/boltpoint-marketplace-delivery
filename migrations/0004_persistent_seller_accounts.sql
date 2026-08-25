-- Preserve existing unclaimed seller-account invitations and extend active sessions.
UPDATE seller_links
SET claim_expires_at = '9999-12-31T23:59:59.999Z'
WHERE owner_account_id IS NULL AND claim_token_hash IS NOT NULL;

UPDATE seller_login_tokens
SET expires_at = '9999-12-31T23:59:59.999Z'
WHERE claim_link_id IS NOT NULL AND used_at IS NULL;

UPDATE seller_sessions
SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+365 days')
WHERE expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now');
