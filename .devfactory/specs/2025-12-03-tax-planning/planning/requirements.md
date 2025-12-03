# Requirements: Tax Planning

## Initial Request

Build year-round tax planning tools including federal and Wisconsin state tax calculation engines, real-time tax liability projections, deduction tracking with threshold alerts, and estimated tax calculator for 1099/self-employment income.

## Product Context

### Mission Alignment
Enables proactive tax planning throughout the year, preventing surprises at tax time and optimizing tax liability through year-round awareness.

### Roadmap Context
- Current Phase: Phase 4 - Tax Planning & Projections
- Feature Priority: High - core value proposition
- Related Features: Uses Bank Integration transactions; uses Tax Debt for context

### Technical Context
- Stack: Next.js 14, Supabase, TypeScript
- Data Sources: Tax-deductible transactions, user-entered income (W2, 1099)
- Reference Data: Tax brackets, standard deductions (updated annually)

## Clarification Q&A

No additional clarification needed - original product spec comprehensive.

## Visual Assets

No visual assets provided. Standard dashboard with gauges, charts, and projections.

## Functional Requirements

### 23. Federal Tax Calculation Engine

1. **Tax Year Support**:
   - Current year (2024) and next year (2025)
   - Store brackets in database for easy updates
2. **Filing Status Handling**:
   - Single
   - Married Filing Jointly
   - Married Filing Separately
   - Head of Household
   - Qualifying Widow(er)
3. **Tax Bracket Calculation**:
   - Progressive tax calculation
   - Apply correct bracket rates
   - Calculate marginal vs effective rate
4. **Standard Deduction**:
   - 2024: $14,600 (single), $29,200 (MFJ), etc.
   - Additional deduction for 65+ and blind
5. **Income Types**:
   - W2 wages (with withholding)
   - 1099 income (self-employment)
   - Interest income
   - Dividend income (qualified vs ordinary)
   - Capital gains (short-term vs long-term)
   - Other income
6. **Self-Employment Tax**:
   - Calculate SE tax on 1099 income
   - Social Security (6.2%) + Medicare (1.45%) × 2
   - Deduction for 1/2 SE tax
7. **Tax Credits** (basic support):
   - Child Tax Credit
   - Earned Income Credit (if applicable)
   - Other credits (manual entry)
8. **AMT Check**: Flag if AMT might apply (simplified check)

### 24. Wisconsin State Tax Engine

1. **Wisconsin Tax Brackets**:
   - Store current year brackets in database
   - 4 brackets: 3.5%, 4.4%, 5.3%, 7.65% (2024)
2. **Wisconsin Standard Deduction**:
   - Phase-out based on income
   - Different for single vs married
3. **Wisconsin Itemized Deductions**:
   - Different rules than federal
   - Medical expenses (7.5% floor)
   - State income tax not deductible (already state)
4. **Wisconsin Credits**:
   - School property tax credit
   - Married couple credit
   - Working families credit
5. **Withholding Comparison**:
   - Compare WI withholding to projected liability
   - Flag under/over withholding
6. **Combined Federal + State View**:
   - Total tax liability (federal + state)
   - Total effective rate

### 25. Tax Projection Dashboard

1. **Income Summary**:
   - YTD income by type (W2, 1099, interest, etc.)
   - Projected full-year (annualized or user-adjusted)
   - Month-by-month visualization
2. **Tax Liability Gauges**:
   - Federal tax: projected liability
   - State tax: projected liability
   - Visual gauge showing % of income
3. **Withholding Status**:
   - YTD withholding (from W2 entries)
   - Projected full-year withholding
   - Over/under payment indicator
   - "You'll owe approximately $X" or "You'll get refund of $X"
4. **Standard vs Itemized Comparison**:
   - Side-by-side comparison
   - Recommendation (which is better)
   - Difference in dollars
5. **Marginal Rate Display**:
   - Current marginal bracket
   - "Your next dollar is taxed at X%"
   - Bracket threshold proximity
6. **Year-over-Year Comparison**:
   - Compare to last year (if data available)
   - Variance explanation

### 26. Deduction Tracker

1. **Standard Deduction Baseline**:
   - Show standard deduction amount for filing status
   - This is the "hurdle" for itemizing
2. **Itemized Deduction Categories**:
   - **Charitable Donations**:
     - Cash donations (track by organization)
     - Non-cash donations (with FMV)
     - YTD total
   - **Medical Expenses**:
     - Track medical expenses
     - Show 7.5% AGI threshold
     - Amount over threshold
   - **State & Local Taxes (SALT)**:
     - Property taxes
     - State income tax (capped at $10,000)
     - Total SALT with cap warning
   - **Mortgage Interest**:
     - Primary residence
     - Acquisition debt limit ($750k)
   - **Home Office** (if 1099 work):
     - Square footage method
     - Actual expense method
     - Track qualifying expenses
   - **Business Mileage** (if 1099 work):
     - Standard rate (67¢/mile 2024)
     - Track business miles
3. **Deduction Progress Visualization**:
   - Progress bar toward standard deduction
   - "You need $X more to benefit from itemizing"
4. **Auto-Categorization Integration**:
   - Pull from tax-deductible transactions
   - Sum by deduction category
5. **Deduction Alerts**:
   - Approaching SALT cap
   - Close to itemizing threshold
   - Bunching opportunity suggestion

### 27. Estimated Tax Calculator

1. **Quarterly Estimates**:
   - Calculate required estimated payments
   - Due dates: Apr 15, Jun 15, Sep 15, Jan 15
   - Amount per quarter
2. **Safe Harbor Rules**:
   - 100% of prior year tax (110% if AGI > $150k)
   - 90% of current year tax
   - Show which is lower
3. **1099 Income Tracking**:
   - Enter 1099 income as received
   - Project full-year 1099 income
   - Calculate SE tax impact
4. **Underpayment Penalty Estimator**:
   - Calculate potential penalty for underpayment
   - Show breakeven payment amount
5. **Payment Schedule**:
   - What to pay each quarter
   - Adjusted recommendations based on income timing
6. **W4 Adjustment Recommendations**:
   - If W2 income, suggest W4 adjustments
   - "Increase withholding by $X/paycheck"
7. **Estimated Payment Tracker**:
   - Track payments made
   - Remaining quarters
   - Running compliance status

## Non-Functional Requirements

### Performance
- Tax calculation < 500ms
- Dashboard loads < 1s

### Accuracy
- Tax calculations match IRS tax tables exactly
- Wisconsin calculations match DOR tables
- Within $100 of actual liability (for standard cases)

### Maintainability
- Tax brackets in database (not code)
- Easy annual updates
- Clear update procedure documented

## Integration Points

1. **Bank Integration**: Tax-deductible transaction totals
2. **Tax Debt Core**: User profile (filing status, dependents)
3. **Documents**: W2/1099 document extraction
4. **AI Insights**: Tax optimization recommendations

## Out of Scope

1. Actual tax filing (form generation)
2. E-file integration
3. AMT detailed calculation
4. Rental property (Schedule E)
5. Business income (Schedule C full)
6. Cryptocurrency tax tracking
7. Stock option handling (ISO, NSO)

## Dependencies

1. Bank Integration complete (for deduction tracking)
2. Tax bracket reference data loaded
3. User profile with filing status

## Success Criteria

- [ ] Federal tax calculation matches IRS tax tables
- [ ] Wisconsin tax calculation matches DOR tables
- [ ] Dashboard shows projected refund/owe amount
- [ ] Standard vs itemized comparison works correctly
- [ ] Deduction tracker sums tax-deductible transactions
- [ ] Estimated tax calculator shows quarterly payments
- [ ] SALT cap warning triggers at $10,000
- [ ] SE tax calculates correctly on 1099 income
- [ ] W4 adjustment recommendations are sensible

## Open Questions

None. Requirements complete and ready for specification.

## Next Steps

Ready to proceed to formal specification via `/create-spec`.

---

*This requirements document was created through lite shape-spec process, leveraging comprehensive product planning already completed.*
