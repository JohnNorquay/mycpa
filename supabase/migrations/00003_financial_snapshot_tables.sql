-- Migration: Financial Snapshot Tables
-- Description: Creates financial_snapshot, irs_allowable_expenses, and relief_applications tables

-- Relief Applications (created first as it's referenced by financial_snapshot)
CREATE TABLE IF NOT EXISTS relief_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_type TEXT CHECK (application_type IN ('oic', 'installment_agreement', 'penalty_abatement', 'cnc')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'appealing')) DEFAULT 'draft',
  submission_date DATE,
  decision_date DATE,
  application_data JSONB,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Snapshot
CREATE TABLE IF NOT EXISTS financial_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  relief_application_id UUID REFERENCES relief_applications(id) ON DELETE SET NULL,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  monthly_gross_income DECIMAL(12,2),
  monthly_net_income DECIMAL(12,2),
  monthly_allowable_expenses DECIMAL(12,2),
  monthly_disposable_income DECIMAL(12,2),
  total_asset_equity DECIMAL(12,2),
  home_equity DECIMAL(12,2),
  vehicle_equity DECIMAL(12,2),
  bank_balance DECIMAL(12,2),
  investment_value DECIMAL(12,2),
  reasonable_collection_potential DECIMAL(12,2),
  future_income_months INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IRS Allowable Expenses
CREATE TABLE IF NOT EXISTS irs_allowable_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  financial_snapshot_id UUID REFERENCES financial_snapshot(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  irs_allowable_amount DECIMAL(12,2),
  actual_amount DECIMAL(12,2),
  variance DECIMAL(12,2),
  justification TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE relief_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE irs_allowable_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for relief_applications
CREATE POLICY "Users can view own relief applications" ON relief_applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own relief applications" ON relief_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relief applications" ON relief_applications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own relief applications" ON relief_applications
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for financial_snapshot
CREATE POLICY "Users can view own financial snapshots" ON financial_snapshot
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial snapshots" ON financial_snapshot
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial snapshots" ON financial_snapshot
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial snapshots" ON financial_snapshot
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for irs_allowable_expenses
CREATE POLICY "Users can view own allowable expenses" ON irs_allowable_expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own allowable expenses" ON irs_allowable_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allowable expenses" ON irs_allowable_expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own allowable expenses" ON irs_allowable_expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_relief_applications_updated_at
  BEFORE UPDATE ON relief_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_irs_allowable_expenses_updated_at
  BEFORE UPDATE ON irs_allowable_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
