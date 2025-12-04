'use server'

/**
 * Tax Projections Server Actions
 *
 * Provides server-side tax calculation functions including:
 * - Complete federal tax calculations
 * - Marginal rate lookups
 * - Tax projections and scenarios
 */

import type { ActionResult } from '@/types'
import type { FilingStatus } from '@/lib/tax/federal-calculator'
import {
  calculateCompleteFederalTax,
  getMarginalRate,
  calculateTaxableIncome,
} from '@/lib/tax/federal-calculator'
import { calculateSelfEmploymentTax } from '@/lib/tax/self-employment-tax'
import { calculateCapitalGainsTax } from '@/lib/tax/capital-gains-tax'
import { calculateTotalFederalCredits } from '@/lib/tax/tax-credits'

export interface TaxCalculationInput {
  grossIncome: number
  filingStatus: FilingStatus
  itemizedDeductions?: number
  adjustments?: number
  selfEmploymentIncome?: number
  capitalGains?: {
    longTerm?: number
    shortTerm?: number
  }
  qualifiedDividends?: number
  numberOfChildren?: number
  childCareExpenses?: number
  w2Wages?: number
}

export interface TaxCalculationResult {
  grossIncome: number
  adjustedGrossIncome: number
  taxableIncome: number
  federalIncomeTax: number
  selfEmploymentTax: number
  capitalGainsTax: number
  totalTaxBeforeCredits: number
  totalCredits: number
  totalTaxLiability: number
  effectiveRate: number
  marginalRate: number
  breakdown: {
    ordinaryIncomeTax: number
    selfEmploymentTax: number
    capitalGainsTax: number
    netInvestmentIncomeTax: number
    credits: {
      childTaxCredit: number
      eitc: number
      childCareCredit: number
    }
  }
}

/**
 * Calculate complete federal tax liability
 */
export async function calculateFederalTax(
  input: TaxCalculationInput
): Promise<ActionResult<TaxCalculationResult>> {
  try {
    const {
      grossIncome,
      filingStatus,
      itemizedDeductions = 0,
      adjustments = 0,
      selfEmploymentIncome = 0,
      capitalGains = {},
      qualifiedDividends = 0,
      numberOfChildren = 0,
      childCareExpenses = 0,
      w2Wages = 0,
    } = input

    // Step 1: Calculate self-employment tax and deduction
    const seTaxCalc = calculateSelfEmploymentTax(selfEmploymentIncome, filingStatus, w2Wages)
    const seTaxDeduction = seTaxCalc.deductiblePortion

    // Step 2: Calculate AGI
    const totalAdjustments = adjustments + seTaxDeduction
    const agi = grossIncome - totalAdjustments

    // Step 3: Calculate taxable income (before capital gains)
    const ordinaryIncome = grossIncome - selfEmploymentIncome - (capitalGains.longTerm ?? 0)
    const taxableOrdinaryIncome = calculateTaxableIncome(
      ordinaryIncome,
      filingStatus,
      itemizedDeductions,
      totalAdjustments
    )

    // Step 4: Calculate ordinary income tax
    const ordinaryTaxCalc = calculateCompleteFederalTax({
      grossIncome: ordinaryIncome,
      filingStatus,
      itemizedDeductions,
      adjustments: totalAdjustments,
    })

    // Step 5: Calculate capital gains tax
    const capitalGainsTaxCalc = calculateCapitalGainsTax(
      taxableOrdinaryIncome,
      capitalGains.longTerm ?? 0,
      qualifiedDividends,
      filingStatus
    )

    // Step 6: Calculate total tax before credits
    const totalTaxBeforeCredits =
      ordinaryTaxCalc.totalTax + seTaxCalc.totalSelfEmploymentTax + capitalGainsTaxCalc.totalTax

    // Step 7: Calculate credits
    const earnedIncome = w2Wages + selfEmploymentIncome
    const capitalGainsIncome = (capitalGains.longTerm ?? 0) + (capitalGains.shortTerm ?? 0)
    const investmentIncome = capitalGainsIncome + qualifiedDividends

    const creditsCalc = calculateTotalFederalCredits({
      numberOfChildren,
      agi,
      earnedIncome,
      filingStatus,
      taxLiability: totalTaxBeforeCredits,
      childCareExpenses,
      investmentIncome,
    })

    // Step 8: Calculate final tax liability
    const totalTaxLiability = Math.max(
      0,
      totalTaxBeforeCredits - creditsCalc.totalNonRefundableCredits
    )

    // Step 9: Calculate effective rate
    const effectiveRate = grossIncome > 0 ? totalTaxLiability / grossIncome : 0

    // Step 10: Get marginal rate
    const taxableIncome = calculateTaxableIncome(
      grossIncome,
      filingStatus,
      itemizedDeductions,
      totalAdjustments
    )
    const marginalRate = getMarginalRate(taxableIncome, filingStatus)

    return {
      success: true,
      data: {
        grossIncome,
        adjustedGrossIncome: agi,
        taxableIncome,
        federalIncomeTax: ordinaryTaxCalc.totalTax,
        selfEmploymentTax: seTaxCalc.totalSelfEmploymentTax,
        capitalGainsTax: capitalGainsTaxCalc.totalTax,
        totalTaxBeforeCredits,
        totalCredits: creditsCalc.totalCredits,
        totalTaxLiability,
        effectiveRate,
        marginalRate,
        breakdown: {
          ordinaryIncomeTax: ordinaryTaxCalc.totalTax,
          selfEmploymentTax: seTaxCalc.totalSelfEmploymentTax,
          capitalGainsTax: capitalGainsTaxCalc.capitalGainsTax,
          netInvestmentIncomeTax: capitalGainsTaxCalc.netInvestmentIncomeTax,
          credits: {
            childTaxCredit: creditsCalc.childTaxCredit.totalCredit,
            eitc: creditsCalc.eitc.actualCredit,
            childCareCredit: creditsCalc.childCareCredit.credit,
          },
        },
      },
    }
  } catch (error) {
    console.error('Error calculating federal tax:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate federal tax',
    }
  }
}

/**
 * Get marginal tax rate for a given income level
 */
export async function getMarginalTaxRate(
  income: number,
  filingStatus: FilingStatus
): Promise<ActionResult<{ marginalRate: number; ratePercentage: string }>> {
  try {
    const marginalRate = getMarginalRate(income, filingStatus)

    return {
      success: true,
      data: {
        marginalRate,
        ratePercentage: `${(marginalRate * 100).toFixed(1)}%`,
      },
    }
  } catch (error) {
    console.error('Error getting marginal rate:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get marginal rate',
    }
  }
}

/**
 * Calculate tax projection scenarios (e.g., impact of additional income)
 */
export async function calculateTaxScenario(
  baseInput: TaxCalculationInput,
  additionalIncome: number
): Promise<
  ActionResult<{
    baseTax: TaxCalculationResult
    scenarioTax: TaxCalculationResult
    difference: {
      additionalTax: number
      marginalRateOnIncrease: number
    }
  }>
> {
  try {
    const baseTaxResult = await calculateFederalTax(baseInput)
    if (!baseTaxResult.success) {
      return baseTaxResult as ActionResult<never>
    }

    const scenarioInput = {
      ...baseInput,
      grossIncome: baseInput.grossIncome + additionalIncome,
    }

    const scenarioTaxResult = await calculateFederalTax(scenarioInput)
    if (!scenarioTaxResult.success) {
      return scenarioTaxResult as ActionResult<never>
    }

    const additionalTax =
      scenarioTaxResult.data.totalTaxLiability - baseTaxResult.data.totalTaxLiability

    const marginalRateOnIncrease = additionalIncome > 0 ? additionalTax / additionalIncome : 0

    return {
      success: true,
      data: {
        baseTax: baseTaxResult.data,
        scenarioTax: scenarioTaxResult.data,
        difference: {
          additionalTax,
          marginalRateOnIncrease,
        },
      },
    }
  } catch (error) {
    console.error('Error calculating tax scenario:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate tax scenario',
    }
  }
}

/**
 * Calculate quarterly estimated tax payments
 */
export async function calculateQuarterlyPayments(
  input: TaxCalculationInput,
  priorYearTax?: number
): Promise<
  ActionResult<{
    annualTax: number
    quarterlyPayment: number
    safeHarborMinimum: number
    recommendedPayment: number
  }>
> {
  try {
    const taxResult = await calculateFederalTax(input)
    if (!taxResult.success) {
      return taxResult as ActionResult<never>
    }

    const annualTax = taxResult.data.totalTaxLiability
    const quarterlyPayment = annualTax / 4

    // Safe harbor: 90% of current year or 100% of prior year (110% if AGI > $150K)
    let safeHarborMinimum = annualTax * 0.9

    if (priorYearTax) {
      const priorYearMultiplier = input.grossIncome > 150000 ? 1.1 : 1.0
      const priorYearSafeHarbor = priorYearTax * priorYearMultiplier
      safeHarborMinimum = Math.min(safeHarborMinimum, priorYearSafeHarbor)
    }

    const recommendedPayment = Math.max(quarterlyPayment, safeHarborMinimum / 4)

    return {
      success: true,
      data: {
        annualTax,
        quarterlyPayment,
        safeHarborMinimum,
        recommendedPayment,
      },
    }
  } catch (error) {
    console.error('Error calculating quarterly payments:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate quarterly payments',
    }
  }
}
