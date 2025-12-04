-- Migration: Seed IRS National Standards (2024)
-- Description: Seeds reference data for IRS expense allowances used in tax debt calculations
-- Created: 2025-12-04

-- Food, Clothing, Personal Care, and Miscellaneous expenses by household size
-- Source: IRS Collection Financial Standards
INSERT INTO irs_national_standards (year, category, household_size, state, county, amount) VALUES
(2024, 'food_clothing_misc', 1, NULL, NULL, 785.00),
(2024, 'food_clothing_misc', 2, NULL, NULL, 1410.00),
(2024, 'food_clothing_misc', 3, NULL, NULL, 1658.00),
(2024, 'food_clothing_misc', 4, NULL, NULL, 1967.00),
(2024, 'food_clothing_misc', 5, NULL, NULL, 2360.00),
(2024, 'food_clothing_misc', 6, NULL, NULL, 2753.00),
(2024, 'food_clothing_misc', 7, NULL, NULL, 3146.00),
(2024, 'food_clothing_misc', 8, NULL, NULL, 3539.00);

-- Housing and Utilities by State/County (Wisconsin counties)
-- Source: IRS Local Standards - Housing and Utilities
INSERT INTO irs_national_standards (year, category, household_size, state, county, amount) VALUES
(2024, 'housing_utilities', NULL, 'WI', 'Dane', 2156.00),
(2024, 'housing_utilities', NULL, 'WI', 'Milwaukee', 1876.00),
(2024, 'housing_utilities', NULL, 'WI', 'Waukesha', 2089.00),
(2024, 'housing_utilities', NULL, 'WI', 'Brown', 1654.00),
(2024, 'housing_utilities', NULL, 'WI', 'Racine', 1723.00),
(2024, 'housing_utilities', NULL, 'WI', 'Kenosha', 1789.00),
(2024, 'housing_utilities', NULL, 'WI', 'Outagamie', 1612.00),
(2024, 'housing_utilities', NULL, 'WI', 'Winnebago', 1567.00),
(2024, 'housing_utilities', NULL, 'WI', 'Washington', 1834.00),
(2024, 'housing_utilities', NULL, 'WI', 'Ozaukee', 2134.00);

-- Transportation ownership costs
-- Source: IRS National Standards - Transportation
INSERT INTO irs_national_standards (year, category, household_size, state, county, amount) VALUES
(2024, 'transportation_ownership', 1, NULL, NULL, 588.00),
(2024, 'transportation_ownership', 2, NULL, NULL, 1176.00);

-- Transportation operating costs (per vehicle)
-- Source: IRS National Standards - Transportation Operating Costs
INSERT INTO irs_national_standards (year, category, household_size, state, county, amount) VALUES
(2024, 'transportation_operating', NULL, 'Midwest', NULL, 289.00),
(2024, 'transportation_operating', NULL, 'National', NULL, 296.00);

-- Public transportation costs
-- Source: IRS National Standards - Public Transportation
INSERT INTO irs_national_standards (year, category, household_size, state, county, amount) VALUES
(2024, 'transportation_public', NULL, 'National', NULL, 242.00);

-- Healthcare costs by age bracket
-- Source: IRS National Standards - Out-of-Pocket Health Care
INSERT INTO irs_national_standards (year, category, household_size, state, county, amount) VALUES
(2024, 'healthcare', NULL, 'under_65', NULL, 75.00),
(2024, 'healthcare', NULL, '65_and_over', NULL, 153.00);

-- Out-of-pocket healthcare costs by age bracket
-- Source: IRS National Standards - Out-of-Pocket Health Care
INSERT INTO irs_national_standards (year, category, household_size, state, county, amount) VALUES
(2024, 'out_of_pocket_healthcare', NULL, 'under_65', NULL, 75.00),
(2024, 'out_of_pocket_healthcare', NULL, '65_and_over', NULL, 153.00);

-- Add comment for verification
COMMENT ON TABLE irs_national_standards IS 'IRS National and Local Standards for allowable expenses in tax debt calculations. Updated annually by the IRS.';
