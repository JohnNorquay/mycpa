-- Migration: Seed standard deductions and tax constants
-- Created: 2025-12-04
-- Description: Creates tables for standard deductions and tax constants, seeds with 2024 data

-- ============================================================================
-- STANDARD DEDUCTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS standard_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  filing_status TEXT NOT NULL,
  base_amount DECIMAL(12,2) NOT NULL,
  additional_65_or_blind DECIMAL(12,2) DEFAULT 0,
  jurisdiction TEXT DEFAULT 'federal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_standard_deductions_year_jurisdiction
  ON standard_deductions(year, jurisdiction, filing_status);

-- Enable RLS
ALTER TABLE standard_deductions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Authenticated users can read standard deductions"
  ON standard_deductions
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- TAX CONSTANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_constants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  constant_name TEXT NOT NULL,
  constant_value DECIMAL(15,4) NOT NULL,
  description TEXT,
  jurisdiction TEXT DEFAULT 'federal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_tax_constants_year_jurisdiction
  ON tax_constants(year, jurisdiction, constant_name);

-- Enable RLS
ALTER TABLE tax_constants ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Authenticated users can read tax constants"
  ON tax_constants
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- SEED DATA: 2024 FEDERAL STANDARD DEDUCTIONS
-- ============================================================================

INSERT INTO standard_deductions (year, filing_status, base_amount, additional_65_or_blind, jurisdiction)
VALUES
  (2024, 'Single', 14600.00, 1950.00, 'federal'),
  (2024, 'Married Filing Jointly', 29200.00, 1550.00, 'federal'),
  (2024, 'Married Filing Separately', 14600.00, 1550.00, 'federal'),
  (2024, 'Head of Household', 21900.00, 1950.00, 'federal'),
  (2024, 'Qualifying Surviving Spouse', 29200.00, 1550.00, 'federal');

-- ============================================================================
-- SEED DATA: 2024 WISCONSIN STANDARD DEDUCTIONS
-- ============================================================================

-- Wisconsin uses base amounts with phase-out logic handled in code
INSERT INTO standard_deductions (year, filing_status, base_amount, additional_65_or_blind, jurisdiction)
VALUES
  (2024, 'Single', 12760.00, 0.00, 'wisconsin'),
  (2024, 'Married Filing Jointly', 23620.00, 0.00, 'wisconsin'),
  (2024, 'Married Filing Separately', 10580.00, 0.00, 'wisconsin'),
  (2024, 'Head of Household', 16390.00, 0.00, 'wisconsin');

-- ============================================================================
-- SEED DATA: 2024 TAX CONSTANTS (FEDERAL)
-- ============================================================================

INSERT INTO tax_constants (year, constant_name, constant_value, description, jurisdiction)
VALUES
  -- SALT and Deductions
  (2024, 'SALT_CAP', 10000.0000, 'State and Local Tax deduction cap', 'federal'),

  -- Social Security and Medicare
  (2024, 'SOCIAL_SECURITY_WAGE_BASE', 168600.0000, 'Maximum wages subject to Social Security tax', 'federal'),
  (2024, 'SOCIAL_SECURITY_RATE', 0.0620, 'Social Security tax rate (6.2%)', 'federal'),
  (2024, 'MEDICARE_RATE', 0.0145, 'Medicare tax rate (1.45%)', 'federal'),
  (2024, 'ADDITIONAL_MEDICARE_RATE', 0.0090, 'Additional Medicare tax rate for high earners (0.9%)', 'federal'),
  (2024, 'ADDITIONAL_MEDICARE_THRESHOLD_SINGLE', 200000.0000, 'Income threshold for additional Medicare tax (Single)', 'federal'),
  (2024, 'ADDITIONAL_MEDICARE_THRESHOLD_MFJ', 250000.0000, 'Income threshold for additional Medicare tax (MFJ)', 'federal'),
  (2024, 'ADDITIONAL_MEDICARE_THRESHOLD_MFS', 125000.0000, 'Income threshold for additional Medicare tax (MFS)', 'federal'),

  -- Self-Employment Tax
  (2024, 'SELF_EMPLOYMENT_TAX_RATE', 0.1530, 'Self-employment tax rate (15.3%)', 'federal'),

  -- Child Tax Credit
  (2024, 'CHILD_TAX_CREDIT_MAX', 2000.0000, 'Maximum Child Tax Credit per qualifying child', 'federal'),
  (2024, 'CHILD_TAX_CREDIT_PHASEOUT_SINGLE', 200000.0000, 'Child Tax Credit phase-out threshold (Single)', 'federal'),
  (2024, 'CHILD_TAX_CREDIT_PHASEOUT_MFJ', 400000.0000, 'Child Tax Credit phase-out threshold (MFJ)', 'federal'),

  -- Capital Gains Thresholds
  (2024, 'CAPITAL_GAINS_0PCT_THRESHOLD_SINGLE', 47025.0000, '0% capital gains rate threshold (Single)', 'federal'),
  (2024, 'CAPITAL_GAINS_15PCT_THRESHOLD_SINGLE', 518900.0000, '15% capital gains rate threshold (Single)', 'federal'),
  (2024, 'CAPITAL_GAINS_0PCT_THRESHOLD_MFJ', 94050.0000, '0% capital gains rate threshold (MFJ)', 'federal'),
  (2024, 'CAPITAL_GAINS_15PCT_THRESHOLD_MFJ', 583750.0000, '15% capital gains rate threshold (MFJ)', 'federal');

-- ============================================================================
-- SEED DATA: 2024 WISCONSIN TAX CONSTANTS
-- ============================================================================

-- Wisconsin standard deduction phase-out parameters
INSERT INTO tax_constants (year, constant_name, constant_value, description, jurisdiction)
VALUES
  (2024, 'STD_DED_PHASEOUT_START_SINGLE', 16990.0000, 'Standard deduction phase-out start (Single)', 'wisconsin'),
  (2024, 'STD_DED_PHASEOUT_RATE_SINGLE', 0.1200, 'Standard deduction phase-out rate (Single) - 12%', 'wisconsin'),
  (2024, 'STD_DED_PHASEOUT_START_MFJ', 25250.0000, 'Standard deduction phase-out start (MFJ)', 'wisconsin'),
  (2024, 'STD_DED_PHASEOUT_RATE_MFJ', 0.1978, 'Standard deduction phase-out rate (MFJ) - 19.778%', 'wisconsin'),
  (2024, 'STD_DED_PHASEOUT_START_MFS', 12000.0000, 'Standard deduction phase-out start (MFS)', 'wisconsin'),
  (2024, 'STD_DED_PHASEOUT_RATE_MFS', 0.1978, 'Standard deduction phase-out rate (MFS) - 19.778%', 'wisconsin'),
  (2024, 'STD_DED_PHASEOUT_START_HOH', 16990.0000, 'Standard deduction phase-out start (HOH)', 'wisconsin'),
  (2024, 'STD_DED_PHASEOUT_RATE_HOH', 0.2252, 'Standard deduction phase-out rate (HOH) - 22.515%', 'wisconsin');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE standard_deductions IS 'Standard deduction amounts by year, filing status, and jurisdiction';
COMMENT ON TABLE tax_constants IS 'Tax-related constants and limits by year and jurisdiction';

COMMENT ON COLUMN standard_deductions.additional_65_or_blind IS 'Additional deduction per person aged 65+ or blind';
COMMENT ON COLUMN standard_deductions.jurisdiction IS 'Tax jurisdiction (federal, wisconsin, etc.)';
COMMENT ON COLUMN tax_constants.constant_value IS 'Numeric value of the tax constant (rates stored as decimals, e.g., 0.062 for 6.2%)';
