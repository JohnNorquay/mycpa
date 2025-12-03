# Technical Specification: Tax Debt Core

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Tax Debt Module                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Profile   │  │  Tax Debt   │  │   Financial         │  │
│  │   Manager   │  │  Tracker    │  │   Snapshot          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    OIC      │  │ Installment │  │   Relief Program    │  │
│  │ Calculator  │  │  Agreement  │  │   Comparison        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │           IRS Correspondence Tracker                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    IRS National Standards                    │
│                    (Reference Data Layer)                    │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure (additions)

```
app/(dashboard)/
├── tax-debt/
│   ├── page.tsx                    # Tax debt overview
│   ├── debts/
│   │   ├── page.tsx                # Debt list
│   │   ├── new/page.tsx            # Add debt
│   │   └── [id]/page.tsx           # Edit debt
│   ├── oic-calculator/
│   │   └── page.tsx                # OIC calculator
│   ├── payment-plans/
│   │   └── page.tsx                # Installment agreement
│   ├── compare/
│   │   └── page.tsx                # Relief comparison
│   └── correspondence/
│       ├── page.tsx                # Correspondence list
│       └── [id]/page.tsx           # Correspondence detail
├── settings/
│   └── profile/
│       └── page.tsx                # User profile/demographics

components/features/tax-debt/
├── profile-form.tsx
├── debt-form.tsx
├── debt-list.tsx
├── debt-summary-widget.tsx
├── financial-snapshot-form.tsx
├── income-section.tsx
├── expense-section.tsx
├── asset-section.tsx
├── oic-calculator.tsx
├── rcp-breakdown.tsx
├── installment-calculator.tsx
├── relief-comparison.tsx
├── correspondence-form.tsx
├── correspondence-list.tsx
├── deadline-alert.tsx
└── national-standards-lookup.tsx

lib/
├── irs/
│   ├── national-standards.ts       # Standards lookup
│   ├── oic-calculator.ts           # OIC calculation logic
│   ├── installment-calculator.ts   # Payment plan logic
│   └── rcp-calculator.ts           # RCP calculation
├── tax/
│   └── interest-calculator.ts      # Daily interest calc

actions/
├── profile.ts
├── tax-debt.ts
├── financial-snapshot.ts
├── relief-applications.ts
└── correspondence.ts
```

## Key Calculations

### OIC Reasonable Collection Potential (RCP)

```typescript
// lib/irs/rcp-calculator.ts

interface RCPInput {
  // Assets
  bankAccounts: number
  investments: number
  homeEquity: number      // FMV - mortgage
  vehicleEquity: number   // FMV - loans
  otherAssets: number

  // Income
  monthlyDisposableIncome: number
  age: number

  // Options
  paymentType: 'lump_sum' | 'periodic'
}

interface RCPResult {
  assetEquity: number
  futureIncome: number
  totalRCP: number
  minimumOffer: number
  futureIncomeMonths: number
}

export function calculateRCP(input: RCPInput): RCPResult {
  // Quick Sale Value = 80% of FMV
  const QUICK_SALE_MULTIPLIER = 0.80

  const assetEquity = (
    input.bankAccounts +
    input.investments +
    (input.homeEquity * QUICK_SALE_MULTIPLIER) +
    (input.vehicleEquity * QUICK_SALE_MULTIPLIER) +
    (input.otherAssets * QUICK_SALE_MULTIPLIER)
  )

  // Future income months based on age
  let futureIncomeMonths: number
  if (input.age >= 65) {
    futureIncomeMonths = 0  // Collection period ends at 65
  } else if (input.paymentType === 'lump_sum') {
    futureIncomeMonths = 12
  } else {
    futureIncomeMonths = 24  // Periodic payment
  }

  const futureIncome = input.monthlyDisposableIncome * futureIncomeMonths
  const totalRCP = assetEquity + futureIncome

  return {
    assetEquity,
    futureIncome,
    totalRCP,
    minimumOffer: Math.max(totalRCP, 0),
    futureIncomeMonths,
  }
}
```

### Disposable Income Calculation

```typescript
// lib/irs/oic-calculator.ts

interface ExpenseCategory {
  category: string
  irsAllowable: number
  actual: number
}

export function calculateDisposableIncome(
  grossMonthlyIncome: number,
  taxes: number,
  expenses: ExpenseCategory[]
): number {
  const netIncome = grossMonthlyIncome - taxes

  // Use lesser of actual or IRS allowable for each category
  const allowableExpenses = expenses.reduce((sum, exp) => {
    return sum + Math.min(exp.actual, exp.irsAllowable)
  }, 0)

  return netIncome - allowableExpenses
}
```

### Daily Interest Calculation

```typescript
// lib/tax/interest-calculator.ts

export function calculateCurrentBalance(
  originalBalance: number,
  annualRate: number,
  daysSinceAssessment: number
): number {
  const dailyRate = annualRate / 365
  return originalBalance * Math.pow(1 + dailyRate, daysSinceAssessment)
}
```

## Form 433-A Data Mapping

```typescript
// types/irs-forms.ts

interface Form433ASection4Assets {
  cashOnHand: number
  bankAccounts: BankAccount[]
  investments: Investment[]
  creditAvailable: number
  realProperty: RealProperty[]
  vehicles: Vehicle[]
  lifeInsuranceCashValue: number
  otherAssets: OtherAsset[]
}

interface Form433ASection5Income {
  wages: number
  selfEmploymentIncome: number
  socialSecurity: number
  pension: number
  childSupport: number
  alimony: number
  rentalIncome: number
  interestDividends: number
  otherIncome: number
  totalMonthlyIncome: number  // Calculated
}

interface Form433ASection6Expenses {
  foodClothingMisc: number
  housing: HousingExpense
  transportation: TransportationExpense
  healthcare: number
  courtOrderedPayments: number
  childDependentCare: number
  lifeInsurance: number
  currentTaxes: number
  securedDebts: number
  otherExpenses: OtherExpense[]
  totalMonthlyExpenses: number  // Calculated
}
```

## IRS National Standards Data Structure

```typescript
// Seed data format for irs_national_standards table

const nationalStandards2024 = [
  // Food, Clothing, Personal Care, Misc by household size
  { year: 2024, category: 'food_clothing_misc', household_size: 1, amount: 785 },
  { year: 2024, category: 'food_clothing_misc', household_size: 2, amount: 1410 },
  { year: 2024, category: 'food_clothing_misc', household_size: 3, amount: 1658 },
  { year: 2024, category: 'food_clothing_misc', household_size: 4, amount: 1967 },

  // Housing by state/county (example)
  { year: 2024, category: 'housing_utilities', state: 'WI', county: 'Dane', amount: 2156 },
  { year: 2024, category: 'housing_utilities', state: 'WI', county: 'Milwaukee', amount: 1876 },

  // Transportation
  { year: 2024, category: 'transportation_ownership', region: 'midwest', vehicles: 1, amount: 588 },
  { year: 2024, category: 'transportation_operating', region: 'midwest', amount: 289 },

  // Healthcare by age
  { year: 2024, category: 'healthcare', age_bracket: 'under_65', amount: 75 },
  { year: 2024, category: 'healthcare', age_bracket: '65_and_over', amount: 153 },
]
```

## API Routes

```typescript
// app/api/irs/national-standards/route.ts
GET /api/irs/national-standards?year=2024&category=housing&state=WI&county=Dane

// Response
{
  amount: 2156,
  category: "housing_utilities",
  year: 2024,
  state: "WI",
  county: "Dane"
}
```

## Server Actions

```typescript
// actions/tax-debt.ts
export async function createTaxDebt(formData: FormData)
export async function updateTaxDebt(id: string, formData: FormData)
export async function deleteTaxDebt(id: string)
export async function recordPayment(debtId: string, formData: FormData)

// actions/financial-snapshot.ts
export async function createSnapshot(formData: FormData)
export async function updateSnapshot(id: string, formData: FormData)
export async function calculateRCP(snapshotId: string)

// actions/correspondence.ts
export async function createCorrespondence(formData: FormData)
export async function updateCorrespondenceStatus(id: string, status: string)
export async function getUpcomingDeadlines(userId: string)
```

## UI Components

### Debt Summary Widget
```tsx
<DebtSummaryWidget
  totalDebt={125000}
  originalDebt={100000}
  dailyInterest={27.40}
  oldestDebt={2019}
  collectionStatus="lien_filed"
/>
```

### OIC Calculator Display
```tsx
<OICCalculator
  snapshot={financialSnapshot}
  userAge={45}
  onCalculate={(result) => {
    // result.minimumOffer
    // result.assetEquity
    // result.futureIncome
  }}
/>
```

### Relief Comparison Matrix
```tsx
<ReliefComparison
  oicResult={oicCalculation}
  installmentOptions={paymentPlans}
  cncEligible={disposableIncome <= 0}
  penaltyAbatementEligible={firstTimeAbatement}
  recommendation="oic"
  recommendationReason="Your RCP is significantly less than your total debt..."
/>
```
