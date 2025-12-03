-- Migration: Tax Debt Tables
-- Description: Creates tax_debt, tax_debt_payments, and irs_correspondence tables

-- Tax Debt
CREATE TABLE IF NOT EXISTS tax_debt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tax_year INTEGER NOT NULL,
  debt_type TEXT CHECK (debt_type IN ('income_tax', 'penalty_failure_to_file', 'penalty_failure_to_pay', 'interest', 'other')),
  original_amount DECIMAL(12,2) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,4) DEFAULT 0.08,
  penalty_rate DECIMAL(5,4),
  source TEXT CHECK (source IN ('w2_shortage', '1099_unreported', 'business', 'estimated_tax', 'other')),
  collection_status TEXT CHECK (collection_status IN ('normal', 'notice_sent', 'lien_filed', 'levy_pending', 'levy_active', 'garnishment', 'currently_not_collectible')) DEFAULT 'normal',
  statute_expiration_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Debt Payments
CREATE TABLE IF NOT EXISTS tax_debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_debt_id UUID REFERENCES tax_debt(id) ON DELETE CASCADE NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT,
  applied_to TEXT CHECK (applied_to IN ('principal', 'interest', 'penalty', 'mixed')),
  confirmation_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IRS Correspondence
CREATE TABLE IF NOT EXISTS irs_correspondence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tax_debt_id UUID REFERENCES tax_debt(id) ON DELETE SET NULL,
  notice_date DATE NOT NULL,
  notice_type TEXT NOT NULL,
  notice_number TEXT,
  response_deadline DATE,
  status TEXT CHECK (status IN ('received', 'in_review', 'response_sent', 'resolved', 'escalated')) DEFAULT 'received',
  document_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tax_debt ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE irs_correspondence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tax_debt
CREATE POLICY "Users can view own tax debt" ON tax_debt
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax debt" ON tax_debt
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax debt" ON tax_debt
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax debt" ON tax_debt
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tax_debt_payments
CREATE POLICY "Users can view own payments" ON tax_debt_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tax_debt
      WHERE tax_debt.id = tax_debt_payments.tax_debt_id
      AND tax_debt.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own payments" ON tax_debt_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tax_debt
      WHERE tax_debt.id = tax_debt_payments.tax_debt_id
      AND tax_debt.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own payments" ON tax_debt_payments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tax_debt
      WHERE tax_debt.id = tax_debt_payments.tax_debt_id
      AND tax_debt.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own payments" ON tax_debt_payments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tax_debt
      WHERE tax_debt.id = tax_debt_payments.tax_debt_id
      AND tax_debt.user_id = auth.uid()
    )
  );

-- RLS Policies for irs_correspondence
CREATE POLICY "Users can view own correspondence" ON irs_correspondence
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own correspondence" ON irs_correspondence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own correspondence" ON irs_correspondence
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own correspondence" ON irs_correspondence
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_tax_debt_updated_at
  BEFORE UPDATE ON tax_debt
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_irs_correspondence_updated_at
  BEFORE UPDATE ON irs_correspondence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
