# Implementation Tasks: Tax Debt Core

## Task Groups Overview

| Group | Name | Tasks | Dependencies |
|-------|------|-------|--------------|
| 1 | IRS Reference Data | 4 | Foundation |
| 2 | User Profile | 5 | Foundation |
| 3 | Tax Debt Tracking | 6 | Foundation |
| 4 | Financial Snapshot | 7 | Group 1, 2 |
| 5 | OIC Calculator | 6 | Group 4 |
| 6 | Installment Agreement | 5 | Group 4 |
| 7 | Relief Comparison | 5 | Group 5, 6 |
| 8 | Correspondence Tracker | 5 | Group 3 |
| 9 | Testing & Verification | 4 | All |

---

## Task Group 1: IRS Reference Data

**Assigned Agent:** `database-engineer`
**Dependencies:** Foundation

### Tasks

- [ ] **1.1** Seed IRS National Standards data
  - Food, clothing, misc by household size
  - Housing by state/county (at least Wisconsin)
  - Transportation by region
  - Healthcare by age bracket

- [ ] **1.2** Seed tax bracket data
  - 2024 federal brackets for all filing statuses
  - 2024 Wisconsin brackets

- [ ] **1.3** Create National Standards lookup API
  - `app/api/irs/national-standards/route.ts`
  - Query by year, category, location, household size

- [ ] **1.4** Create National Standards lookup utility
  - `lib/irs/national-standards.ts`
  - Type-safe lookup functions
  - Caching for performance

---

## Task Group 2: User Profile

**Assigned Agent:** `frontend-engineer`
**Dependencies:** Foundation

### Tasks

- [ ] **2.1** Create profile form component
  - `components/features/tax-debt/profile-form.tsx`
  - All demographic fields
  - Filing status select
  - State/county selects

- [ ] **2.2** Create profile server actions
  - `actions/profile.ts`
  - `getProfile()`, `updateProfile()`
  - Validation with Zod

- [ ] **2.3** Create profile settings page
  - `app/(dashboard)/settings/profile/page.tsx`
  - Form with save functionality
  - Success/error feedback

- [ ] **2.4** Add age calculation display
  - Calculate age from DOB
  - Show OIC future income multiplier
  - "Based on your age, IRS uses X months..."

- [ ] **2.5** Create profile summary widget
  - For dashboard display
  - Key demographics at a glance
  - Link to edit profile

---

## Task Group 3: Tax Debt Tracking

**Assigned Agent:** `frontend-engineer`
**Dependencies:** Foundation

### Tasks

- [ ] **3.1** Create tax debt form component
  - `components/features/tax-debt/debt-form.tsx`
  - All debt fields from schema
  - Tax year dropdown (last 10 years)

- [ ] **3.2** Create tax debt server actions
  - `actions/tax-debt.ts`
  - CRUD operations
  - Payment recording

- [ ] **3.3** Create debt list page
  - `app/(dashboard)/tax-debt/debts/page.tsx`
  - List with filtering and sorting
  - Total calculations

- [ ] **3.4** Create debt detail/edit page
  - `app/(dashboard)/tax-debt/debts/[id]/page.tsx`
  - Edit form with delete option
  - Payment history

- [ ] **3.5** Create interest calculation utility
  - `lib/tax/interest-calculator.ts`
  - Daily compound interest
  - Current balance calculation

- [ ] **3.6** Create debt summary widget
  - Total debt with daily interest
  - Oldest debt year
  - Collection status indicator

---

## Task Group 4: Financial Snapshot

**Assigned Agent:** `frontend-engineer`
**Dependencies:** Group 1, 2

### Tasks

- [ ] **4.1** Create income section component
  - `components/features/tax-debt/income-section.tsx`
  - All Form 433-A income fields
  - Auto-calculate total

- [ ] **4.2** Create expense section component
  - `components/features/tax-debt/expense-section.tsx`
  - All expense categories
  - IRS allowable comparison display
  - Over-allowance justification fields

- [ ] **4.3** Create asset section component
  - `components/features/tax-debt/asset-section.tsx`
  - Bank accounts, investments, property, vehicles
  - Quick sale value calculation (80%)

- [ ] **4.4** Create financial snapshot form
  - `components/features/tax-debt/financial-snapshot-form.tsx`
  - Collapsible sections
  - Save progress functionality

- [ ] **4.5** Create snapshot server actions
  - `actions/financial-snapshot.ts`
  - Create/update snapshot
  - Calculate disposable income

- [ ] **4.6** Create snapshot page
  - `app/(dashboard)/tax-debt/snapshot/page.tsx`
  - Full form with summary
  - Save and calculate buttons

- [ ] **4.7** Create snapshot comparison
  - Compare current to previous
  - Show changes over time
  - Historical list

---

## Task Group 5: OIC Calculator

**Assigned Agent:** `frontend-engineer`
**Dependencies:** Group 4

### Tasks

- [ ] **5.1** Create RCP calculator utility
  - `lib/irs/rcp-calculator.ts`
  - Asset equity calculation
  - Future income (age-adjusted)
  - Total RCP

- [ ] **5.2** Create OIC calculator utility
  - `lib/irs/oic-calculator.ts`
  - Disposable income
  - Application fee
  - Payment options

- [ ] **5.3** Create RCP breakdown component
  - `components/features/tax-debt/rcp-breakdown.tsx`
  - Visual breakdown of components
  - Comparison to total debt

- [ ] **5.4** Create OIC calculator component
  - `components/features/tax-debt/oic-calculator.tsx`
  - Pull from financial snapshot
  - Lump sum vs periodic toggle
  - Results display

- [ ] **5.5** Create OIC calculator page
  - `app/(dashboard)/tax-debt/oic-calculator/page.tsx`
  - Calculator with snapshot data
  - Form pre-fill preview
  - Success probability estimate

- [ ] **5.6** Create Form 656/433-A data mapping
  - Map snapshot data to form fields
  - Display in form structure
  - Export capability (future)

---

## Task Group 6: Installment Agreement

**Assigned Agent:** `frontend-engineer`
**Dependencies:** Group 4

### Tasks

- [ ] **6.1** Create installment calculator utility
  - `lib/irs/installment-calculator.ts`
  - Agreement type determination
  - Monthly payment calculation
  - Total cost projection

- [ ] **6.2** Create payment schedule generator
  - Month-by-month projection
  - Interest accumulation
  - Balance over time

- [ ] **6.3** Create installment calculator component
  - `components/features/tax-debt/installment-calculator.tsx`
  - Payment slider
  - Timeline visualization
  - Total cost display

- [ ] **6.4** Create payment plan page
  - `app/(dashboard)/tax-debt/payment-plans/page.tsx`
  - Calculator interface
  - Comparison of options
  - Form 9465 data preview

- [ ] **6.5** Add OIC vs IA comparison
  - Total cost comparison
  - Time to resolution
  - Pros/cons

---

## Task Group 7: Relief Comparison

**Assigned Agent:** `frontend-engineer`
**Dependencies:** Group 5, 6

### Tasks

- [ ] **7.1** Create eligibility matrix logic
  - OIC eligibility (RCP < debt)
  - IA types (guaranteed, streamlined, non-streamlined)
  - CNC eligibility (disposable income ≤ 0)
  - Penalty abatement eligibility

- [ ] **7.2** Create relief comparison component
  - `components/features/tax-debt/relief-comparison.tsx`
  - Side-by-side matrix
  - Pros/cons for each
  - Cost comparison

- [ ] **7.3** Create recommendation engine
  - Analyze situation
  - Generate recommendation with reasoning
  - Flag professional help triggers

- [ ] **7.4** Create comparison page
  - `app/(dashboard)/tax-debt/compare/page.tsx`
  - Full comparison view
  - Expandable program details
  - "What if" scenarios

- [ ] **7.5** Create tax debt overview page
  - `app/(dashboard)/tax-debt/page.tsx`
  - Summary widgets
  - Quick actions
  - Recommended next step

---

## Task Group 8: Correspondence Tracker

**Assigned Agent:** `frontend-engineer`
**Dependencies:** Group 3

### Tasks

- [ ] **8.1** Create correspondence form
  - `components/features/tax-debt/correspondence-form.tsx`
  - Notice type dropdown
  - Deadline picker
  - Status tracking

- [ ] **8.2** Create correspondence server actions
  - `actions/correspondence.ts`
  - CRUD operations
  - Deadline queries

- [ ] **8.3** Create correspondence list
  - `components/features/tax-debt/correspondence-list.tsx`
  - Timeline view
  - Status badges
  - Deadline indicators

- [ ] **8.4** Create deadline alert component
  - `components/features/tax-debt/deadline-alert.tsx`
  - Upcoming deadlines (7 days)
  - Overdue items
  - Dashboard integration

- [ ] **8.5** Create correspondence pages
  - `app/(dashboard)/tax-debt/correspondence/page.tsx` (list)
  - `app/(dashboard)/tax-debt/correspondence/[id]/page.tsx` (detail)
  - Add/edit functionality

---

## Task Group 9: Testing & Verification

**Assigned Agent:** `testing-engineer`
**Dependencies:** All

### Tasks

- [ ] **9.1** Test OIC calculations
  - Compare to IRS pre-qualifier
  - Test edge cases (age 65+, zero assets)
  - Verify future income months

- [ ] **9.2** Test National Standards lookups
  - All categories return correct values
  - Handle missing data gracefully

- [ ] **9.3** Test financial snapshot
  - Form validation
  - Calculation accuracy
  - Save/load functionality

- [ ] **9.4** Manual verification checklist
  - [ ] Can create user profile
  - [ ] Can add/edit tax debts
  - [ ] Interest calculates correctly
  - [ ] Financial snapshot saves all fields
  - [ ] OIC calculator produces reasonable results
  - [ ] Installment calculator works
  - [ ] Relief comparison shows all options
  - [ ] Correspondence deadlines display
  - [ ] Professional help triggers fire appropriately

---

## Completion Checklist

- [ ] All task groups completed
- [ ] OIC calculation matches IRS methodology
- [ ] National Standards data loaded
- [ ] All forms validate correctly
- [ ] Deadline alerts working
- [ ] No TypeScript errors
- [ ] Tests passing
