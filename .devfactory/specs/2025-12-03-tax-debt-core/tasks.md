# Implementation Tasks: Tax Debt Core

## Task Groups Overview

| Group | Name                   | Tasks | Dependencies |
| ----- | ---------------------- | ----- | ------------ |
| 1     | IRS Reference Data     | 4     | Foundation   |
| 2     | User Profile           | 5     | Foundation   |
| 3     | Tax Debt Tracking      | 6     | Foundation   |
| 4     | Financial Snapshot     | 7     | Group 1, 2   |
| 5     | OIC Calculator         | 6     | Group 4      |
| 6     | Installment Agreement  | 5     | Group 4      |
| 7     | Relief Comparison      | 5     | Group 5, 6   |
| 8     | Correspondence Tracker | 5     | Group 3      |
| 9     | Testing & Verification | 4     | All          |

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
  - **depends_on**: []

- [ ] **1.2** Seed tax bracket data
  - 2024 federal brackets for all filing statuses
  - 2024 Wisconsin brackets
  - **depends_on**: []
  - **parallel_with**: ["1.1"]

- [ ] **1.3** Create National Standards lookup API
  - `app/api/irs/national-standards/route.ts`
  - Query by year, category, location, household size
  - **depends_on**: ["1.1"]

- [ ] **1.4** Create National Standards lookup utility
  - `lib/irs/national-standards.ts`
  - Type-safe lookup functions
  - Caching for performance
  - **depends_on**: ["1.3"]

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
  - **depends_on**: []

- [ ] **2.2** Create profile server actions
  - `actions/profile.ts`
  - `getProfile()`, `updateProfile()`
  - Validation with Zod
  - **depends_on**: []
  - **parallel_with**: ["2.1"]

- [ ] **2.3** Create profile settings page
  - `app/(dashboard)/settings/profile/page.tsx`
  - Form with save functionality
  - Success/error feedback
  - **depends_on**: ["2.1", "2.2"]

- [ ] **2.4** Add age calculation display
  - Calculate age from DOB
  - Show OIC future income multiplier
  - "Based on your age, IRS uses X months..."
  - **depends_on**: ["2.3"]

- [ ] **2.5** Create profile summary widget
  - For dashboard display
  - Key demographics at a glance
  - Link to edit profile
  - **depends_on**: ["2.2"]
  - **parallel_with**: ["2.3", "2.4"]

---

## Task Group 3: Tax Debt Tracking

**Assigned Agent:** `frontend-engineer`
**Dependencies:** Foundation

### Tasks

- [ ] **3.1** Create tax debt form component
  - `components/features/tax-debt/debt-form.tsx`
  - All debt fields from schema
  - Tax year dropdown (last 10 years)
  - **depends_on**: []

- [ ] **3.2** Create tax debt server actions
  - `actions/tax-debt.ts`
  - CRUD operations
  - Payment recording
  - **depends_on**: []
  - **parallel_with**: ["3.1"]

- [ ] **3.3** Create debt list page
  - `app/(dashboard)/tax-debt/debts/page.tsx`
  - List with filtering and sorting
  - Total calculations
  - **depends_on**: ["3.1", "3.2"]

- [ ] **3.4** Create debt detail/edit page
  - `app/(dashboard)/tax-debt/debts/[id]/page.tsx`
  - Edit form with delete option
  - Payment history
  - **depends_on**: ["3.3"]

- [ ] **3.5** Create interest calculation utility
  - `lib/tax/interest-calculator.ts`
  - Daily compound interest
  - Current balance calculation
  - **depends_on**: []
  - **parallel_with**: ["3.1", "3.2"]

- [ ] **3.6** Create debt summary widget
  - Total debt with daily interest
  - Oldest debt year
  - Collection status indicator
  - **depends_on**: ["3.2", "3.5"]
  - **parallel_with**: ["3.3", "3.4"]

---

## Task Group 4: Financial Snapshot

**Assigned Agent:** `frontend-engineer`
**Dependencies:** Group 1, 2

### Tasks

- [ ] **4.1** Create income section component
  - `components/features/tax-debt/income-section.tsx`
  - All Form 433-A income fields
  - Auto-calculate total
  - **depends_on**: ["1.4", "2.3"]

- [ ] **4.2** Create expense section component
  - `components/features/tax-debt/expense-section.tsx`
  - All expense categories
  - IRS allowable comparison display
  - Over-allowance justification fields
  - **depends_on**: ["1.4", "2.3"]
  - **parallel_with**: ["4.1"]

- [ ] **4.3** Create asset section component
  - `components/features/tax-debt/asset-section.tsx`
  - Bank accounts, investments, property, vehicles
  - Quick sale value calculation (80%)
  - **depends_on**: ["2.3"]
  - **parallel_with**: ["4.1", "4.2"]

- [ ] **4.4** Create financial snapshot form
  - `components/features/tax-debt/financial-snapshot-form.tsx`
  - Collapsible sections
  - Save progress functionality
  - **depends_on**: ["4.1", "4.2", "4.3"]

- [ ] **4.5** Create snapshot server actions
  - `actions/financial-snapshot.ts`
  - Create/update snapshot
  - Calculate disposable income
  - **depends_on**: ["1.4"]
  - **parallel_with**: ["4.1", "4.2", "4.3"]

- [ ] **4.6** Create snapshot page
  - `app/(dashboard)/tax-debt/snapshot/page.tsx`
  - Full form with summary
  - Save and calculate buttons
  - **depends_on**: ["4.4", "4.5"]

- [ ] **4.7** Create snapshot comparison
  - Compare current to previous
  - Show changes over time
  - Historical list
  - **depends_on**: ["4.6"]

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
  - **depends_on**: ["4.5"]

- [ ] **5.2** Create OIC calculator utility
  - `lib/irs/oic-calculator.ts`
  - Disposable income
  - Application fee
  - Payment options
  - **depends_on**: ["5.1"]

- [ ] **5.3** Create RCP breakdown component
  - `components/features/tax-debt/rcp-breakdown.tsx`
  - Visual breakdown of components
  - Comparison to total debt
  - **depends_on**: ["5.1"]
  - **parallel_with**: ["5.2"]

- [ ] **5.4** Create OIC calculator component
  - `components/features/tax-debt/oic-calculator.tsx`
  - Pull from financial snapshot
  - Lump sum vs periodic toggle
  - Results display
  - **depends_on**: ["5.2", "5.3"]

- [ ] **5.5** Create OIC calculator page
  - `app/(dashboard)/tax-debt/oic-calculator/page.tsx`
  - Calculator with snapshot data
  - Form pre-fill preview
  - Success probability estimate
  - **depends_on**: ["5.4"]

- [ ] **5.6** Create Form 656/433-A data mapping
  - Map snapshot data to form fields
  - Display in form structure
  - Export capability (future)
  - **depends_on**: ["5.4"]
  - **parallel_with**: ["5.5"]

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
  - **depends_on**: ["4.5"]

- [ ] **6.2** Create payment schedule generator
  - Month-by-month projection
  - Interest accumulation
  - Balance over time
  - **depends_on**: ["6.1"]

- [ ] **6.3** Create installment calculator component
  - `components/features/tax-debt/installment-calculator.tsx`
  - Payment slider
  - Timeline visualization
  - Total cost display
  - **depends_on**: ["6.2"]

- [ ] **6.4** Create payment plan page
  - `app/(dashboard)/tax-debt/payment-plans/page.tsx`
  - Calculator interface
  - Comparison of options
  - Form 9465 data preview
  - **depends_on**: ["6.3"]

- [ ] **6.5** Add OIC vs IA comparison
  - Total cost comparison
  - Time to resolution
  - Pros/cons
  - **depends_on**: ["5.4", "6.3"]

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
  - **depends_on**: ["5.2", "6.1"]

- [ ] **7.2** Create relief comparison component
  - `components/features/tax-debt/relief-comparison.tsx`
  - Side-by-side matrix
  - Pros/cons for each
  - Cost comparison
  - **depends_on**: ["7.1"]

- [ ] **7.3** Create recommendation engine
  - Analyze situation
  - Generate recommendation with reasoning
  - Flag professional help triggers
  - **depends_on**: ["7.1"]
  - **parallel_with**: ["7.2"]

- [ ] **7.4** Create comparison page
  - `app/(dashboard)/tax-debt/compare/page.tsx`
  - Full comparison view
  - Expandable program details
  - "What if" scenarios
  - **depends_on**: ["7.2", "7.3"]

- [ ] **7.5** Create tax debt overview page
  - `app/(dashboard)/tax-debt/page.tsx`
  - Summary widgets
  - Quick actions
  - Recommended next step
  - **depends_on**: ["7.4", "3.6"]

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
  - **depends_on**: ["3.2"]

- [ ] **8.2** Create correspondence server actions
  - `actions/correspondence.ts`
  - CRUD operations
  - Deadline queries
  - **depends_on**: ["3.2"]
  - **parallel_with**: ["8.1"]

- [ ] **8.3** Create correspondence list
  - `components/features/tax-debt/correspondence-list.tsx`
  - Timeline view
  - Status badges
  - Deadline indicators
  - **depends_on**: ["8.1", "8.2"]

- [ ] **8.4** Create deadline alert component
  - `components/features/tax-debt/deadline-alert.tsx`
  - Upcoming deadlines (7 days)
  - Overdue items
  - Dashboard integration
  - **depends_on**: ["8.2"]
  - **parallel_with**: ["8.3"]

- [ ] **8.5** Create correspondence pages
  - `app/(dashboard)/tax-debt/correspondence/page.tsx` (list)
  - `app/(dashboard)/tax-debt/correspondence/[id]/page.tsx` (detail)
  - Add/edit functionality
  - **depends_on**: ["8.3", "8.4"]

---

## Task Group 9: Testing & Verification

**Assigned Agent:** `testing-engineer`
**Dependencies:** All

### Tasks

- [ ] **9.1** Test OIC calculations
  - Compare to IRS pre-qualifier
  - Test edge cases (age 65+, zero assets)
  - Verify future income months
  - **depends_on**: ["5.5"]

- [ ] **9.2** Test National Standards lookups
  - All categories return correct values
  - Handle missing data gracefully
  - **depends_on**: ["1.4"]
  - **parallel_with**: ["9.1"]

- [ ] **9.3** Test financial snapshot
  - Form validation
  - Calculation accuracy
  - Save/load functionality
  - **depends_on**: ["4.6"]
  - **parallel_with**: ["9.1", "9.2"]

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
  - **depends_on**: ["9.1", "9.2", "9.3", "7.5", "8.5"]

---

## Completion Checklist

- [ ] All task groups completed
- [ ] OIC calculation matches IRS methodology
- [ ] National Standards data loaded
- [ ] All forms validate correctly
- [ ] Deadline alerts working
- [ ] No TypeScript errors
- [ ] Tests passing

---

## Parallel Execution Summary

### Dependency Graph

```
PHASE 1 (No dependencies - Maximum Parallelism):
├── 1.1 Seed IRS National Standards
├── 1.2 Seed tax bracket data
├── 2.1 Profile form component
├── 2.2 Profile server actions
├── 3.1 Tax debt form component
├── 3.2 Tax debt server actions
└── 3.5 Interest calculation utility

PHASE 2 (After Phase 1):
├── 1.3 National Standards API          ← depends_on: [1.1]
├── 2.3 Profile settings page           ← depends_on: [2.1, 2.2]
├── 2.5 Profile summary widget          ← depends_on: [2.2]
├── 3.3 Debt list page                  ← depends_on: [3.1, 3.2]
├── 3.6 Debt summary widget             ← depends_on: [3.2, 3.5]
├── 8.1 Correspondence form             ← depends_on: [3.2]
└── 8.2 Correspondence server actions   ← depends_on: [3.2]

PHASE 3 (After Phase 2):
├── 1.4 National Standards utility      ← depends_on: [1.3]
├── 2.4 Age calculation display         ← depends_on: [2.3]
├── 3.4 Debt detail/edit page           ← depends_on: [3.3]
├── 8.3 Correspondence list             ← depends_on: [8.1, 8.2]
└── 8.4 Deadline alert component        ← depends_on: [8.2]

PHASE 4 (After Phase 3):
├── 4.1 Income section component        ← depends_on: [1.4, 2.3]
├── 4.2 Expense section component       ← depends_on: [1.4, 2.3]
├── 4.3 Asset section component         ← depends_on: [2.3]
├── 4.5 Snapshot server actions         ← depends_on: [1.4]
├── 8.5 Correspondence pages            ← depends_on: [8.3, 8.4]
└── 9.2 Test National Standards         ← depends_on: [1.4]

PHASE 5 (After Phase 4):
├── 4.4 Financial snapshot form         ← depends_on: [4.1, 4.2, 4.3]

PHASE 6 (After Phase 5):
├── 4.6 Snapshot page                   ← depends_on: [4.4, 4.5]
├── 5.1 RCP calculator utility          ← depends_on: [4.5]
├── 6.1 Installment calculator utility  ← depends_on: [4.5]

PHASE 7 (After Phase 6):
├── 4.7 Snapshot comparison             ← depends_on: [4.6]
├── 5.2 OIC calculator utility          ← depends_on: [5.1]
├── 5.3 RCP breakdown component         ← depends_on: [5.1]
├── 6.2 Payment schedule generator      ← depends_on: [6.1]
├── 9.3 Test financial snapshot         ← depends_on: [4.6]

PHASE 8 (After Phase 7):
├── 5.4 OIC calculator component        ← depends_on: [5.2, 5.3]
├── 6.3 Installment calculator comp     ← depends_on: [6.2]
├── 7.1 Eligibility matrix logic        ← depends_on: [5.2, 6.1]

PHASE 9 (After Phase 8):
├── 5.5 OIC calculator page             ← depends_on: [5.4]
├── 5.6 Form 656/433-A data mapping     ← depends_on: [5.4]
├── 6.4 Payment plan page               ← depends_on: [6.3]
├── 6.5 OIC vs IA comparison            ← depends_on: [5.4, 6.3]
├── 7.2 Relief comparison component     ← depends_on: [7.1]
├── 7.3 Recommendation engine           ← depends_on: [7.1]

PHASE 10 (After Phase 9):
├── 7.4 Comparison page                 ← depends_on: [7.2, 7.3]
├── 9.1 Test OIC calculations           ← depends_on: [5.5]

PHASE 11 (After Phase 10):
├── 7.5 Tax debt overview page          ← depends_on: [7.4, 3.6]

PHASE 12 (Final):
└── 9.4 Manual verification             ← depends_on: [9.1, 9.2, 9.3, 7.5, 8.5]
```

### Parallel Execution Waves

| Wave | Tasks (can run simultaneously)    | Count |
| ---- | --------------------------------- | ----- |
| 1    | 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.5 | 7     |
| 2    | 1.3, 2.3, 2.5, 3.3, 3.6, 8.1, 8.2 | 7     |
| 3    | 1.4, 2.4, 3.4, 8.3, 8.4           | 5     |
| 4    | 4.1, 4.2, 4.3, 4.5, 8.5, 9.2      | 6     |
| 5    | 4.4                               | 1     |
| 6    | 4.6, 5.1, 6.1                     | 3     |
| 7    | 4.7, 5.2, 5.3, 6.2, 9.3           | 5     |
| 8    | 5.4, 6.3, 7.1                     | 3     |
| 9    | 5.5, 5.6, 6.4, 6.5, 7.2, 7.3      | 6     |
| 10   | 7.4, 9.1                          | 2     |
| 11   | 7.5                               | 1     |
| 12   | 9.4                               | 1     |

### Critical Path

```
1.1 → 1.3 → 1.4 → 4.1/4.2/4.5 → 4.4 → 4.6 → 5.1 → 5.2 → 5.4 → 5.5 → 9.1 ─┐
                                                    ↓                      │
                                                  7.1 → 7.2/7.3 → 7.4 → 7.5 → 9.4
                                                    ↓
                                      6.1 → 6.2 → 6.3 → 6.4
```

**Critical Path Length**: 12 sequential phases (vs 47 tasks if sequential = 3.9x speedup potential)
