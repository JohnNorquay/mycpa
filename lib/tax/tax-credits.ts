/**
 * Tax Credits Calculator
 *
 * Implements major federal tax credits including:
 * - Child Tax Credit
 * - Additional Child Tax Credit (refundable portion)
 * - Earned Income Tax Credit (EITC)
 * - Child and Dependent Care Credit
 * - Credit phase-outs based on income
 *
 * 2024 Tax Year
 */

import type { FilingStatus } from './federal-calculator'

/**
 * Child Tax Credit Constants (2024)
 */
export const CHILD_TAX_CREDIT_2024 = {
  creditPerChild: 2000,
  refundableAmount: 1700, // Additional Child Tax Credit (ACTC) max
  ageLimit: 17, // Under 17 at end of tax year
  phaseoutThreshold: {
    single: 200000,
    married_filing_jointly: 400000,
    married_filing_separately: 200000,
    head_of_household: 200000,
    qualifying_widow: 400000,
  },
  phaseoutRate: 0.05, // $50 per $1,000 of income over threshold
}

/**
 * Earned Income Tax Credit (EITC) 2024
 * Simplified - actual EITC has complex rules
 */
export const EITC_2024 = {
  maxCredit: {
    0: { single: 632, married: 632 }, // No children
    1: { single: 4213, married: 4213 }, // 1 child
    2: { single: 6960, married: 6960 }, // 2 children
    3: { single: 7830, married: 7830 }, // 3+ children
  },
  phaseoutStart: {
    0: { single: 9800, married: 16370 },
    1: { single: 12000, married: 18591 },
    2: { single: 12000, married: 18591 },
    3: { single: 12000, married: 18591 },
  },
  incomeLimit: {
    0: { single: 18591, married: 25511 },
    1: { single: 49084, married: 56004 },
    2: { single: 55768, married: 62688 },
    3: { single: 59899, married: 66819 },
  },
  investmentIncomeLimit: 11600,
}

/**
 * Child and Dependent Care Credit 2024
 */
export const CHILD_CARE_CREDIT_2024 = {
  maxExpenses: {
    oneDependent: 3000,
    twoPlusDependents: 6000,
  },
  creditRate: 0.35, // 35% max rate
  minCreditRate: 0.2, // 20% min rate
  phaseoutStart: 15000,
  phaseoutIncrement: 2000, // Rate decreases 1% per $2,000 over threshold
}

export interface ChildTaxCreditCalculation {
  numberOfChildren: number
  creditBeforePhaseout: number
  phaseoutAmount: number
  nonRefundableCredit: number
  refundableCredit: number // Additional Child Tax Credit (ACTC)
  totalCredit: number
}

export interface EITCCalculation {
  earnedIncome: number
  numberOfChildren: number
  maxCredit: number
  actualCredit: number
  isEligible: boolean
}

export interface ChildCareCreditCalculation {
  qualifiedExpenses: number
  numberOfDependents: number
  creditRate: number
  credit: number
}

/**
 * Calculate Child Tax Credit
 */
export function calculateChildTaxCredit(
  numberOfChildren: number,
  agi: number,
  filingStatus: FilingStatus,
  taxLiability: number
): ChildTaxCreditCalculation {
  if (numberOfChildren <= 0) {
    return {
      numberOfChildren: 0,
      creditBeforePhaseout: 0,
      phaseoutAmount: 0,
      nonRefundableCredit: 0,
      refundableCredit: 0,
      totalCredit: 0,
    }
  }

  const constants = CHILD_TAX_CREDIT_2024
  const creditBeforePhaseout = numberOfChildren * constants.creditPerChild

  // Calculate phase-out
  const threshold = constants.phaseoutThreshold[filingStatus]
  const excessIncome = Math.max(0, agi - threshold)
  const phaseoutAmount = Math.ceil(excessIncome / 1000) * 50 // $50 per $1,000

  // Credit after phase-out
  const creditAfterPhaseout = Math.max(0, creditBeforePhaseout - phaseoutAmount)

  // Non-refundable portion (limited by tax liability)
  const nonRefundableCredit = Math.min(creditAfterPhaseout, taxLiability)

  // Refundable portion (Additional Child Tax Credit)
  const remainingCredit = creditAfterPhaseout - nonRefundableCredit
  const maxRefundable = numberOfChildren * constants.refundableAmount
  const refundableCredit = Math.min(remainingCredit, maxRefundable)

  return {
    numberOfChildren,
    creditBeforePhaseout,
    phaseoutAmount,
    nonRefundableCredit,
    refundableCredit,
    totalCredit: nonRefundableCredit + refundableCredit,
  }
}

/**
 * Calculate Earned Income Tax Credit (EITC)
 * Simplified version - actual EITC has complex phase-in/phase-out calculations
 */
export function calculateEITC(
  earnedIncome: number,
  agi: number,
  numberOfChildren: number,
  filingStatus: FilingStatus,
  investmentIncome: number = 0
): EITCCalculation {
  // Cap children at 3 for EITC purposes
  const qualifyingChildren = Math.min(numberOfChildren, 3) as 0 | 1 | 2 | 3

  // Check investment income limit
  if (investmentIncome > EITC_2024.investmentIncomeLimit) {
    return {
      earnedIncome,
      numberOfChildren: qualifyingChildren,
      maxCredit: 0,
      actualCredit: 0,
      isEligible: false,
    }
  }

  const isMarried = filingStatus === 'married_filing_jointly' || filingStatus === 'qualifying_widow'
  const maxCredit = isMarried
    ? EITC_2024.maxCredit[qualifyingChildren].married
    : EITC_2024.maxCredit[qualifyingChildren].single

  const incomeLimit = isMarried
    ? EITC_2024.incomeLimit[qualifyingChildren].married
    : EITC_2024.incomeLimit[qualifyingChildren].single

  const phaseoutStart = isMarried
    ? EITC_2024.phaseoutStart[qualifyingChildren].married
    : EITC_2024.phaseoutStart[qualifyingChildren].single

  // Check income eligibility
  if (agi > incomeLimit) {
    return {
      earnedIncome,
      numberOfChildren: qualifyingChildren,
      maxCredit,
      actualCredit: 0,
      isEligible: false,
    }
  }

  // Simplified calculation - linear phase-out
  let actualCredit: number

  if (agi <= phaseoutStart) {
    // Full credit in phase-in range
    actualCredit = maxCredit
  } else {
    // Phase-out range - linear reduction
    const phaseoutRange = incomeLimit - phaseoutStart
    const phaseoutRatio = (agi - phaseoutStart) / phaseoutRange
    actualCredit = maxCredit * (1 - phaseoutRatio)
  }

  actualCredit = Math.max(0, Math.round(actualCredit))

  return {
    earnedIncome,
    numberOfChildren: qualifyingChildren,
    maxCredit,
    actualCredit,
    isEligible: actualCredit > 0,
  }
}

/**
 * Calculate Child and Dependent Care Credit
 */
export function calculateChildCareCredit(
  qualifiedExpenses: number,
  numberOfDependents: number,
  agi: number
): ChildCareCreditCalculation {
  if (qualifiedExpenses <= 0 || numberOfDependents <= 0) {
    return {
      qualifiedExpenses: 0,
      numberOfDependents: 0,
      creditRate: 0,
      credit: 0,
    }
  }

  const constants = CHILD_CARE_CREDIT_2024

  // Limit expenses based on number of dependents
  const maxExpenses =
    numberOfDependents >= 2
      ? constants.maxExpenses.twoPlusDependents
      : constants.maxExpenses.oneDependent

  const limitedExpenses = Math.min(qualifiedExpenses, maxExpenses)

  // Calculate credit rate based on AGI
  let creditRate = constants.creditRate

  if (agi > constants.phaseoutStart) {
    const excessIncome = agi - constants.phaseoutStart
    const increments = Math.floor(excessIncome / constants.phaseoutIncrement)
    const rateReduction = increments * 0.01 // 1% per increment
    creditRate = Math.max(constants.minCreditRate, constants.creditRate - rateReduction)
  }

  const credit = Math.round(limitedExpenses * creditRate)

  return {
    qualifiedExpenses: limitedExpenses,
    numberOfDependents,
    creditRate,
    credit,
  }
}

/**
 * Calculate total federal tax credits
 */
export function calculateTotalFederalCredits(params: {
  numberOfChildren: number
  agi: number
  earnedIncome: number
  filingStatus: FilingStatus
  taxLiability: number
  childCareExpenses?: number
  investmentIncome?: number
}): {
  childTaxCredit: ChildTaxCreditCalculation
  eitc: EITCCalculation
  childCareCredit: ChildCareCreditCalculation
  totalNonRefundableCredits: number
  totalRefundableCredits: number
  totalCredits: number
} {
  const {
    numberOfChildren,
    agi,
    earnedIncome,
    filingStatus,
    taxLiability,
    childCareExpenses = 0,
    investmentIncome = 0,
  } = params

  const childTaxCredit = calculateChildTaxCredit(numberOfChildren, agi, filingStatus, taxLiability)

  const eitc = calculateEITC(earnedIncome, agi, numberOfChildren, filingStatus, investmentIncome)

  const childCareCredit = calculateChildCareCredit(childCareExpenses, numberOfChildren, agi)

  const totalNonRefundableCredits = childTaxCredit.nonRefundableCredit + childCareCredit.credit

  const totalRefundableCredits = childTaxCredit.refundableCredit + eitc.actualCredit

  return {
    childTaxCredit,
    eitc,
    childCareCredit,
    totalNonRefundableCredits,
    totalRefundableCredits,
    totalCredits: totalNonRefundableCredits + totalRefundableCredits,
  }
}
