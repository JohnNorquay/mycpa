-- Migration: Add last_synced to plaid_items
-- Description: Adds last_synced timestamp to plaid_items table for tracking sync operations

ALTER TABLE plaid_items
ADD COLUMN IF NOT EXISTS last_synced TIMESTAMPTZ;
