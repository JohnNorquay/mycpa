/**
 * Wisconsin State Income Tax Calculator
 *
 * Implements Wisconsin state tax calculations including:
 * - 4-bracket progressive tax (4.0%, 5.3%, 6.27%, 7.65%)
 * - Standard deduction with income-based phase-out
 * - Wisconsin-specific adjustments and credits
 *
 * 2024 Tax Year
 */

import type { FilingStatus } from './federal-calculator'

// Wisconsin filing status mapping
export type WisconsinFilingStatus =
  | 'single'
  | 'married_joint'
  | 'married_separate'
  | 'head_of_household'

/**
 * Map federal filing status to Wisconsin filing status
 */
export function mapToWisconsinFilingStatus(federalStatus: FilingStatus): WisconsinFilingStatus {
  switch (federalStatus) {
    case 'married_filing_jointly':
    case 'qualifying_widow':
      return 'married_joint'
    case 'married_filing_separately':
      return 'married_separate'
    case 'head_of_household':
      return 'head_of_household'
    case 'single':
    default:
      return 'single'
  }
}

export interface WisconsinTaxBracket {
  minIncome: number
  maxIncome: number | null
  rate: number
  baseTax: number
}

/**
 * 2024 Wisconsin Income Tax Brackets
 */
export const WISCONSIN_TAX_BRACKETS_2024: Record<WisconsinFilingStatus, WisconsinTaxBracket[]> = {
  single: [
    { minIncome: 0, maxIncome: 13810, rate: 0.04, baseTax: 0 },
    { minIncome: 13810, maxIncome: 27630, rate: 0.053, baseTax: 552.4 },
    { minIncome: 27630, maxIncome: 304170, rate: 0.0627, baseTax: 1285.07 },
    { minIncome: 304170, maxIncome: null, rate: 0.0765, baseTax: 18621.04 },
  ],
  married_joint: [
    { minIncome: 0, maxIncome: 18410, rate: 0.04, baseTax: 0 },
    { minIncome: 18410, maxIncome: 36840, rate: 0.053, baseTax: 736.4 },
    { minIncome: 36840, maxIncome: 405550, rate: 0.0627, baseTax: 1713.19 },
    { minIncome: 405550, maxIncome: null, rate: 0.0765, baseTax: 24825.32 },
  ],
  married_separate: [
    { minIncome: 0, maxIncome: 9205, rate: 0.04, baseTax: 0 },
    { minIncome: 9205, maxIncome: 18420, rate: 0.053, baseTax: 368.2 },
    { minIncome: 18420, maxIncome: 202780, rate: 0.0627, baseTax: 856.61 },
    { minIncome: 202780, maxIncome: null, rate: 0.0765, baseTax: 12412.67 },
  ],
  head_of_household: [
    { minIncome: 0, maxIncome: 18410, rate: 0.04, baseTax: 0 },
    { minIncome: 18410, maxIncome: 36840, rate: 0.053, baseTax: 736.4 },
    { minIncome: 36840, maxIncome: 405550, rate: 0.0627, baseTax: 1713.19 },
    { minIncome: 405550, maxIncome: null, rate: 0.0765, baseTax: 24825.32 },
  ],
}

/**
 * 2024 Wisconsin Standard Deduction
 * Base amounts before phase-out
 */
export const WISCONSIN_STANDARD_DEDUCTION_2024: Record<WisconsinFilingStatus, number> = {
  single: 12760,
  married_joint: 23620,
  married_separate: 11810,
  head_of_household: 18760,
}

/**
 * Wisconsin Standard Deduction Phase-out Thresholds (2024)
 * Standard deduction phases out for high earners
 */
export const WISCONSIN_STANDARD_DEDUCTION_PHASEOUT_2024: Record<
  WisconsinFilingStatus,
  { start: number; rate: number }
> = {
  single: { start: 120760, rate: 0.1225 }, // 12.25% phase-out
  married_joint: { start: 173960, rate: 0.1225 },
  married_separate: { start: 86980, rate: 0.1225 },
  head_of_household: { start: 147010, rate: 0.1225 },
}

export interface WisconsinTaxCalculation {
  federalAGI: number
  wisconsinAdjustments: number
  wisconsinAGI: number
  standardDeduction: number
  itemizedDeduction: number
  totalDeduction: number
  wisconsinTaxableIncome: number
  totalTax: number
  effectiveRate: number
  marginalRate: number
  taxByBracket: {
    rate: number
    income: number
    tax: number
  }[]
}

/**
 * Calculate Wisconsin standard deduction with phase-out
 */
export function calculateWisconsinStandardDeduction(
  wisconsinAGI: number,
  filingStatus: WisconsinFilingStatus
): number {
  const baseDeduction = WISCONSIN_STANDARD_DEDUCTION_2024[filingStatus]
  const phaseout = WISCONSIN_STANDARD_DEDUCTION_PHASEOUT_2024[filingStatus]

  if (wisconsinAGI <= phaseout.start) {
    return baseDeduction
  }

  const excessIncome = wisconsinAGI - phaseout.start
  const phaseoutAmount = excessIncome * phaseout.rate
  const reducedDeduction = Math.max(0, baseDeduction - phaseoutAmount)

  return reducedDeduction
}

/**
 * Calculate Wisconsin state income tax
 */
export function calculateWisconsinTax(
  federalAGI: number,
  filingStatus: WisconsinFilingStatus,
  wisconsinAdjustments: number = 0,
  itemizedDeductions: number = 0
): WisconsinTaxCalculation {
  // Step 1: Calculate Wisconsin AGI
  const wisconsinAGI = federalAGI + wisconsinAdjustments

  // Step 2: Calculate deduction
  const standardDeduction = calculateWisconsinStandardDeduction(wisconsinAGI, filingStatus)
  const deduction = Math.max(standardDeduction, itemizedDeductions)

  // Step 3: Calculate taxable income
  const wisconsinTaxableIncome = Math.max(0, wisconsinAGI - deduction)

  if (wisconsinTaxableIncome <= 0) {
    return {
      federalAGI,
      wisconsinAdjustments,
      wisconsinAGI,
      standardDeduction,
      itemizedDeduction: itemizedDeductions,
      totalDeduction: deduction,
      wisconsinTaxableIncome: 0,
      totalTax: 0,
      effectiveRate: 0,
      marginalRate: 0,
      taxByBracket: [],
    }
  }

  // Step 4: Calculate tax using brackets
  const brackets = WISCONSIN_TAX_BRACKETS_2024[filingStatus]
  let totalTax = 0
  let marginalRate = 0
  const taxByBracket: { rate: number; income: number; tax: number }[] = []

  for (const bracket of brackets) {
    if (wisconsinTaxableIncome <= bracket.minIncome) {
      break
    }

    const upperLimit = bracket.maxIncome ?? Infinity
    const incomeInBracket = Math.min(wisconsinTaxableIncome, upperLimit) - bracket.minIncome

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

  const effectiveRate = wisconsinTaxableIncome > 0 ? totalTax / wisconsinTaxableIncome : 0

  return {
    federalAGI,
    wisconsinAdjustments,
    wisconsinAGI,
    standardDeduction,
    itemizedDeduction: itemizedDeductions,
    totalDeduction: deduction,
    wisconsinTaxableIncome,
    totalTax,
    effectiveRate,
    marginalRate,
    taxByBracket,
  }
}

/**
 * Get Wisconsin marginal tax rate
 */
export function getWisconsinMarginalRate(
  wisconsinTaxableIncome: number,
  filingStatus: WisconsinFilingStatus
): number {
  if (wisconsinTaxableIncome <= 0) {
    return 0
  }

  const brackets = WISCONSIN_TAX_BRACKETS_2024[filingStatus]

  for (const bracket of brackets) {
    const upperLimit = bracket.maxIncome ?? Infinity
    if (wisconsinTaxableIncome >= bracket.minIncome && wisconsinTaxableIncome < upperLimit) {
      return bracket.rate
    }
  }

  // Return highest bracket rate
  return brackets[brackets.length - 1]?.rate ?? 0.0765
}
