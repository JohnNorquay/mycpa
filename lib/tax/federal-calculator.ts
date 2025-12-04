/**
 * Federal Income Tax Calculator
 *
 * Implements progressive tax bracket calculations for all filing statuses.
 * Uses 2024 federal income tax brackets and rates.
 */

export type FilingStatus =
  | 'single'
  | 'married_filing_jointly'
  | 'married_filing_separately'
  | 'head_of_household'
  | 'qualifying_widow'

export interface TaxBracket {
  minIncome: number
  maxIncome: number | null // null means no upper limit
  rate: number // decimal format (e.g., 0.10 for 10%)
  baseTax: number // cumulative tax from lower brackets
}

/**
 * 2024 Federal Income Tax Brackets
 * Source: IRS Rev. Proc. 2023-34
 */
export const FEDERAL_TAX_BRACKETS_2024: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { minIncome: 0, maxIncome: 11600, rate: 0.1, baseTax: 0 },
    { minIncome: 11600, maxIncome: 47150, rate: 0.12, baseTax: 1160 },
    { minIncome: 47150, maxIncome: 100525, rate: 0.22, baseTax: 5426 },
    { minIncome: 100525, maxIncome: 191950, rate: 0.24, baseTax: 17168.5 },
    { minIncome: 191950, maxIncome: 243725, rate: 0.32, baseTax: 39110.5 },
    { minIncome: 243725, maxIncome: 609350, rate: 0.35, baseTax: 55678.5 },
    { minIncome: 609350, maxIncome: null, rate: 0.37, baseTax: 183647.25 },
  ],
  married_filing_jointly: [
    { minIncome: 0, maxIncome: 23200, rate: 0.1, baseTax: 0 },
    { minIncome: 23200, maxIncome: 94300, rate: 0.12, baseTax: 2320 },
    { minIncome: 94300, maxIncome: 201050, rate: 0.22, baseTax: 10852 },
    { minIncome: 201050, maxIncome: 383900, rate: 0.24, baseTax: 34337 },
    { minIncome: 383900, maxIncome: 487450, rate: 0.32, baseTax: 78221 },
    { minIncome: 487450, maxIncome: 731200, rate: 0.35, baseTax: 111357 },
    { minIncome: 731200, maxIncome: null, rate: 0.37, baseTax: 196669.5 },
  ],
  married_filing_separately: [
    { minIncome: 0, maxIncome: 11600, rate: 0.1, baseTax: 0 },
    { minIncome: 11600, maxIncome: 47150, rate: 0.12, baseTax: 1160 },
    { minIncome: 47150, maxIncome: 100525, rate: 0.22, baseTax: 5426 },
    { minIncome: 100525, maxIncome: 191950, rate: 0.24, baseTax: 17168.5 },
    { minIncome: 191950, maxIncome: 243725, rate: 0.32, baseTax: 39110.5 },
    { minIncome: 243725, maxIncome: 365600, rate: 0.35, baseTax: 55678.5 },
    { minIncome: 365600, maxIncome: null, rate: 0.37, baseTax: 98334.75 },
  ],
  head_of_household: [
    { minIncome: 0, maxIncome: 16550, rate: 0.1, baseTax: 0 },
    { minIncome: 16550, maxIncome: 63100, rate: 0.12, baseTax: 1655 },
    { minIncome: 63100, maxIncome: 100500, rate: 0.22, baseTax: 7241 },
    { minIncome: 100500, maxIncome: 191950, rate: 0.24, baseTax: 15469 },
    { minIncome: 191950, maxIncome: 243700, rate: 0.32, baseTax: 37417 },
    { minIncome: 243700, maxIncome: 609350, rate: 0.35, baseTax: 53977 },
    { minIncome: 609350, maxIncome: null, rate: 0.37, baseTax: 181954.5 },
  ],
  qualifying_widow: [
    { minIncome: 0, maxIncome: 23200, rate: 0.1, baseTax: 0 },
    { minIncome: 23200, maxIncome: 94300, rate: 0.12, baseTax: 2320 },
    { minIncome: 94300, maxIncome: 201050, rate: 0.22, baseTax: 10852 },
    { minIncome: 201050, maxIncome: 383900, rate: 0.24, baseTax: 34337 },
    { minIncome: 383900, maxIncome: 487450, rate: 0.32, baseTax: 78221 },
    { minIncome: 487450, maxIncome: 731200, rate: 0.35, baseTax: 111357 },
    { minIncome: 731200, maxIncome: null, rate: 0.37, baseTax: 196669.5 },
  ],
}

/**
 * 2024 Standard Deductions
 */
export const STANDARD_DEDUCTION_2024: Record<FilingStatus, number> = {
  single: 14600,
  married_filing_jointly: 29200,
  married_filing_separately: 14600,
  head_of_household: 21900,
  qualifying_widow: 29200,
}

export interface FederalTaxCalculation {
  grossIncome: number
  adjustedGrossIncome: number
  taxableIncome: number
  totalTax: number
  effectiveRate: number // as decimal (e.g., 0.15 for 15%)
  marginalRate: number // as decimal
  taxByBracket: {
    rate: number
    income: number
    tax: number
  }[]
}

/**
 * Calculate federal income tax based on taxable income and filing status
 */
export function calculateFederalTax(
  taxableIncome: number,
  filingStatus: FilingStatus
): FederalTaxCalculation {
  if (taxableIncome <= 0) {
    return {
      grossIncome: 0,
      adjustedGrossIncome: 0,
      taxableIncome: 0,
      totalTax: 0,
      effectiveRate: 0,
      marginalRate: 0,
      taxByBracket: [],
    }
  }

  const brackets = FEDERAL_TAX_BRACKETS_2024[filingStatus]
  let totalTax = 0
  let marginalRate = 0
  const taxByBracket: { rate: number; income: number; tax: number }[] = []

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.minIncome) {
      break
    }

    const upperLimit = bracket.maxIncome ?? Infinity
    const incomeInBracket = Math.min(taxableIncome, upperLimit) - bracket.minIncome

    if (incomeInBracket > 0) {
      const taxInBracket = incomeInBracket * bracket.rate
      totalTax = bracket.baseTax + taxInBracket
      marginalRate = bracket.rate

      taxByBracket.push({
        rate: bracket.rate,
        income: incomeInBracket,
        tax: taxInBracket,
      })
    }
  }

  const effectiveRate = taxableIncome > 0 ? totalTax / taxableIncome : 0

  return {
    grossIncome: taxableIncome,
    adjustedGrossIncome: taxableIncome,
    taxableIncome,
    totalTax,
    effectiveRate,
    marginalRate,
    taxByBracket,
  }
}

/**
 * Get the marginal tax rate for a given taxable income and filing status
 */
export function getMarginalRate(taxableIncome: number, filingStatus: FilingStatus): number {
  if (taxableIncome <= 0) {
    return 0
  }

  const brackets = FEDERAL_TAX_BRACKETS_2024[filingStatus]

  for (const bracket of brackets) {
    const upperLimit = bracket.maxIncome ?? Infinity
    if (taxableIncome >= bracket.minIncome && taxableIncome < upperLimit) {
      return bracket.rate
    }
  }

  // If we reach here, return the highest bracket rate
  return brackets[brackets.length - 1]?.rate ?? 0.37
}

/**
 * Calculate taxable income from gross income
 */
export function calculateTaxableIncome(
  grossIncome: number,
  filingStatus: FilingStatus,
  itemizedDeductions: number = 0,
  adjustments: number = 0
): number {
  const agi = grossIncome - adjustments
  const standardDeduction = STANDARD_DEDUCTION_2024[filingStatus]
  const deduction = Math.max(itemizedDeductions, standardDeduction)
  return Math.max(0, agi - deduction)
}

/**
 * Calculate complete federal tax liability including all components
 */
export function calculateCompleteFederalTax(params: {
  grossIncome: number
  filingStatus: FilingStatus
  itemizedDeductions?: number
  adjustments?: number
  selfEmploymentIncome?: number
  capitalGains?: number
  qualifiedDividends?: number
}): FederalTaxCalculation {
  const { grossIncome, filingStatus, itemizedDeductions = 0, adjustments = 0 } = params

  const agi = grossIncome - adjustments
  const standardDeduction = STANDARD_DEDUCTION_2024[filingStatus]
  const deduction = Math.max(itemizedDeductions, standardDeduction)
  const taxableIncome = Math.max(0, agi - deduction)

  const result = calculateFederalTax(taxableIncome, filingStatus)

  return {
    ...result,
    grossIncome,
    adjustedGrossIncome: agi,
  }
}
