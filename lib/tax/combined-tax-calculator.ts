/**
 * Combined Federal and State Tax Calculator
 *
 * Provides a unified view of total tax liability combining:
 * - Federal income tax
 * - Self-employment tax
 * - Capital gains tax
 * - Federal credits
 * - Wisconsin state tax
 * - Wisconsin credits
 *
 * This gives taxpayers a complete picture of their tax situation
 */

import type { FilingStatus } from './federal-calculator'
import { calculateCompleteFederalTax, STANDARD_DEDUCTION_2024 } from './federal-calculator'
import { calculateSelfEmploymentTax } from './self-employment-tax'
import { calculateCapitalGainsTax } from './capital-gains-tax'
import { calculateTotalFederalCredits } from './tax-credits'
import {
  calculateWisconsinTax,
  mapToWisconsinFilingStatus,
  type WisconsinFilingStatus,
} from './wisconsin-calculator'
import { calculateWisconsinAdjustments } from './wisconsin-adjustments'
import { calculateTotalWisconsinCredits } from './wisconsin-credits'

export interface CombinedTaxInput {
  // Personal information
  filingStatus: FilingStatus
  numberOfChildren?: number
  age?: number

  // Income
  w2Wages?: number
  selfEmploymentIncome?: number
  capitalGains?: {
    longTerm?: number
    shortTerm?: number
  }
  qualifiedDividends?: number
  socialSecurityBenefits?: number
  retirementIncome?: number
  otherIncome?: number

  // Deductions
  itemizedDeductions?: number
  adjustments?: number

  // Credits and additional info
  childCareExpenses?: number
  investmentIncome?: number

  // Wisconsin-specific
  wisconsinPropertyTaxOrRent?: number
  isHomeowner?: boolean
  wisconsinMunicipalInterest?: number
  nonWisconsinMunicipalInterest?: number
  wisconsinTuitionExpenses?: number
}

export interface CombinedTaxResult {
  // Income summary
  totalGrossIncome: number
  federalAGI: number
  wisconsinAGI: number

  // Federal tax breakdown
  federal: {
    taxableIncome: number
    ordinaryIncomeTax: number
    selfEmploymentTax: number
    capitalGainsTax: number
    totalTaxBeforeCredits: number
    credits: {
      childTaxCredit: number
      eitc: number
      childCareCredit: number
      totalCredits: number
    }
    totalTaxLiability: number
    effectiveRate: number
    marginalRate: number
  }

  // Wisconsin tax breakdown
  wisconsin: {
    taxableIncome: number
    incomeTax: number
    credits: {
      schoolPropertyTax: number
      marriedCouple: number
      workingFamilies: number
      totalCredits: number
    }
    totalTaxLiability: number
    effectiveRate: number
    marginalRate: number
  }

  // Combined totals
  combined: {
    totalTaxLiability: number
    effectiveRate: number
    combinedMarginalRate: number
  }

  // Withholding comparison (if provided)
  withholdingAnalysis?: {
    estimatedWithholding: number
    estimatedRefund: number
    estimatedAmountDue: number
  }
}

/**
 * Calculate complete federal and Wisconsin state tax liability
 */
export function calculateCombinedTax(input: CombinedTaxInput): CombinedTaxResult {
  const {
    filingStatus,
    numberOfChildren = 0,
    age = 0,
    w2Wages = 0,
    selfEmploymentIncome = 0,
    capitalGains = {},
    qualifiedDividends = 0,
    socialSecurityBenefits = 0,
    retirementIncome = 0,
    otherIncome = 0,
    itemizedDeductions = 0,
    adjustments = 0,
    childCareExpenses = 0,
    investmentIncome = 0,
    wisconsinPropertyTaxOrRent = 0,
    isHomeowner = false,
    wisconsinMunicipalInterest = 0,
    nonWisconsinMunicipalInterest = 0,
    wisconsinTuitionExpenses = 0,
  } = input

  // Step 1: Calculate total gross income
  const totalGrossIncome =
    w2Wages +
    selfEmploymentIncome +
    (capitalGains.longTerm ?? 0) +
    (capitalGains.shortTerm ?? 0) +
    qualifiedDividends +
    socialSecurityBenefits +
    retirementIncome +
    otherIncome

  // Step 2: Calculate self-employment tax
  const seTaxCalc = calculateSelfEmploymentTax(selfEmploymentIncome, filingStatus, w2Wages)
  const seTaxDeduction = seTaxCalc.deductiblePortion

  // Step 3: Calculate federal AGI
  const totalAdjustments = adjustments + seTaxDeduction
  const federalAGI = totalGrossIncome - totalAdjustments

  // Step 4: Calculate federal ordinary income tax
  const ordinaryIncome =
    totalGrossIncome -
    (capitalGains.longTerm ?? 0) -
    (capitalGains.shortTerm ?? 0) -
    qualifiedDividends

  const federalOrdinaryTaxCalc = calculateCompleteFederalTax({
    grossIncome: ordinaryIncome,
    filingStatus,
    itemizedDeductions,
    adjustments: totalAdjustments,
  })

  // Step 5: Calculate federal capital gains tax
  const capitalGainsTaxCalc = calculateCapitalGainsTax(
    federalOrdinaryTaxCalc.taxableIncome,
    capitalGains.longTerm ?? 0,
    qualifiedDividends,
    filingStatus
  )

  // Step 6: Calculate federal credits
  const earnedIncome = w2Wages + selfEmploymentIncome
  const totalCapitalGains = (capitalGains.longTerm ?? 0) + (capitalGains.shortTerm ?? 0)
  const totalInvestmentIncome = totalCapitalGains + qualifiedDividends + investmentIncome

  const federalCreditsCalc = calculateTotalFederalCredits({
    numberOfChildren,
    agi: federalAGI,
    earnedIncome,
    filingStatus,
    taxLiability:
      federalOrdinaryTaxCalc.totalTax +
      seTaxCalc.totalSelfEmploymentTax +
      capitalGainsTaxCalc.totalTax,
    childCareExpenses,
    investmentIncome: totalInvestmentIncome,
  })

  // Step 7: Calculate federal total tax
  const federalTotalTaxBeforeCredits =
    federalOrdinaryTaxCalc.totalTax +
    seTaxCalc.totalSelfEmploymentTax +
    capitalGainsTaxCalc.totalTax

  const federalTotalTaxLiability = Math.max(
    0,
    federalTotalTaxBeforeCredits - federalCreditsCalc.totalNonRefundableCredits
  )

  // Step 8: Calculate Wisconsin adjustments
  const wisconsinFilingStatus = mapToWisconsinFilingStatus(filingStatus)

  const wisconsinAdjustmentsCalc = calculateWisconsinAdjustments({
    federalAGI,
    filingStatus: wisconsinFilingStatus,
    nonWisconsinMunicipalInterest,
    wisconsinMunicipalInterest,
    socialSecurityBenefits,
    retirementIncome,
    taxpayerAge: age,
    wisconsinTuitionExpenses,
    numberOfDependents: numberOfChildren,
  })

  const wisconsinAGI = federalAGI + wisconsinAdjustmentsCalc.netAdjustment

  // Step 9: Calculate Wisconsin state tax
  const wisconsinTaxCalc = calculateWisconsinTax(
    federalAGI,
    wisconsinFilingStatus,
    wisconsinAdjustmentsCalc.netAdjustment,
    itemizedDeductions
  )

  // Step 10: Calculate Wisconsin credits
  const wisconsinCreditsCalc = calculateTotalWisconsinCredits({
    wisconsinIncome: wisconsinAGI,
    filingStatus: wisconsinFilingStatus,
    federalEITC: federalCreditsCalc.eitc.actualCredit,
    numberOfChildren,
    propertyTaxOrRent: wisconsinPropertyTaxOrRent,
    isHomeowner,
  })

  const wisconsinTotalTaxLiability = Math.max(
    0,
    wisconsinTaxCalc.totalTax - wisconsinCreditsCalc.totalCredits
  )

  // Step 11: Calculate combined totals
  const combinedTotalTaxLiability = federalTotalTaxLiability + wisconsinTotalTaxLiability
  const combinedEffectiveRate =
    totalGrossIncome > 0 ? combinedTotalTaxLiability / totalGrossIncome : 0
  const combinedMarginalRate = federalOrdinaryTaxCalc.marginalRate + wisconsinTaxCalc.marginalRate

  return {
    totalGrossIncome,
    federalAGI,
    wisconsinAGI,
    federal: {
      taxableIncome: federalOrdinaryTaxCalc.taxableIncome,
      ordinaryIncomeTax: federalOrdinaryTaxCalc.totalTax,
      selfEmploymentTax: seTaxCalc.totalSelfEmploymentTax,
      capitalGainsTax: capitalGainsTaxCalc.totalTax,
      totalTaxBeforeCredits: federalTotalTaxBeforeCredits,
      credits: {
        childTaxCredit: federalCreditsCalc.childTaxCredit.totalCredit,
        eitc: federalCreditsCalc.eitc.actualCredit,
        childCareCredit: federalCreditsCalc.childCareCredit.credit,
        totalCredits: federalCreditsCalc.totalCredits,
      },
      totalTaxLiability: federalTotalTaxLiability,
      effectiveRate: federalTotalTaxLiability / totalGrossIncome,
      marginalRate: federalOrdinaryTaxCalc.marginalRate,
    },
    wisconsin: {
      taxableIncome: wisconsinTaxCalc.wisconsinTaxableIncome,
      incomeTax: wisconsinTaxCalc.totalTax,
      credits: {
        schoolPropertyTax: wisconsinCreditsCalc.schoolPropertyTaxCredit,
        marriedCouple: wisconsinCreditsCalc.marriedCoupleCredit,
        workingFamilies: wisconsinCreditsCalc.workingFamiliesCredit,
        totalCredits: wisconsinCreditsCalc.totalCredits,
      },
      totalTaxLiability: wisconsinTotalTaxLiability,
      effectiveRate: wisconsinTotalTaxLiability / totalGrossIncome,
      marginalRate: wisconsinTaxCalc.marginalRate,
    },
    combined: {
      totalTaxLiability: combinedTotalTaxLiability,
      effectiveRate: combinedEffectiveRate,
      combinedMarginalRate,
    },
  }
}

/**
 * Calculate withholding analysis and estimated refund/amount due
 */
export function analyzeWithholding(
  taxResult: CombinedTaxResult,
  federalWithholding: number,
  stateWithholding: number,
  estimatedPayments: number = 0
): {
  totalWithholding: number
  totalTaxLiability: number
  estimatedRefund: number
  estimatedAmountDue: number
  federalRefund: number
  federalAmountDue: number
  stateRefund: number
  stateAmountDue: number
} {
  const totalWithholding = federalWithholding + stateWithholding + estimatedPayments
  const totalTaxLiability = taxResult.combined.totalTaxLiability

  const difference = totalWithholding - totalTaxLiability
  const estimatedRefund = Math.max(0, difference)
  const estimatedAmountDue = Math.max(0, -difference)

  // Federal breakdown
  const federalDifference = federalWithholding - taxResult.federal.totalTaxLiability
  const federalRefund = Math.max(0, federalDifference)
  const federalAmountDue = Math.max(0, -federalDifference)

  // State breakdown
  const stateDifference = stateWithholding - taxResult.wisconsin.totalTaxLiability
  const stateRefund = Math.max(0, stateDifference)
  const stateAmountDue = Math.max(0, -stateDifference)

  return {
    totalWithholding,
    totalTaxLiability,
    estimatedRefund,
    estimatedAmountDue,
    federalRefund,
    federalAmountDue,
    stateRefund,
    stateAmountDue,
  }
}

/**
 * Calculate year-end tax projection
 */
export function projectYearEndTax(
  ytdInput: CombinedTaxInput,
  projectedRemainingIncome: Partial<CombinedTaxInput>,
  ytdWithholding: { federal: number; state: number }
): {
  yearEndTax: CombinedTaxResult
  withholdingAnalysis: ReturnType<typeof analyzeWithholding>
  recommendedQuarterlyPayment: number
  remainingQuarters: number
} {
  // Combine YTD and projected income
  const projectedAnnualInput: CombinedTaxInput = {
    ...ytdInput,
    w2Wages: (ytdInput.w2Wages ?? 0) + (projectedRemainingIncome.w2Wages ?? 0),
    selfEmploymentIncome:
      (ytdInput.selfEmploymentIncome ?? 0) + (projectedRemainingIncome.selfEmploymentIncome ?? 0),
    otherIncome: (ytdInput.otherIncome ?? 0) + (projectedRemainingIncome.otherIncome ?? 0),
  }

  const yearEndTax = calculateCombinedTax(projectedAnnualInput)

  // Calculate withholding analysis
  const withholdingAnalysis = analyzeWithholding(
    yearEndTax,
    ytdWithholding.federal,
    ytdWithholding.state
  )

  // Calculate recommended quarterly payment
  const currentMonth = new Date().getMonth() + 1 // 1-12
  const remainingQuarters = Math.max(0, Math.ceil((12 - currentMonth) / 3))

  const recommendedQuarterlyPayment =
    remainingQuarters > 0 ? withholdingAnalysis.estimatedAmountDue / remainingQuarters : 0

  return {
    yearEndTax,
    withholdingAnalysis,
    recommendedQuarterlyPayment,
    remainingQuarters,
  }
}
