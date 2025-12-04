-- Seed tax bracket data for 2024
-- This migration populates the tax_brackets table with Federal and Wisconsin state tax brackets

-- Federal Tax Brackets for 2024

-- Single filing status
INSERT INTO tax_brackets (year, filing_status, min_income, max_income, rate, base_tax) VALUES
(2024, 'single', 0.00, 11600.00, 0.1000, 0.00),
(2024, 'single', 11600.00, 47150.00, 0.1200, 1160.00),
(2024, 'single', 47150.00, 100525.00, 0.2200, 5426.00),
(2024, 'single', 100525.00, 191950.00, 0.2400, 17168.50),
(2024, 'single', 191950.00, 243725.00, 0.3200, 39110.50),
(2024, 'single', 243725.00, 609350.00, 0.3500, 55678.50),
(2024, 'single', 609350.00, NULL, 0.3700, 183647.25);

-- Married Filing Jointly (MFJ)
INSERT INTO tax_brackets (year, filing_status, min_income, max_income, rate, base_tax) VALUES
(2024, 'mfj', 0.00, 23200.00, 0.1000, 0.00),
(2024, 'mfj', 23200.00, 94300.00, 0.1200, 2320.00),
(2024, 'mfj', 94300.00, 201050.00, 0.2200, 10852.00),
(2024, 'mfj', 201050.00, 383900.00, 0.2400, 34337.00),
(2024, 'mfj', 383900.00, 487450.00, 0.3200, 78221.00),
(2024, 'mfj', 487450.00, 731200.00, 0.3500, 111357.00),
(2024, 'mfj', 731200.00, NULL, 0.3700, 196669.50);

-- Married Filing Separately (MFS)
INSERT INTO tax_brackets (year, filing_status, min_income, max_income, rate, base_tax) VALUES
(2024, 'mfs', 0.00, 11600.00, 0.1000, 0.00),
(2024, 'mfs', 11600.00, 47150.00, 0.1200, 1160.00),
(2024, 'mfs', 47150.00, 100525.00, 0.2200, 5426.00),
(2024, 'mfs', 100525.00, 191950.00, 0.2400, 17168.50),
(2024, 'mfs', 191950.00, 243725.00, 0.3200, 39110.50),
(2024, 'mfs', 243725.00, 365600.00, 0.3500, 55678.50),
(2024, 'mfs', 365600.00, NULL, 0.3700, 98334.75);

-- Head of Household (HOH)
INSERT INTO tax_brackets (year, filing_status, min_income, max_income, rate, base_tax) VALUES
(2024, 'hoh', 0.00, 16550.00, 0.1000, 0.00),
(2024, 'hoh', 16550.00, 63100.00, 0.1200, 1655.00),
(2024, 'hoh', 63100.00, 100500.00, 0.2200, 7241.00),
(2024, 'hoh', 100500.00, 191950.00, 0.2400, 15469.00),
(2024, 'hoh', 191950.00, 243700.00, 0.3200, 37417.00),
(2024, 'hoh', 243700.00, 609350.00, 0.3500, 53977.00),
(2024, 'hoh', 609350.00, NULL, 0.3700, 181954.50);

-- Wisconsin State Tax Brackets for 2024

-- Wisconsin Single and MFS (same brackets)
INSERT INTO tax_brackets (year, filing_status, min_income, max_income, rate, base_tax) VALUES
(2024, 'wi_single', 0.00, 14320.00, 0.0350, 0.00),
(2024, 'wi_single', 14320.00, 28640.00, 0.0440, 501.20),
(2024, 'wi_single', 28640.00, 315310.00, 0.0530, 1131.28),
(2024, 'wi_single', 315310.00, NULL, 0.0765, 16324.79);

INSERT INTO tax_brackets (year, filing_status, min_income, max_income, rate, base_tax) VALUES
(2024, 'wi_mfs', 0.00, 14320.00, 0.0350, 0.00),
(2024, 'wi_mfs', 14320.00, 28640.00, 0.0440, 501.20),
(2024, 'wi_mfs', 28640.00, 315310.00, 0.0530, 1131.28),
(2024, 'wi_mfs', 315310.00, NULL, 0.0765, 16324.79);

-- Wisconsin Married Filing Jointly
INSERT INTO tax_brackets (year, filing_status, min_income, max_income, rate, base_tax) VALUES
(2024, 'wi_mfj', 0.00, 19090.00, 0.0350, 0.00),
(2024, 'wi_mfj', 19090.00, 38190.00, 0.0440, 668.15),
(2024, 'wi_mfj', 38190.00, 420420.00, 0.0530, 1508.55),
(2024, 'wi_mfj', 420420.00, NULL, 0.0765, 21766.74);

-- Wisconsin Head of Household
INSERT INTO tax_brackets (year, filing_status, min_income, max_income, rate, base_tax) VALUES
(2024, 'wi_hoh', 0.00, 14320.00, 0.0350, 0.00),
(2024, 'wi_hoh', 14320.00, 28640.00, 0.0440, 501.20),
(2024, 'wi_hoh', 28640.00, 315310.00, 0.0530, 1131.28),
(2024, 'wi_hoh', 315310.00, NULL, 0.0765, 16324.79);
