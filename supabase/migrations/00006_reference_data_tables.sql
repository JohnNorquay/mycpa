-- Migration: Reference Data Tables
-- Description: Creates irs_national_standards and tax_brackets tables

-- IRS National Standards (Reference Data)
CREATE TABLE IF NOT EXISTS irs_national_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  household_size INTEGER,
  state TEXT,
  county TEXT,
  amount DECIMAL(12,2) NOT NULL
);

-- Tax Brackets (Reference Data)
CREATE TABLE IF NOT EXISTS tax_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  filing_status TEXT NOT NULL,
  min_income DECIMAL(12,2) NOT NULL,
  max_income DECIMAL(12,2),
  rate DECIMAL(5,4) NOT NULL,
  base_tax DECIMAL(12,2) DEFAULT 0
);

-- Enable RLS but with public read access for authenticated users
ALTER TABLE irs_national_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_brackets ENABLE ROW LEVEL SECURITY;

-- Public read policies for reference tables
CREATE POLICY "Authenticated users can read standards" ON irs_national_standards
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read brackets" ON tax_brackets
  FOR SELECT TO authenticated USING (true);

-- Note: Write access for reference tables should be restricted to admin/service role only
-- These are managed by migrations/seeding, not user operations
