# Technical Specification: Tax Planning

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Tax Planning Module                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │    Federal Tax  │  │  Wisconsin Tax  │  │  Deduction  │  │
│  │    Calculator   │  │   Calculator    │  │  Tracker    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │    Estimated    │  │  Withholding    │  │    Tax      │  │
│  │   Tax Calc      │  │   Analyzer      │  │  Projection │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│            Tax Brackets & Reference Data (Database)          │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
app/(dashboard)/
├── tax-center/
│   ├── page.tsx                   # Tax projection dashboard
│   ├── income/page.tsx            # Income entry/tracking
│   ├── deductions/page.tsx        # Deduction tracker
│   └── estimated-tax/page.tsx     # Estimated tax calculator

components/features/tax-planning/
├── federal-tax-calculator.tsx
├── wisconsin-tax-calculator.tsx
├── tax-projection-dashboard.tsx
├── income-summary.tsx
├── income-entry-form.tsx
├── deduction-tracker.tsx
├── deduction-category.tsx
├── itemize-comparison.tsx
├── estimated-tax-calculator.tsx
├── quarterly-schedule.tsx
├── withholding-analyzer.tsx
├── marginal-rate-display.tsx
└── tax-bracket-visualizer.tsx

lib/
├── tax/
│   ├── federal-calculator.ts
│   ├── wisconsin-calculator.ts
│   ├── self-employment-tax.ts
│   ├── deduction-calculator.ts
│   └── estimated-tax.ts

actions/
├── tax-income.ts
├── tax-deductions.ts
├── tax-projections.ts
└── estimated-payments.ts
```

## Federal Tax Calculator

```typescript
// lib/tax/federal-calculator.ts

interface TaxInput {
  filingStatus: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household' | 'qualifying_widow'
  taxYear: number

  // Income
  w2Wages: number
  w2Withholding: number
  income1099: number
  interestIncome: number
  qualifiedDividends: number
  ordinaryDividends: number
  shortTermCapitalGains: number
  longTermCapitalGains: number
  otherIncome: number

  // Deductions
  itemizedDeductions?: number
  useStandardDeduction: boolean

  // Credits
  dependentsUnder17: number
  dependents17Plus: number
  otherCredits: number

  // Age
  age: number
  spouseAge?: number
}

interface TaxResult {
  grossIncome: number
  adjustedGrossIncome: number
  taxableIncome: number
  standardDeduction: number
  itemizedDeductionTotal: number
  deductionUsed: 'standard' | 'itemized'

  // Tax calculations
  ordinaryIncomeTax: number
  capitalGainsTax: number
  selfEmploymentTax: number
  totalTaxBeforeCredits: number

  // Credits
  childTaxCredit: number
  earnedIncomeCredit: number
  otherCredits: number
  totalCredits: number

  // Final
  totalTax: number
  totalWithholding: number
  amountOwed: number        // Positive = owe, negative = refund

  // Rates
  marginalRate: number
  effectiveRate: number
  marginalBracket: string
}

// 2024 Federal Tax Brackets (stored in database, shown here for reference)
const FEDERAL_BRACKETS_2024 = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married_filing_jointly: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
  // ... other filing statuses
}

const STANDARD_DEDUCTION_2024 = {
  single: 14600,
  married_filing_jointly: 29200,
  married_filing_separately: 14600,
  head_of_household: 21900,
  qualifying_widow: 29200,
  // Additional for 65+ or blind
  additional_65_single: 1950,
  additional_65_married: 1550,
}

export function calculateFederalTax(input: TaxInput): TaxResult {
  // Step 1: Calculate Gross Income
  const grossIncome =
    input.w2Wages +
    input.income1099 +
    input.interestIncome +
    input.qualifiedDividends +
    input.ordinaryDividends +
    input.shortTermCapitalGains +
    input.longTermCapitalGains +
    input.otherIncome

  // Step 2: Calculate Adjustments to Income
  const selfEmploymentTax = calculateSelfEmploymentTax(input.income1099)
  const seDeduction = selfEmploymentTax / 2 // Deduct half of SE tax

  const adjustedGrossIncome = grossIncome - seDeduction

  // Step 3: Determine Deduction
  let standardDeduction = STANDARD_DEDUCTION_2024[input.filingStatus]

  // Add additional deduction for 65+
  if (input.age >= 65) {
    standardDeduction += input.filingStatus === 'single' || input.filingStatus === 'head_of_household'
      ? STANDARD_DEDUCTION_2024.additional_65_single
      : STANDARD_DEDUCTION_2024.additional_65_married
  }

  const deductionUsed = input.useStandardDeduction || (input.itemizedDeductions ?? 0) <= standardDeduction
    ? 'standard'
    : 'itemized'

  const deductionAmount = deductionUsed === 'standard'
    ? standardDeduction
    : (input.itemizedDeductions ?? 0)

  // Step 4: Calculate Taxable Income
  const taxableIncome = Math.max(0, adjustedGrossIncome - deductionAmount)

  // Step 5: Calculate Tax on Ordinary Income
  const ordinaryIncome = taxableIncome - input.longTermCapitalGains - input.qualifiedDividends
  const ordinaryIncomeTax = calculateProgressiveTax(
    ordinaryIncome,
    FEDERAL_BRACKETS_2024[input.filingStatus]
  )

  // Step 6: Calculate Tax on Capital Gains (0%, 15%, 20%)
  const capitalGainsTax = calculateCapitalGainsTax(
    input.longTermCapitalGains + input.qualifiedDividends,
    ordinaryIncome,
    input.filingStatus
  )

  // Step 7: Calculate Credits
  const childTaxCredit = Math.min(
    input.dependentsUnder17 * 2000,
    ordinaryIncomeTax + capitalGainsTax // Non-refundable portion limit
  )

  // Simplified EIC check (actual calculation is complex)
  const earnedIncomeCredit = calculateEIC(input)

  const totalCredits = childTaxCredit + earnedIncomeCredit + input.otherCredits

  // Step 8: Calculate Total Tax
  const totalTaxBeforeCredits = ordinaryIncomeTax + capitalGainsTax + selfEmploymentTax
  const totalTax = Math.max(0, totalTaxBeforeCredits - totalCredits)

  // Step 9: Calculate Amount Owed/Refund
  const amountOwed = totalTax - input.w2Withholding

  // Calculate rates
  const marginalRate = getMarginalRate(taxableIncome, input.filingStatus)
  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0

  return {
    grossIncome,
    adjustedGrossIncome,
    taxableIncome,
    standardDeduction,
    itemizedDeductionTotal: input.itemizedDeductions ?? 0,
    deductionUsed,
    ordinaryIncomeTax,
    capitalGainsTax,
    selfEmploymentTax,
    totalTaxBeforeCredits,
    childTaxCredit,
    earnedIncomeCredit,
    otherCredits: input.otherCredits,
    totalCredits,
    totalTax,
    totalWithholding: input.w2Withholding,
    amountOwed,
    marginalRate,
    effectiveRate,
    marginalBracket: getMarginalBracketLabel(taxableIncome, input.filingStatus)
  }
}

function calculateProgressiveTax(income: number, brackets: Bracket[]): number {
  let tax = 0
  let remainingIncome = income

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break

    const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min)
    tax += taxableInBracket * bracket.rate
    remainingIncome -= taxableInBracket
  }

  return tax
}
```

## Self-Employment Tax Calculator

```typescript
// lib/tax/self-employment-tax.ts

const SE_TAX_RATE = 0.153 // 15.3% (12.4% SS + 2.9% Medicare)
const SS_WAGE_BASE_2024 = 168600
const SE_INCOME_FACTOR = 0.9235 // 92.35% of net SE income

export function calculateSelfEmploymentTax(netSelfEmploymentIncome: number): number {
  if (netSelfEmploymentIncome <= 0) return 0

  // Only 92.35% of SE income is subject to SE tax
  const seEarnings = netSelfEmploymentIncome * SE_INCOME_FACTOR

  // Social Security portion (6.2% × 2 = 12.4%) up to wage base
  const ssWages = Math.min(seEarnings, SS_WAGE_BASE_2024)
  const ssTax = ssWages * 0.124

  // Medicare portion (1.45% × 2 = 2.9%) on all earnings
  const medicareTax = seEarnings * 0.029

  // Additional Medicare Tax (0.9%) on earnings over $200k single / $250k MFJ
  const additionalMedicare = Math.max(0, seEarnings - 200000) * 0.009

  return ssTax + medicareTax + additionalMedicare
}
```

## Wisconsin Tax Calculator

```typescript
// lib/tax/wisconsin-calculator.ts

interface WisconsinTaxInput {
  filingStatus: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household'
  taxYear: number
  federalAGI: number
  wisconsinAdditions: number   // Income WI adds back
  wisconsinSubtractions: number // Income WI excludes
  itemizedDeductions?: number
}

interface WisconsinTaxResult {
  wisconsinAGI: number
  standardDeduction: number
  itemizedDeductionTotal: number
  deductionUsed: 'standard' | 'itemized'
  taxableIncome: number
  taxBeforeCredits: number
  schoolPropertyTaxCredit: number
  marriedCoupleCredit: number
  otherCredits: number
  totalTax: number
  withholding: number
  amountOwed: number
}

// 2024 Wisconsin Tax Brackets
const WI_BRACKETS_2024 = {
  single: [
    { min: 0, max: 14320, rate: 0.035 },
    { min: 14320, max: 28640, rate: 0.044 },
    { min: 28640, max: 315310, rate: 0.053 },
    { min: 315310, max: Infinity, rate: 0.0765 },
  ],
  married_filing_jointly: [
    { min: 0, max: 19090, rate: 0.035 },
    { min: 19090, max: 38190, rate: 0.044 },
    { min: 38190, max: 420420, rate: 0.053 },
    { min: 420420, max: Infinity, rate: 0.0765 },
  ],
  // ... other statuses
}

// Wisconsin Standard Deduction (phases out at higher incomes)
const WI_STANDARD_DEDUCTION_2024 = {
  single: { base: 12760, phaseoutStart: 16690, phaseoutRate: 0.12 },
  married_filing_jointly: { base: 23620, phaseoutStart: 22260, phaseoutRate: 0.195 },
  // ...
}

export function calculateWisconsinTax(input: WisconsinTaxInput): WisconsinTaxResult {
  // Step 1: Calculate Wisconsin AGI
  const wisconsinAGI = input.federalAGI + input.wisconsinAdditions - input.wisconsinSubtractions

  // Step 2: Calculate Standard Deduction (with phase-out)
  const deductionParams = WI_STANDARD_DEDUCTION_2024[input.filingStatus]
  let standardDeduction = deductionParams.base

  if (wisconsinAGI > deductionParams.phaseoutStart) {
    const reduction = (wisconsinAGI - deductionParams.phaseoutStart) * deductionParams.phaseoutRate
    standardDeduction = Math.max(0, standardDeduction - reduction)
  }

  // Step 3: Determine Deduction to Use
  // Note: WI itemized is different from federal (no SALT deduction)
  const wiItemized = calculateWisconsinItemizedDeductions(input)
  const deductionUsed = wiItemized > standardDeduction ? 'itemized' : 'standard'
  const deductionAmount = deductionUsed === 'itemized' ? wiItemized : standardDeduction

  // Step 4: Calculate Taxable Income
  const taxableIncome = Math.max(0, wisconsinAGI - deductionAmount)

  // Step 5: Calculate Tax
  const taxBeforeCredits = calculateProgressiveTax(taxableIncome, WI_BRACKETS_2024[input.filingStatus])

  // Step 6: Apply Credits
  const schoolPropertyTaxCredit = calculateSchoolPropertyTaxCredit(input)
  const marriedCoupleCredit = input.filingStatus === 'married_filing_jointly'
    ? calculateMarriedCoupleCredit(input)
    : 0

  const totalCredits = schoolPropertyTaxCredit + marriedCoupleCredit

  // Step 7: Final Tax
  const totalTax = Math.max(0, taxBeforeCredits - totalCredits)

  return {
    wisconsinAGI,
    standardDeduction,
    itemizedDeductionTotal: wiItemized,
    deductionUsed,
    taxableIncome,
    taxBeforeCredits,
    schoolPropertyTaxCredit,
    marriedCoupleCredit,
    otherCredits: 0,
    totalTax,
    withholding: 0, // Populated from W2 data
    amountOwed: totalTax // Adjusted with withholding
  }
}
```

## Deduction Tracker

```typescript
// lib/tax/deduction-calculator.ts

interface DeductionSummary {
  categories: DeductionCategory[]
  totalItemized: number
  standardDeduction: number
  recommendation: 'standard' | 'itemized'
  itemizedAdvantage: number  // Positive = itemizing is better
  saltCapWarning: boolean
  medicalThresholdMet: boolean
}

interface DeductionCategory {
  name: string
  type: 'charitable' | 'medical' | 'salt' | 'mortgage' | 'home_office' | 'mileage' | 'other'
  amount: number
  limit?: number
  overLimit?: number
  fromTransactions: number
  manualEntry: number
  notes: string
}

const SALT_CAP = 10000

export function calculateDeductions(
  userId: string,
  taxYear: number,
  filingStatus: FilingStatus
): DeductionSummary {
  // Get deductible transactions
  const transactions = getDeductibleTransactions(userId, taxYear)

  // Get manual deduction entries
  const manualEntries = getManualDeductionEntries(userId, taxYear)

  // Get user's AGI for medical threshold
  const agi = getUserAGI(userId, taxYear)
  const medicalThreshold = agi * 0.075 // 7.5% floor

  const categories: DeductionCategory[] = []

  // Charitable Donations
  const charitableFromTx = sumByCategory(transactions, 'charitable')
  const charitableManual = manualEntries.charitable ?? 0
  categories.push({
    name: 'Charitable Donations',
    type: 'charitable',
    amount: charitableFromTx + charitableManual,
    fromTransactions: charitableFromTx,
    manualEntry: charitableManual,
    notes: 'Cash and non-cash donations'
  })

  // Medical Expenses (only amount over 7.5% AGI)
  const medicalTotal = sumByCategory(transactions, 'medical') + (manualEntries.medical ?? 0)
  const medicalDeductible = Math.max(0, medicalTotal - medicalThreshold)
  categories.push({
    name: 'Medical Expenses',
    type: 'medical',
    amount: medicalDeductible,
    limit: medicalThreshold,
    overLimit: medicalTotal - medicalThreshold,
    fromTransactions: sumByCategory(transactions, 'medical'),
    manualEntry: manualEntries.medical ?? 0,
    notes: `Only expenses over 7.5% of AGI ($${medicalThreshold.toFixed(0)}) are deductible`
  })

  // State and Local Taxes (SALT) - capped at $10,000
  const propertyTax = manualEntries.propertyTax ?? 0
  const stateIncomeTax = manualEntries.stateIncomeTax ?? 0 // From W2 or estimated
  const saltTotal = propertyTax + stateIncomeTax
  const saltDeductible = Math.min(saltTotal, SALT_CAP)
  categories.push({
    name: 'State & Local Taxes (SALT)',
    type: 'salt',
    amount: saltDeductible,
    limit: SALT_CAP,
    overLimit: saltTotal > SALT_CAP ? saltTotal - SALT_CAP : undefined,
    fromTransactions: 0,
    manualEntry: saltTotal,
    notes: saltTotal > SALT_CAP ? `Capped at $10,000 (you have $${saltTotal.toFixed(0)})` : ''
  })

  // Mortgage Interest
  const mortgageInterest = manualEntries.mortgageInterest ?? 0
  categories.push({
    name: 'Mortgage Interest',
    type: 'mortgage',
    amount: mortgageInterest,
    fromTransactions: 0,
    manualEntry: mortgageInterest,
    notes: 'From Form 1098'
  })

  // Home Office (if applicable)
  // Business Mileage (if applicable)
  // ...

  // Calculate totals
  const totalItemized = categories.reduce((sum, cat) => sum + cat.amount, 0)
  const standardDeduction = getStandardDeduction(filingStatus, taxYear)

  return {
    categories,
    totalItemized,
    standardDeduction,
    recommendation: totalItemized > standardDeduction ? 'itemized' : 'standard',
    itemizedAdvantage: totalItemized - standardDeduction,
    saltCapWarning: saltTotal > SALT_CAP,
    medicalThresholdMet: medicalTotal > medicalThreshold
  }
}
```

## Estimated Tax Calculator

```typescript
// lib/tax/estimated-tax.ts

interface EstimatedTaxInput {
  filingStatus: FilingStatus
  taxYear: number

  // Income
  projectedIncome1099: number
  w2Income: number
  w2Withholding: number
  otherIncome: number

  // Prior Year
  priorYearTax: number
  priorYearAGI: number

  // Payments Made
  q1Payment: number
  q2Payment: number
  q3Payment: number
  q4Payment: number
}

interface EstimatedTaxResult {
  projectedTax: number
  totalWithholding: number
  estimatedPaymentsMade: number
  remainingTax: number

  // Safe Harbor
  safeHarborOption1: number  // 100% of prior year (110% if AGI > $150k)
  safeHarborOption2: number  // 90% of current year
  safeHarborTarget: number   // Lower of the two

  // Quarterly Schedule
  schedule: QuarterlyPayment[]

  // Recommendations
  recommendation: string
  w4Adjustment?: string
  penaltyRisk: 'none' | 'low' | 'medium' | 'high'
  estimatedPenalty: number
}

interface QuarterlyPayment {
  quarter: 1 | 2 | 3 | 4
  dueDate: Date
  requiredAmount: number
  paidAmount: number
  remaining: number
  isPastDue: boolean
}

const QUARTERLY_DUE_DATES = {
  1: { month: 4, day: 15 },   // April 15
  2: { month: 6, day: 15 },   // June 15
  3: { month: 9, day: 15 },   // September 15
  4: { month: 1, day: 15 },   // January 15 (next year)
}

export function calculateEstimatedTax(input: EstimatedTaxInput): EstimatedTaxResult {
  // Step 1: Calculate Projected Tax
  const taxResult = calculateFederalTax({
    filingStatus: input.filingStatus,
    taxYear: input.taxYear,
    w2Wages: input.w2Income,
    w2Withholding: input.w2Withholding,
    income1099: input.projectedIncome1099,
    // ... other income defaults
    useStandardDeduction: true,
    dependentsUnder17: 0,
    dependents17Plus: 0,
    otherCredits: 0,
    age: 40 // Default, should come from profile
  })

  const projectedTax = taxResult.totalTax
  const totalWithholding = input.w2Withholding
  const estimatedPaymentsMade = input.q1Payment + input.q2Payment + input.q3Payment + input.q4Payment
  const remainingTax = projectedTax - totalWithholding - estimatedPaymentsMade

  // Step 2: Calculate Safe Harbor
  const isHighIncome = input.priorYearAGI > 150000
  const safeHarborOption1 = input.priorYearTax * (isHighIncome ? 1.1 : 1.0)
  const safeHarborOption2 = projectedTax * 0.9
  const safeHarborTarget = Math.min(safeHarborOption1, safeHarborOption2)

  // Step 3: Calculate Quarterly Schedule
  const quarterlyAmount = safeHarborTarget / 4
  const today = new Date()
  const taxYear = input.taxYear

  const schedule: QuarterlyPayment[] = [
    {
      quarter: 1,
      dueDate: new Date(taxYear, 3, 15),
      requiredAmount: quarterlyAmount,
      paidAmount: input.q1Payment,
      remaining: Math.max(0, quarterlyAmount - input.q1Payment),
      isPastDue: today > new Date(taxYear, 3, 15) && input.q1Payment < quarterlyAmount
    },
    {
      quarter: 2,
      dueDate: new Date(taxYear, 5, 15),
      requiredAmount: quarterlyAmount,
      paidAmount: input.q2Payment,
      remaining: Math.max(0, quarterlyAmount - input.q2Payment),
      isPastDue: today > new Date(taxYear, 5, 15) && input.q2Payment < quarterlyAmount
    },
    {
      quarter: 3,
      dueDate: new Date(taxYear, 8, 15),
      requiredAmount: quarterlyAmount,
      paidAmount: input.q3Payment,
      remaining: Math.max(0, quarterlyAmount - input.q3Payment),
      isPastDue: today > new Date(taxYear, 8, 15) && input.q3Payment < quarterlyAmount
    },
    {
      quarter: 4,
      dueDate: new Date(taxYear + 1, 0, 15),
      requiredAmount: quarterlyAmount,
      paidAmount: input.q4Payment,
      remaining: Math.max(0, quarterlyAmount - input.q4Payment),
      isPastDue: today > new Date(taxYear + 1, 0, 15) && input.q4Payment < quarterlyAmount
    }
  ]

  // Step 4: Estimate Penalty Risk
  const totalPaid = totalWithholding + estimatedPaymentsMade
  const percentagePaid = totalPaid / projectedTax

  let penaltyRisk: 'none' | 'low' | 'medium' | 'high'
  if (percentagePaid >= 0.9 || totalPaid >= safeHarborTarget) {
    penaltyRisk = 'none'
  } else if (percentagePaid >= 0.8) {
    penaltyRisk = 'low'
  } else if (percentagePaid >= 0.6) {
    penaltyRisk = 'medium'
  } else {
    penaltyRisk = 'high'
  }

  // Step 5: Generate Recommendations
  let recommendation = ''
  let w4Adjustment: string | undefined

  if (remainingTax > 0) {
    if (remainingTax > 5000) {
      recommendation = `You're projected to owe $${remainingTax.toFixed(0)}. Consider making estimated payments or adjusting your W4.`

      // Calculate W4 adjustment
      const monthsRemaining = 12 - today.getMonth()
      const payPeriodsRemaining = monthsRemaining * 2 // Assume bi-weekly
      const additionalPerPaycheck = remainingTax / payPeriodsRemaining
      w4Adjustment = `Increase W4 withholding by $${additionalPerPaycheck.toFixed(0)} per paycheck`
    } else {
      recommendation = `You're on track but may owe $${remainingTax.toFixed(0)} at tax time.`
    }
  } else {
    recommendation = `You're on track for a refund of approximately $${Math.abs(remainingTax).toFixed(0)}.`
  }

  return {
    projectedTax,
    totalWithholding,
    estimatedPaymentsMade,
    remainingTax,
    safeHarborOption1,
    safeHarborOption2,
    safeHarborTarget,
    schedule,
    recommendation,
    w4Adjustment,
    penaltyRisk,
    estimatedPenalty: calculateUnderpaymentPenalty(schedule)
  }
}
```

## Server Actions

```typescript
// actions/tax-projections.ts
'use server'

export async function getTaxProjection(taxYear?: number): Promise<TaxProjection> {
  const session = await getSession()
  if (!session) throw new AuthError()

  const year = taxYear ?? new Date().getFullYear()

  // Get user profile for filing status
  const profile = await getUserProfile(session.user.id)

  // Get income entries
  const incomeEntries = await getIncomeEntries(session.user.id, year)

  // Get deduction data
  const deductions = calculateDeductions(session.user.id, year, profile.filing_status)

  // Calculate federal tax
  const federalResult = calculateFederalTax({
    filingStatus: profile.filing_status,
    taxYear: year,
    w2Wages: incomeEntries.w2Total,
    w2Withholding: incomeEntries.w2Withholding,
    income1099: incomeEntries.income1099,
    interestIncome: incomeEntries.interest,
    qualifiedDividends: incomeEntries.qualifiedDividends,
    ordinaryDividends: incomeEntries.ordinaryDividends,
    shortTermCapitalGains: incomeEntries.shortTermGains,
    longTermCapitalGains: incomeEntries.longTermGains,
    otherIncome: incomeEntries.other,
    itemizedDeductions: deductions.totalItemized,
    useStandardDeduction: deductions.recommendation === 'standard',
    dependentsUnder17: profile.dependents_under_17,
    dependents17Plus: profile.dependents_17_plus,
    otherCredits: 0,
    age: calculateAge(profile.date_of_birth)
  })

  // Calculate Wisconsin tax
  const wisconsinResult = calculateWisconsinTax({
    filingStatus: profile.filing_status,
    taxYear: year,
    federalAGI: federalResult.adjustedGrossIncome,
    wisconsinAdditions: 0,
    wisconsinSubtractions: 0,
    itemizedDeductions: deductions.totalItemized
  })

  return {
    federal: federalResult,
    wisconsin: wisconsinResult,
    combined: {
      totalTax: federalResult.totalTax + wisconsinResult.totalTax,
      totalWithholding: federalResult.totalWithholding + wisconsinResult.withholding,
      amountOwed: federalResult.amountOwed + wisconsinResult.amountOwed,
      effectiveRate: (federalResult.totalTax + wisconsinResult.totalTax) / federalResult.grossIncome
    },
    deductions
  }
}

// actions/tax-income.ts
'use server'

export async function addIncomeEntry(formData: FormData): Promise<void> {
  const session = await getSession()
  if (!session) throw new AuthError()

  const data = incomeEntrySchema.parse({
    type: formData.get('type'),
    source: formData.get('source'),
    amount: parseFloat(formData.get('amount') as string),
    withholding: parseFloat(formData.get('withholding') as string) || 0,
    taxYear: parseInt(formData.get('taxYear') as string),
    documentId: formData.get('documentId')
  })

  await db.from('tax_income_entries').insert({
    user_id: session.user.id,
    ...data
  })

  revalidatePath('/tax-center')
}

export async function getIncomeSummary(taxYear: number): Promise<IncomeSummary> {
  const session = await getSession()
  if (!session) throw new AuthError()

  const entries = await db
    .from('tax_income_entries')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('tax_year', taxYear)

  return {
    w2Total: sumByType(entries.data, 'w2'),
    w2Withholding: sumWithholding(entries.data, 'w2'),
    income1099: sumByType(entries.data, '1099'),
    interest: sumByType(entries.data, 'interest'),
    dividends: sumByType(entries.data, 'dividends'),
    capitalGains: sumByType(entries.data, 'capital_gains'),
    other: sumByType(entries.data, 'other'),
    total: entries.data?.reduce((sum, e) => sum + e.amount, 0) ?? 0
  }
}
```

## UI Components

```typescript
// components/features/tax-planning/tax-projection-dashboard.tsx

export function TaxProjectionDashboard({ projection }: { projection: TaxProjection }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Projected Federal Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${formatCurrency(projection.federal.totalTax)}</p>
            <p className="text-sm text-muted-foreground">
              Effective rate: {(projection.federal.effectiveRate * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projected Wisconsin Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${formatCurrency(projection.wisconsin.totalTax)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>You Will</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn(
              "text-3xl font-bold",
              projection.combined.amountOwed > 0 ? "text-red-500" : "text-green-500"
            )}>
              {projection.combined.amountOwed > 0 ? 'Owe' : 'Get Refund'}
            </p>
            <p className="text-2xl">${formatCurrency(Math.abs(projection.combined.amountOwed))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Marginal Rate Display */}
      <MarginalRateDisplay
        rate={projection.federal.marginalRate}
        bracket={projection.federal.marginalBracket}
      />

      {/* Deduction Comparison */}
      <ItemizeComparison deductions={projection.deductions} />

      {/* Income Breakdown */}
      <IncomeSummary />
    </div>
  )
}
```

## API Routes

```typescript
// app/api/tax/projection/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get('year')
    ? parseInt(searchParams.get('year')!)
    : new Date().getFullYear()

  const projection = await getTaxProjection(year)
  return NextResponse.json(projection)
}
```

## Key Components Summary

| Component | Purpose |
|-----------|---------|
| `federal-calculator.ts` | Federal tax calculation with brackets |
| `wisconsin-calculator.ts` | Wisconsin state tax calculation |
| `self-employment-tax.ts` | SE tax (Social Security + Medicare) |
| `deduction-calculator.ts` | Deduction tracking and comparison |
| `estimated-tax.ts` | Quarterly payment calculation |
| `tax-projection-dashboard.tsx` | Main tax overview UI |
| `itemize-comparison.tsx` | Standard vs itemized display |
| `estimated-tax-calculator.tsx` | Quarterly payment UI |
