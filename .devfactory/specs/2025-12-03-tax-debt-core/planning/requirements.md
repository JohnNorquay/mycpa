# Requirements: Tax Debt Core

## Initial Request

Build the complete IRS tax debt resolution toolkit including profile demographics, debt tracking, OIC calculator with IRS form alignment, installment agreement calculator, relief program comparison, and correspondence management.

## Product Context

### Mission Alignment
This is the core value proposition of CPA Bot - democratizing access to IRS debt resolution analysis that normally costs $5,000+ from tax resolution firms.

### Roadmap Context
- Current Phase: Phase 2 - Tax Debt Resolution Core (MVP priority)
- Feature Priority: Critical - addresses user's immediate tax debt situation
- Related Features: Depends on Foundation; feeds into AI Insights

### Technical Context
- Stack: Next.js 14, Supabase, TypeScript
- Key Integration: IRS National Standards data, age-based calculations
- Forms: Align data entry with IRS Form 656 and Form 433-A structure

## Clarification Q&A

### OIC Form Structure
**Q: Should we mirror IRS form fields exactly or use simplified entry?**
**A:** IRS-aligned - mirror IRS form fields exactly to help if user wants to fill actual forms later.

## Visual Assets

No visual assets provided. Reference IRS forms 656, 433-A, 9465, 843 for field structure.

## Functional Requirements

### 5. User Profile & Demographics

1. **Profile Form**: Capture all IRS-relevant demographic data
   - First name, last name, date of birth (calculates age)
   - Filing status (single, married_filing_jointly, married_filing_separately, head_of_household, qualifying_widow)
   - Number of dependents
   - State and county (for National Standards lookup)
   - Employment status (employed, self_employed, unemployed, retired, disabled)
   - Has health conditions (boolean)
   - Health conditions notes (encrypted, affects RCP hardship consideration)
2. **Age Calculation**: Auto-calculate age and display OIC future income multiplier
   - Under 65: 12 months × monthly disposable income
   - 65 and over: 0 months (collection period ends)
3. **Profile Validation**: Ensure required fields for IRS calculations
4. **Profile Dashboard Widget**: Show key demographics on main dashboard

### 6. Tax Debt Tracking

1. **Debt Entry Form**: Add tax debt records aligned with IRS notice data
   - Tax year (dropdown, last 10 years)
   - Debt type (income_tax, penalty_failure_to_file, penalty_failure_to_pay, interest, other)
   - Original amount owed
   - Current balance
   - Interest rate (default 8% annually, adjustable)
   - Penalty rate
   - Source (w2_shortage, 1099_unreported, business, estimated_tax, other)
   - Collection status (normal, notice_sent, lien_filed, levy_pending, levy_active, garnishment, currently_not_collectible)
   - Statute of limitations expiration date (typically 10 years from assessment)
2. **Debt List View**: Display all debts with totals
   - Sort by year, amount, status
   - Filter by collection status
   - Running total of all debt
3. **Daily Interest Calculation**: Calculate current balance with accrued interest
4. **Debt Timeline**: Visual representation of statute expiration dates
5. **Debt Summary Widget**: Dashboard widget with total owed, daily interest accrual

### 7. IRS National Standards Integration

1. **National Standards Database**: Seed data for allowable living expenses
   - Food, clothing, personal care (by household size: 1-4+)
   - Housing and utilities (by state and county)
   - Transportation ownership costs (by region)
   - Transportation operating costs (by region)
   - Out-of-pocket healthcare (by age bracket)
2. **Standards Lookup API**: Query standards by location and household size
3. **Annual Update Mechanism**: Admin function to update standards yearly
4. **Standards Comparison View**: Show user's expenses vs IRS allowable amounts
5. **Over-Allowance Justification**: Field to document reasons for exceeding standards

### 8. Financial Snapshot System

1. **Income Entry** (aligned with Form 433-A Section 5):
   - Wages/salaries (gross monthly)
   - Self-employment income (net monthly)
   - Social Security
   - Pension/retirement
   - Rental income
   - Interest/dividends
   - Alimony received
   - Child support received
   - Other income
   - Total gross monthly income (calculated)
   - Net monthly income (after taxes)
2. **Expense Entry** (aligned with Form 433-A Section 6):
   - Food, clothing, misc (compare to National Standards)
   - Housing (rent/mortgage, property tax, insurance, utilities)
   - Transportation (ownership: loan/lease; operating: gas, insurance, maintenance)
   - Healthcare (insurance, out-of-pocket)
   - Court-ordered payments (child support, alimony)
   - Child/dependent care
   - Life insurance
   - Taxes (current tax payments)
   - Secured debts (other than housing/vehicles)
   - Other expenses (with justification)
   - Total monthly expenses (calculated)
3. **Asset Entry** (aligned with Form 433-A Section 4):
   - Bank accounts (checking, savings - list each)
   - Investments (stocks, bonds, mutual funds, retirement accessible)
   - Real property (market value, loan balance, equity)
   - Vehicles (year, make, model, market value, loan balance, equity)
   - Life insurance (cash value)
   - Other assets
   - Quick Sale Value calculation (80% of FMV for assets)
4. **Disposable Income Calculation**: Net income - allowable expenses
5. **Snapshot History**: Save multiple snapshots over time to track changes
6. **Snapshot Comparison**: Compare current to previous snapshots

### 9. OIC Calculator Engine

1. **Reasonable Collection Potential (RCP) Calculation**:
   - Asset equity (sum of quick sale values)
   - Future income = Disposable income × months remaining
     - Under 65: 12 months (lump sum) or 24 months (periodic)
     - 65+: 0 months
   - RCP = Asset equity + Future income
2. **Minimum Offer Calculation**:
   - Lump sum offer: RCP (pay within 5 months of acceptance)
   - Periodic payment offer: RCP (pay within 24 months)
3. **Doubt as to Collectability Analysis**:
   - Compare RCP to total tax debt
   - If RCP < debt, OIC may be viable
4. **Application Fee Calculator**:
   - Standard fee: $205 (2024)
   - Low-income waiver: $0 if income ≤ 250% of poverty level
5. **Payment Options**:
   - Lump sum: 20% with application, remainder within 5 months
   - Periodic: First payment with application, remainder over 24 months
6. **Form 656 Data Mapping**: Map entered data to Form 656 fields
7. **Form 433-A (OIC) Data Mapping**: Map financial data to 433-A fields
8. **OIC Summary View**:
   - Show calculated offer amount
   - Comparison to total debt (savings)
   - Success probability estimate (based on RCP vs debt ratio)
   - Required application documents checklist

### 10. Installment Agreement Calculator

1. **Agreement Type Determination**:
   - Guaranteed IA: Debt ≤ $10,000, can pay within 3 years
   - Streamlined IA: Debt ≤ $50,000, can pay within 72 months
   - Non-streamlined IA: Debt > $50,000, requires full financial disclosure
2. **Monthly Payment Calculator**:
   - Minimum payment = Total debt / max months allowed
   - User-adjustable payment amount
3. **Payoff Timeline Projection**:
   - Months to payoff at given payment
   - Total interest over life of plan
   - Total penalties over life of plan
   - Total cost comparison (principal + interest + penalties)
4. **Payment Schedule Generator**: Month-by-month projection
5. **Form 9465 Data Mapping**: Map to installment agreement request form
6. **Comparison Tool**: Side-by-side IA vs OIC total cost analysis

### 11. Relief Program Comparison Dashboard

1. **Program Eligibility Matrix**:
   - OIC: Show eligibility based on RCP calculation
   - Installment Agreement: Show available types
   - Currently Not Collectible: Eligibility based on disposable income ≤ $0
   - Penalty Abatement: First-time abatement eligibility
2. **Side-by-Side Comparison**:
   - Total cost of each option
   - Time to resolution
   - Monthly payment (if applicable)
   - Pros and cons
   - Impact on credit/liens
3. **Recommendation Engine**:
   - Analyze financial situation
   - Recommend best option with reasoning
   - Flag when professional help is advised
4. **Program Details**: Expandable info for each program
5. **Decision Support**: "What if" scenarios (e.g., "What if my income increases?")

### 12. IRS Correspondence Tracker

1. **Notice Entry**:
   - Notice date received
   - Notice type (CP2000, CP14, CP501, CP503, CP504, LT11, etc.)
   - Notice number
   - Related tax year
   - Amount referenced (if applicable)
   - Response deadline
   - Status (received, in_review, response_sent, resolved, escalated)
2. **Document Attachment**: Link uploaded documents to correspondence
3. **Response Tracking**:
   - Response date
   - Response method (mail, fax, phone, online)
   - Response summary
4. **Deadline Alerts**:
   - Upcoming deadlines (within 7 days)
   - Overdue items
   - Calendar integration potential
5. **Correspondence Timeline**: Chronological view of all IRS communication
6. **Notes**: Free-form notes for phone calls, conversations

## Non-Functional Requirements

### Performance
- OIC calculation < 500ms
- Financial snapshot save < 1s
- Standards lookup < 200ms

### Security
- Health conditions notes encrypted at rest
- All financial data protected by RLS
- Audit trail for financial snapshot changes

### Accuracy
- OIC calculation matches IRS pre-qualifier within 5%
- Interest calculations use correct IRS rates
- National Standards current within 1 year

### Usability
- Form sections collapsible for long forms
- Save progress on multi-step forms
- Clear labels explaining IRS terminology
- Help tooltips for complex fields

## Integration Points

1. **Foundation spec**: Auth, database, UI shell
2. **Documents spec**: Attach documents to correspondence
3. **AI Insights spec**: Feed data for strategy recommendations

## Out of Scope

1. Actual IRS form PDF generation (future enhancement)
2. E-filing or submission to IRS
3. State tax debt (federal only)
4. Business tax debt
5. Tax debt from audit (separate workflow)
6. Payment processing

## Dependencies

1. Foundation spec complete (auth, database, UI)
2. IRS National Standards data sourced and loaded
3. Tax bracket data loaded

## Success Criteria

- [ ] User can create and update their profile with all demographics
- [ ] User can add, edit, delete tax debt records
- [ ] System calculates daily interest on debt correctly
- [ ] IRS National Standards are queryable by location
- [ ] User can create complete financial snapshot
- [ ] OIC calculator produces accurate RCP
- [ ] Installment agreement calculator shows payment options
- [ ] Relief program comparison shows all options with recommendation
- [ ] User can track IRS correspondence with deadlines
- [ ] Deadline alerts appear for upcoming response dates

## Open Questions

None. Requirements complete and ready for specification.

## Next Steps

Ready to proceed to formal specification via `/create-spec`.

---

*This requirements document was created through lite shape-spec process, leveraging comprehensive product planning already completed.*
