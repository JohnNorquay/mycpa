# Implementation Tasks: Tax Planning

## Task Groups Overview

| Group | Name | Tasks | Dependencies |
|-------|------|-------|--------------|
| 1 | Tax Reference Data | 3 | Foundation |
| 2 | Federal Tax Calculator | 5 | Group 1 |
| 3 | Wisconsin Tax Calculator | 4 | Group 1 |
| 4 | Deduction Tracker | 5 | Group 2, Bank Integration |
| 5 | Tax Projection Dashboard | 5 | Group 2, 3, 4 |
| 6 | Estimated Tax Calculator | 5 | Group 2 |
| 7 | Testing | 3 | All |

---

## Task Group 1: Tax Reference Data

**Assigned Agent:** `database-engineer`

- [ ] **1.1** Seed federal tax brackets
  - 2024 brackets for all filing statuses
  - Single, MFJ, MFS, HoH, QW
  - Store in `tax_brackets` table

- [ ] **1.2** Seed Wisconsin tax brackets
  - 2024 Wisconsin 4-bracket system
  - Standard deduction with phase-out parameters
  - Wisconsin credit amounts

- [ ] **1.3** Seed standard deduction amounts
  - Federal standard deductions by filing status
  - Additional amounts for 65+ and blind
  - SALT cap ($10,000)

---

## Task Group 2: Federal Tax Calculator

**Assigned Agent:** `integration-engineer`

- [ ] **2.1** Create federal tax calculator utility
  - `lib/tax/federal-calculator.ts`
  - Progressive bracket calculation
  - All filing status support

- [ ] **2.2** Create self-employment tax calculator
  - `lib/tax/self-employment-tax.ts`
  - Social Security portion (up to wage base)
  - Medicare portion (including additional 0.9%)

- [ ] **2.3** Create capital gains tax calculator
  - 0%, 15%, 20% brackets
  - Qualified dividends treatment
  - Integration with ordinary income

- [ ] **2.4** Create tax credit calculations
  - Child Tax Credit ($2,000 per child)
  - Earned Income Credit (simplified)
  - Credit phase-outs

- [ ] **2.5** Create federal tax server actions
  - `actions/tax-projections.ts`
  - `calculateFederalTax()` - full calculation
  - `getMarginalRate()` - current bracket

---

## Task Group 3: Wisconsin Tax Calculator

**Assigned Agent:** `integration-engineer`

- [ ] **3.1** Create Wisconsin tax calculator utility
  - `lib/tax/wisconsin-calculator.ts`
  - 4-bracket progressive calculation
  - Standard deduction with income phase-out

- [ ] **3.2** Create Wisconsin adjustments handler
  - Wisconsin additions (income WI adds back)
  - Wisconsin subtractions (income WI excludes)
  - Different itemized deduction rules

- [ ] **3.3** Create Wisconsin credits calculator
  - School property tax credit
  - Married couple credit
  - Working families credit

- [ ] **3.4** Create combined federal + state view
  - Total tax liability
  - Combined effective rate
  - Total withholding comparison

---

## Task Group 4: Deduction Tracker

**Assigned Agent:** `frontend-engineer`

- [ ] **4.1** Create deduction calculator utility
  - `lib/tax/deduction-calculator.ts`
  - Pull from tax-deductible transactions
  - Manual entry support
  - Category totals

- [ ] **4.2** Create deduction category components
  - `components/features/tax-planning/deduction-category.tsx`
  - Charitable donations tracking
  - Medical expenses (7.5% AGI threshold)
  - SALT (with $10,000 cap warning)
  - Mortgage interest

- [ ] **4.3** Create itemize comparison component
  - `components/features/tax-planning/itemize-comparison.tsx`
  - Side-by-side standard vs itemized
  - Recommendation with savings amount
  - Progress bar toward itemizing threshold

- [ ] **4.4** Create deduction tracker page
  - `app/(dashboard)/tax-center/deductions/page.tsx`
  - All deduction categories
  - Manual entry forms
  - Transaction integration display

- [ ] **4.5** Create deduction server actions
  - `actions/tax-deductions.ts`
  - `getDeductionSummary()`
  - `addManualDeduction()`
  - `updateDeductionEntry()`

---

## Task Group 5: Tax Projection Dashboard

**Assigned Agent:** `ui-designer`

- [ ] **5.1** Create tax projection dashboard component
  - `components/features/tax-planning/tax-projection-dashboard.tsx`
  - Federal tax summary card
  - Wisconsin tax summary card
  - Owe/refund indicator

- [ ] **5.2** Create income summary component
  - `components/features/tax-planning/income-summary.tsx`
  - YTD income by type
  - Projected full-year
  - Month-by-month chart

- [ ] **5.3** Create marginal rate display
  - `components/features/tax-planning/marginal-rate-display.tsx`
  - Current bracket visualization
  - "Your next dollar taxed at X%"
  - Distance to next bracket

- [ ] **5.4** Create tax center page
  - `app/(dashboard)/tax-center/page.tsx`
  - Tax projection dashboard
  - Quick links to income, deductions
  - Year selector

- [ ] **5.5** Create income entry page
  - `app/(dashboard)/tax-center/income/page.tsx`
  - Add W2, 1099, other income
  - Link to uploaded documents
  - Withholding entry

---

## Task Group 6: Estimated Tax Calculator

**Assigned Agent:** `frontend-engineer`

- [ ] **6.1** Create estimated tax calculator utility
  - `lib/tax/estimated-tax.ts`
  - Quarterly payment calculation
  - Safe harbor determination
  - Penalty estimation

- [ ] **6.2** Create quarterly schedule component
  - `components/features/tax-planning/quarterly-schedule.tsx`
  - Due dates (Apr 15, Jun 15, Sep 15, Jan 15)
  - Payment status per quarter
  - Remaining amount due

- [ ] **6.3** Create withholding analyzer component
  - `components/features/tax-planning/withholding-analyzer.tsx`
  - Current withholding vs projected tax
  - Over/under indicator
  - W4 adjustment recommendation

- [ ] **6.4** Create estimated tax page
  - `app/(dashboard)/tax-center/estimated-tax/page.tsx`
  - Calculator interface
  - Quarterly schedule display
  - Payment tracking

- [ ] **6.5** Create estimated payment server actions
  - `actions/estimated-payments.ts`
  - `getEstimatedTaxCalculation()`
  - `recordEstimatedPayment()`
  - `updatePriorYearTax()`

---

## Task Group 7: Testing

**Assigned Agent:** `testing-engineer`

- [ ] **7.1** Test federal tax calculations
  - Compare to IRS tax tables
  - Test all filing statuses
  - Test self-employment tax accuracy
  - Test capital gains rates

- [ ] **7.2** Test Wisconsin tax calculations
  - Compare to DOR tables
  - Test standard deduction phase-out
  - Test credit calculations

- [ ] **7.3** Manual verification
  - [ ] Can enter W2 income with withholding
  - [ ] Can enter 1099 income
  - [ ] Tax projection calculates correctly
  - [ ] Standard vs itemized comparison works
  - [ ] SALT cap warning triggers at $10,000
  - [ ] SE tax calculates on 1099 income
  - [ ] Estimated tax shows quarterly schedule
  - [ ] W4 adjustment recommendation reasonable
  - [ ] Deductions pull from tax-deductible transactions
  - [ ] Marginal rate display accurate

---

## Completion Checklist

- [ ] Federal tax calculator matches IRS tables
- [ ] Wisconsin tax calculator matches DOR tables
- [ ] Deduction tracker working
- [ ] Standard vs itemized comparison accurate
- [ ] Estimated tax calculator functional
- [ ] Tax projection dashboard complete
- [ ] All tests passing
