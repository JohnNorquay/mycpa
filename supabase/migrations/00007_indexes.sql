-- Migration: Performance Indexes
-- Description: Creates indexes for commonly queried columns

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_user_profile_user ON user_profile(user_id);

-- Tax debt indexes
CREATE INDEX IF NOT EXISTS idx_tax_debt_user ON tax_debt(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_debt_year ON tax_debt(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_debt_user_year ON tax_debt(user_id, tax_year);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_tax_debt_payments_debt ON tax_debt_payments(tax_debt_id);
CREATE INDEX IF NOT EXISTS idx_tax_debt_payments_date ON tax_debt_payments(payment_date);

-- Correspondence indexes
CREATE INDEX IF NOT EXISTS idx_irs_correspondence_user ON irs_correspondence(user_id);
CREATE INDEX IF NOT EXISTS idx_irs_correspondence_debt ON irs_correspondence(tax_debt_id);

-- Financial snapshot indexes
CREATE INDEX IF NOT EXISTS idx_financial_snapshot_user ON financial_snapshot(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_snapshot_date ON financial_snapshot(snapshot_date);

-- Relief applications indexes
CREATE INDEX IF NOT EXISTS idx_relief_applications_user ON relief_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_relief_applications_status ON relief_applications(status);

-- Account indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_plaid_item ON accounts(plaid_item_id);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_tax_deductible ON transactions(is_tax_deductible) WHERE is_tax_deductible = true;

-- Recurring transactions indexes
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active ON recurring_transactions(is_active) WHERE is_active = true;

-- Tax documents indexes
CREATE INDEX IF NOT EXISTS idx_tax_documents_user ON tax_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_documents_year ON tax_documents(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_documents_user_year ON tax_documents(user_id, tax_year);

-- Tax projections indexes
CREATE INDEX IF NOT EXISTS idx_tax_projections_user ON tax_projections(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_projections_year ON tax_projections(tax_year);

-- Reference data indexes (for fast lookups)
CREATE INDEX IF NOT EXISTS idx_irs_standards_lookup ON irs_national_standards(year, category, household_size, state, county);
CREATE INDEX IF NOT EXISTS idx_tax_brackets_lookup ON tax_brackets(year, filing_status);
