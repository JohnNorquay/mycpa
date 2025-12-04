-- Migration: Add sync fields for Plaid transaction sync
-- Description: Adds cursor field to plaid_items and is_removed field to transactions

-- Add cursor field to plaid_items for incremental sync
ALTER TABLE plaid_items
ADD COLUMN IF NOT EXISTS cursor TEXT;

-- Add is_removed field to transactions for tracking deleted transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT FALSE;

-- Add index on is_removed for efficient queries
CREATE INDEX IF NOT EXISTS idx_transactions_is_removed
ON transactions(is_removed, user_id);
