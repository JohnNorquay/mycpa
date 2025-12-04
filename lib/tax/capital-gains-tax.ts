/**
 * Capital Gains Tax Calculator
 *
 * Implements capital gains tax calculations including:
 * - Long-term capital gains (0%, 15%, 20% rates)
 * - Qualified dividends (same rates as long-term capital gains)
 * - Net Investment Income Tax (3.8% surtax)
 * - Integration with ordinary income for rate determination
 *
 * 2024 Tax Year
 */

import type { FilingStatus } from './federal-calculator'

/**
 * 2024 Long-Term Capital Gains Tax Brackets
 */
export const LONG_TERM_CAPITAL_GAINS_BRACKETS_2024: Record<
  FilingStatus,
  { maxIncome: number | null; rate: number }[]
> = {
  single: [
    { maxIncome: 47025, rate: 0.0 }, // 0% rate
    { maxIncome: 518900, rate: 0.15 }, // 15% rate
    { maxIncome: null, rate: 0.2 }, // 20% rate
  ],
  married_filing_jointly: [
    { maxIncome: 94050, rate: 0.0 },
    { maxIncome: 583750, rate: 0.15 },
    { maxIncome: null, rate: 0.2 },
  ],
  married_filing_separately: [
    { maxIncome: 47025, rate: 0.0 },
    { maxIncome: 291850, rate: 0.15 },
    { maxIncome: null, rate: 0.2 },
  ],
  head_of_household: [
    { maxIncome: 63000, rate: 0.0 },
    { maxIncome: 551350, rate: 0.15 },
    { maxIncome: null, rate: 0.2 },
  ],
  qualifying_widow: [
    { maxIncome: 94050, rate: 0.0 },
    { maxIncome: 583750, rate: 0.15 },
    { maxIncome: null, rate: 0.2 },
  ],
}

/**
 * Net Investment Income Tax (NIIT) Thresholds - 3.8% surtax
 * Applied to the lesser of:
 * 1. Net investment income, or
 * 2. MAGI over the threshold
 */
export const NIIT_THRESHOLDS_2024: Record<FilingStatus, number> = {
  single: 200000,
  married_filing_jointly: 250000,
  married_filing_separately: 125000,
  head_of_household: 200000,
  qualifying_widow: 250000,
}

export const NIIT_RATE = 0.038 // 3.8%

export interface CapitalGainsTaxCalculation {
  longTermCapitalGains: number
  qualifiedDividends: number
  totalPreferentialIncome: number
  ordinaryIncome: number
  totalIncome: number
  capitalGainsTax: number
  capitalGainsRate: number // Effective rate on capital gains
  netInvestmentIncomeTax: number
  totalTax: number
  breakdown: {
    at0Percent: number
    at15Percent: number
    at20Percent: number
  }
}

/**
 * Calculate capital gains tax rate based on total taxable income
 */
export function getCapitalGainsRate(taxableIncome: number, filingStatus: FilingStatus): number {
  const brackets = LONG_TERM_CAPITAL_GAINS_BRACKETS_2024[filingStatus]

  for (const bracket of brackets) {
    if (bracket.maxIncome === null || taxableIncome <= bracket.maxIncome) {
      return bracket.rate
    }
  }

  // Should never reach here, but return highest rate as fallback
  return brackets[brackets.length - 1].rate
}

/**
 * Calculate capital gains tax with proper stacking on top of ordinary income
 */
export function calculateCapitalGainsTax(
  ordinaryIncome: number,
  longTermCapitalGains: number,
  qualifiedDividends: number,
  filingStatus: FilingStatus
): CapitalGainsTaxCalculation {
  const totalPreferentialIncome = longTermCapitalGains + qualifiedDividends
  const totalIncome = ordinaryIncome + totalPreferentialIncome

  if (totalPreferentialIncome <= 0) {
    return {
      longTermCapitalGains,
      qualifiedDividends,
      totalPreferentialIncome,
      ordinaryIncome,
      totalIncome,
      capitalGainsTax: 0,
      capitalGainsRate: 0,
      netInvestmentIncomeTax: 0,
      totalTax: 0,
      breakdown: {
        at0Percent: 0,
        at15Percent: 0,
        at20Percent: 0,
      },
    }
  }

  const brackets = LONG_TERM_CAPITAL_GAINS_BRACKETS_2024[filingStatus]

  let remainingGains = totalPreferentialIncome
  let currentIncome = ordinaryIncome
  let totalCapitalGainsTax = 0

  const breakdown = {
    at0Percent: 0,
    at15Percent: 0,
    at20Percent: 0,
  }

  // Stack capital gains on top of ordinary income and calculate tax for each bracket
  for (let i = 0; i < brackets.length && remainingGains > 0; i++) {
    const bracket = brackets[i]
    const bracketMax = bracket.maxIncome ?? Infinity

    if (currentIncome >= bracketMax) {
      // Already past this bracket, continue to next
      continue
    }

    // Calculate how much room is left in this bracket
    const roomInBracket = bracketMax - currentIncome
    const gainsInBracket = Math.min(remainingGains, roomInBracket)

    // Calculate tax on gains in this bracket
    const taxInBracket = gainsInBracket * bracket.rate
    totalCapitalGainsTax += taxInBracket

    // Track breakdown by rate
    if (bracket.rate === 0) {
      breakdown.at0Percent += gainsInBracket
    } else if (bracket.rate === 0.15) {
      breakdown.at15Percent += gainsInBracket
    } else if (bracket.rate === 0.2) {
      breakdown.at20Percent += gainsInBracket
    }

    // Update tracking variables
    remainingGains -= gainsInBracket
    currentIncome += gainsInBracket
  }

  const capitalGainsRate =
    totalPreferentialIncome > 0 ? totalCapitalGainsTax / totalPreferentialIncome : 0

  // Calculate Net Investment Income Tax (NIIT)
  const niit = calculateNetInvestmentIncomeTax(totalPreferentialIncome, totalIncome, filingStatus)

  return {
    longTermCapitalGains,
    qualifiedDividends,
    totalPreferentialIncome,
    ordinaryIncome,
    totalIncome,
    capitalGainsTax: totalCapitalGainsTax,
    capitalGainsRate,
    netInvestmentIncomeTax: niit,
    totalTax: totalCapitalGainsTax + niit,
    breakdown,
  }
}

/**
 * Calculate Net Investment Income Tax (3.8% surtax)
 */
export function calculateNetInvestmentIncomeTax(
  netInvestmentIncome: number,
  modifiedAGI: number,
  filingStatus: FilingStatus
): number {
  if (netInvestmentIncome <= 0) {
    return 0
  }

  const threshold = NIIT_THRESHOLDS_2024[filingStatus]
  const excessMAGI = Math.max(0, modifiedAGI - threshold)

  if (excessMAGI <= 0) {
    return 0
  }

  // NIIT is 3.8% of the lesser of:
  // 1. Net investment income, or
  // 2. MAGI over the threshold
  const taxableAmount = Math.min(netInvestmentIncome, excessMAGI)
  return taxableAmount * NIIT_RATE
}

/**
 * Determine if income qualifies for qualified dividend treatment
 * This is a simplified check - actual qualification requires holding period and other criteria
 */
export function areQualifiedDividends(
  dividends: number,
  holdingPeriodMet: boolean = true
): boolean {
  return dividends > 0 && holdingPeriodMet
}

/**
 * Calculate tax on short-term capital gains (taxed as ordinary income)
 */
export function calculateShortTermCapitalGainsTax(
  shortTermGains: number,
  marginalRate: number
): number {
  return Math.max(0, shortTermGains) * marginalRate
}

/**
 * Calculate total capital gains and dividends tax including both long and short term
 */
export function calculateTotalCapitalGainsTax(params: {
  ordinaryIncome: number
  longTermCapitalGains: number
  shortTermCapitalGains: number
  qualifiedDividends: number
  nonQualifiedDividends: number
  filingStatus: FilingStatus
  marginalOrdinaryRate: number
}): {
  longTermTax: number
  shortTermTax: number
  qualifiedDividendsTax: number
  nonQualifiedDividendsTax: number
  netInvestmentIncomeTax: number
  totalTax: number
} {
  const {
    ordinaryIncome,
    longTermCapitalGains,
    shortTermCapitalGains,
    qualifiedDividends,
    nonQualifiedDividends,
    filingStatus,
    marginalOrdinaryRate,
  } = params

  // Long-term gains and qualified dividends use preferential rates
  const ltcgCalc = calculateCapitalGainsTax(
    ordinaryIncome,
    longTermCapitalGains,
    qualifiedDividends,
    filingStatus
  )

  // Short-term gains and non-qualified dividends taxed as ordinary income
  const shortTermTax = Math.max(0, shortTermCapitalGains) * marginalOrdinaryRate
  const nonQualifiedDividendsTax = Math.max(0, nonQualifiedDividends) * marginalOrdinaryRate

  return {
    longTermTax: ltcgCalc.capitalGainsTax,
    shortTermTax,
    qualifiedDividendsTax: ltcgCalc.capitalGainsTax, // Included in ltcgCalc
    nonQualifiedDividendsTax,
    netInvestmentIncomeTax: ltcgCalc.netInvestmentIncomeTax,
    totalTax:
      ltcgCalc.capitalGainsTax +
      shortTermTax +
      nonQualifiedDividendsTax +
      ltcgCalc.netInvestmentIncomeTax,
  }
}
