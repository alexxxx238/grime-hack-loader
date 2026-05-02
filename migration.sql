-- Run this once on your existing database
-- Adds columns needed by the loader site

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS product VARCHAR(50) DEFAULT 'GRIME:ALTV' AFTER license_key_hash,
  ADD COLUMN IF NOT EXISTS encrypted_key TEXT AFTER expires_at;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin TINYINT(1) DEFAULT 0 AFTER is_active,
  ADD COLUMN IF NOT EXISTS is_banned TINYINT(1) DEFAULT 0 AFTER is_admin,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL AFTER created_at;

-- Make yourself admin (replace with your email)
-- UPDATE users SET is_admin = 1 WHERE email = 'your@email.com';
