-- Migration: Plaid/Banking Tables
-- Description: Creates plaid_items, accounts, transactions, recurring_transactions, and categories tables

-- Plaid Items
CREATE TABLE IF NOT EXISTS plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL,
  access_token TEXT NOT NULL, -- Note: Should be encrypted at application level
  institution_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plaid_item_id UUID REFERENCES plaid_items(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  subtype TEXT,
  current_balance DECIMAL(12,2),
  available_balance DECIMAL(12,2),
  last_synced TIMESTAMPTZ,
  UNIQUE(plaid_item_id, account_id)
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_category TEXT,
  is_tax_deductible BOOLEAN DEFAULT FALSE,
  color TEXT
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  merchant_name TEXT,
  category TEXT,
  category_confidence DECIMAL(3,2),
  is_tax_deductible BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  notes TEXT,
  receipt_document_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, transaction_id)
);

-- Recurring Transactions
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  merchant_name TEXT NOT NULL,
  category TEXT,
  expected_amount DECIMAL(12,2),
  amount_variance DECIMAL(12,2),
  frequency TEXT CHECK (frequency IN ('weekly', 'biweekly', 'semimonthly', 'monthly', 'quarterly', 'annual')),
  expected_day INTEGER,
  last_occurrence DATE,
  next_expected DATE,
  is_income BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plaid_items
CREATE POLICY "Users can view own plaid items" ON plaid_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plaid items" ON plaid_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plaid items" ON plaid_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plaid items" ON plaid_items
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for accounts
CREATE POLICY "Users can view own accounts" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" ON accounts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for categories
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for recurring_transactions
CREATE POLICY "Users can view own recurring transactions" ON recurring_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring transactions" ON recurring_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions" ON recurring_transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions" ON recurring_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_transactions_updated_at
  BEFORE UPDATE ON recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
