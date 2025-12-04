/**
 * Wisconsin Tax Credits Calculator
 *
 * Implements Wisconsin-specific tax credits including:
 * - School Property Tax Credit
 * - Married Couple Credit
 * - Working Families Tax Credit (Wisconsin EITC)
 * - Other Wisconsin credits
 *
 * 2024 Tax Year
 */

import type { WisconsinFilingStatus } from './wisconsin-calculator'

/**
 * School Property Tax Credit (2024)
 * Credit for renters and homeowners
 */
export const SCHOOL_PROPERTY_TAX_CREDIT_2024 = {
  maxCredit: {
    homeowner: 1168,
    renter: 584, // 50% of homeowner rate
  },
  phaseoutThreshold: {
    single: 8840,
    married_joint: 8840,
    married_separate: 8840,
    head_of_household: 8840,
  },
  phaseoutRate: 0.1255, // 12.55% reduction per dollar over threshold
}

/**
 * Married Couple Credit (2024)
 * Available to married couples filing jointly
 */
export const MARRIED_COUPLE_CREDIT_2024 = {
  baseCredit: 480,
  incomeThreshold: 87990, // Phase-out starts here
  phaseoutRate: 0.0194, // 1.94% reduction
}

/**
 * Wisconsin Working Families Tax Credit (2024)
 * Based on federal EITC (percentage of federal credit)
 */
export const WORKING_FAMILIES_CREDIT_2024 = {
  percentOfFederalEITC: {
    0: 0.04, // 4% for 0 children
    1: 0.04, // 4% for 1 child
    2: 0.11, // 11% for 2 children
    3: 0.11, // 11% for 3+ children
  },
}

export interface SchoolPropertyTaxCreditCalculation {
  isHomeowner: boolean
  propertyTaxOrRent: number
  wisconsinIncome: number
  maxCredit: number
  phaseoutAmount: number
  credit: number
}

export interface MarriedCoupleCreditCalculation {
  wisconsinIncome: number
  baseCredit: number
  phaseoutAmount: number
  credit: number
}

export interface WorkingFamiliesCreditCalculation {
  federalEITC: number
  numberOfChildren: number
  percentageRate: number
  credit: number
}

export interface WisconsinCreditsTotal {
  schoolPropertyTaxCredit: number
  marriedCoupleCredit: number
  workingFamiliesCredit: number
  otherCredits: number
  totalCredits: number
}

/**
 * Calculate School Property Tax Credit
 */
export function calculateSchoolPropertyTaxCredit(
  wisconsinIncome: number,
  propertyTaxOrRent: number,
  isHomeowner: boolean,
  filingStatus: WisconsinFilingStatus
): SchoolPropertyTaxCreditCalculation {
  const constants = SCHOOL_PROPERTY_TAX_CREDIT_2024

  // Determine maximum credit
  const maxCredit = isHomeowner ? constants.maxCredit.homeowner : constants.maxCredit.renter

  // Calculate phase-out
  const threshold = constants.phaseoutThreshold[filingStatus]
  let phaseoutAmount = 0

  if (wisconsinIncome > threshold) {
    const excessIncome = wisconsinIncome - threshold
    phaseoutAmount = excessIncome * constants.phaseoutRate
  }

  // Calculate final credit
  const credit = Math.max(0, maxCredit - phaseoutAmount)

  return {
    isHomeowner,
    propertyTaxOrRent,
    wisconsinIncome,
    maxCredit,
    phaseoutAmount,
    credit: Math.round(credit),
  }
}

/**
 * Calculate Married Couple Credit
 */
export function calculateMarriedCoupleCredit(
  wisconsinIncome: number,
  filingStatus: WisconsinFilingStatus
): MarriedCoupleCreditCalculation {
  // Only available to married filing jointly
  if (filingStatus !== 'married_joint') {
    return {
      wisconsinIncome,
      baseCredit: 0,
      phaseoutAmount: 0,
      credit: 0,
    }
  }

  const constants = MARRIED_COUPLE_CREDIT_2024
  const baseCredit = constants.baseCredit

  // Calculate phase-out
  let phaseoutAmount = 0

  if (wisconsinIncome > constants.incomeThreshold) {
    const excessIncome = wisconsinIncome - constants.incomeThreshold
    phaseoutAmount = excessIncome * constants.phaseoutRate
  }

  // Calculate final credit
  const credit = Math.max(0, baseCredit - phaseoutAmount)

  return {
    wisconsinIncome,
    baseCredit,
    phaseoutAmount,
    credit: Math.round(credit),
  }
}

/**
 * Calculate Working Families Tax Credit (Wisconsin EITC)
 * Based on percentage of federal EITC
 */
export function calculateWorkingFamiliesCredit(
  federalEITC: number,
  numberOfChildren: number
): WorkingFamiliesCreditCalculation {
  // Cap children at 3 for calculation purposes
  const qualifyingChildren = Math.min(numberOfChildren, 3) as 0 | 1 | 2 | 3

  const percentageRate = WORKING_FAMILIES_CREDIT_2024.percentOfFederalEITC[qualifyingChildren]

  const credit = Math.round(federalEITC * percentageRate)

  return {
    federalEITC,
    numberOfChildren: qualifyingChildren,
    percentageRate,
    credit,
  }
}

/**
 * Calculate homestead credit (additional property tax relief)
 * Separate from school property tax credit
 */
export function calculateHomesteadCredit(
  propertyTax: number,
  householdIncome: number,
  isElderly: boolean = false
): number {
  // Wisconsin Homestead Credit has complex formula
  // This is a simplified version

  const maxCredit = 1460 // 2024 maximum
  const minPropertyTax = 100

  if (propertyTax < minPropertyTax) {
    return 0
  }

  // Income-based calculation (simplified)
  const incomeThreshold = isElderly ? 24680 : 8060

  if (householdIncome > incomeThreshold) {
    // Phase-out calculation
    const excessIncome = householdIncome - incomeThreshold
    const phaseoutRate = 0.08 // 8% per dollar over
    const phaseoutAmount = excessIncome * phaseoutRate

    return Math.max(0, Math.min(maxCredit, propertyTax * 0.8 - phaseoutAmount))
  }

  // Below threshold - calculate based on property tax
  return Math.min(maxCredit, propertyTax * 0.8)
}

/**
 * Calculate all Wisconsin credits
 */
export function calculateTotalWisconsinCredits(params: {
  wisconsinIncome: number
  filingStatus: WisconsinFilingStatus
  federalEITC: number
  numberOfChildren?: number
  propertyTaxOrRent?: number
  isHomeowner?: boolean
  otherCredits?: number
}): WisconsinCreditsTotal {
  const {
    wisconsinIncome,
    filingStatus,
    federalEITC,
    numberOfChildren = 0,
    propertyTaxOrRent = 0,
    isHomeowner = false,
    otherCredits = 0,
  } = params

  // School Property Tax Credit
  const schoolPropertyCredit =
    propertyTaxOrRent > 0
      ? calculateSchoolPropertyTaxCredit(
          wisconsinIncome,
          propertyTaxOrRent,
          isHomeowner,
          filingStatus
        ).credit
      : 0

  // Married Couple Credit
  const marriedCredit = calculateMarriedCoupleCredit(wisconsinIncome, filingStatus).credit

  // Working Families Credit
  const workingFamiliesCredit =
    federalEITC > 0 ? calculateWorkingFamiliesCredit(federalEITC, numberOfChildren).credit : 0

  // Total credits
  const totalCredits = schoolPropertyCredit + marriedCredit + workingFamiliesCredit + otherCredits

  return {
    schoolPropertyTaxCredit: schoolPropertyCredit,
    marriedCoupleCredit: marriedCredit,
    workingFamiliesCredit: workingFamiliesCredit,
    otherCredits,
    totalCredits,
  }
}

/**
 * Check eligibility for various Wisconsin credits
 */
export function checkWisconsinCreditEligibility(params: {
  filingStatus: WisconsinFilingStatus
  wisconsinIncome: number
  hasChildren: boolean
  isHomeowner: boolean
}): {
  eligibleForSchoolPropertyTax: boolean
  eligibleForMarriedCouple: boolean
  eligibleForWorkingFamilies: boolean
} {
  const { filingStatus, hasChildren } = params

  return {
    eligibleForSchoolPropertyTax: true, // Most taxpayers eligible
    eligibleForMarriedCouple: filingStatus === 'married_joint',
    eligibleForWorkingFamilies: hasChildren, // Simplified - actual rules more complex
  }
}
