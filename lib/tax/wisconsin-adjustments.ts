/**
 * Wisconsin Tax Adjustments Handler
 *
 * Handles Wisconsin-specific income adjustments including:
 * - Additions (income Wisconsin adds back)
 * - Subtractions (income Wisconsin excludes)
 * - Different itemized deduction rules
 *
 * 2024 Tax Year
 */

export interface WisconsinAddition {
  type: string
  description: string
  amount: number
}

export interface WisconsinSubtraction {
  type: string
  description: string
  amount: number
}

export interface WisconsinAdjustments {
  additions: WisconsinAddition[]
  subtractions: WisconsinSubtraction[]
  totalAdditions: number
  totalSubtractions: number
  netAdjustment: number
}

/**
 * Common Wisconsin Additions
 * These are amounts added back to federal AGI to calculate Wisconsin AGI
 */
export const COMMON_WISCONSIN_ADDITIONS = {
  // State and local tax refunds (if deducted federally)
  STATE_TAX_REFUND: 'state_tax_refund',

  // Municipal bond interest from non-Wisconsin states
  NON_WI_MUNICIPAL_INTEREST: 'non_wi_municipal_interest',

  // College tuition and expenses deduction (federal)
  FEDERAL_TUITION_DEDUCTION: 'federal_tuition_deduction',

  // Domestic production activities deduction
  DOMESTIC_PRODUCTION: 'domestic_production',

  // Capital loss carryback
  CAPITAL_LOSS_CARRYBACK: 'capital_loss_carryback',

  // Net operating loss carryback
  NOL_CARRYBACK: 'nol_carryback',
} as const

/**
 * Common Wisconsin Subtractions
 * These are amounts subtracted from federal AGI to calculate Wisconsin AGI
 */
export const COMMON_WISCONSIN_SUBTRACTIONS = {
  // U.S. government bond interest
  US_BOND_INTEREST: 'us_bond_interest',

  // Wisconsin state/municipal bond interest
  WI_MUNICIPAL_INTEREST: 'wi_municipal_interest',

  // Social Security and railroad retirement benefits
  SOCIAL_SECURITY: 'social_security',

  // Military retirement pay (qualifying service members)
  MILITARY_RETIREMENT: 'military_retirement',

  // Retirement income (limited)
  RETIREMENT_INCOME: 'retirement_income',

  // Capital gains from Wisconsin assets (special treatment)
  WI_CAPITAL_GAINS: 'wi_capital_gains',

  // Tuition and fee expenses (Wisconsin)
  WI_TUITION_EXPENSES: 'wi_tuition_expenses',
} as const

/**
 * 2024 Wisconsin Retirement Income Subtraction
 * Taxpayers 65+ can subtract retirement income up to a limit
 */
export const RETIREMENT_INCOME_SUBTRACTION_2024 = {
  single: 5000,
  married_joint: 10000,
  married_separate: 5000,
  head_of_household: 5000,
}

/**
 * Calculate Social Security subtraction for Wisconsin
 * Wisconsin allows subtraction of Social Security benefits
 */
export function calculateSocialSecuritySubtraction(
  federalAGI: number,
  socialSecurityBenefits: number,
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household'
): number {
  // Wisconsin income thresholds for Social Security subtraction
  const thresholds = {
    single: 15000,
    married_joint: 20000,
    married_separate: 10000,
    head_of_household: 15000,
  }

  const threshold = thresholds[filingStatus]

  // If federal AGI is below threshold, all SS is subtractable
  if (federalAGI <= threshold) {
    return socialSecurityBenefits
  }

  // Phase-out calculation (simplified)
  const excessIncome = federalAGI - threshold
  const phaseoutRate = 0.15 // 15% phase-out
  const phaseoutAmount = excessIncome * phaseoutRate

  return Math.max(0, socialSecurityBenefits - phaseoutAmount)
}

/**
 * Calculate retirement income subtraction
 */
export function calculateRetirementIncomeSubtraction(
  retirementIncome: number,
  age: number,
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household'
): number {
  // Must be 65 or older
  if (age < 65) {
    return 0
  }

  const maxSubtraction = RETIREMENT_INCOME_SUBTRACTION_2024[filingStatus]
  return Math.min(retirementIncome, maxSubtraction)
}

/**
 * Calculate tuition and fee expenses subtraction
 */
export function calculateWisconsinTuitionSubtraction(
  qualifiedExpenses: number,
  numberOfDependents: number
): number {
  // Wisconsin allows subtraction for tuition/fees paid to Wisconsin colleges
  // Limited to actual expenses, typically capped per student
  const maxPerStudent = 10000 // Example cap
  const totalMax = numberOfDependents * maxPerStudent

  return Math.min(qualifiedExpenses, totalMax)
}

/**
 * Calculate total Wisconsin adjustments
 */
export function calculateWisconsinAdjustments(params: {
  federalAGI: number
  filingStatus: 'single' | 'married_joint' | 'married_separate' | 'head_of_household'

  // Additions
  stateTaxRefund?: number
  nonWisconsinMunicipalInterest?: number
  federalTuitionDeduction?: number
  otherAdditions?: WisconsinAddition[]

  // Subtractions
  usBondInterest?: number
  wisconsinMunicipalInterest?: number
  socialSecurityBenefits?: number
  militaryRetirement?: number
  retirementIncome?: number
  taxpayerAge?: number
  wisconsinTuitionExpenses?: number
  numberOfDependents?: number
  otherSubtractions?: WisconsinSubtraction[]
}): WisconsinAdjustments {
  const additions: WisconsinAddition[] = []
  const subtractions: WisconsinSubtraction[] = []

  // Process additions
  if (params.stateTaxRefund) {
    additions.push({
      type: COMMON_WISCONSIN_ADDITIONS.STATE_TAX_REFUND,
      description: 'State tax refund included in federal AGI',
      amount: params.stateTaxRefund,
    })
  }

  if (params.nonWisconsinMunicipalInterest) {
    additions.push({
      type: COMMON_WISCONSIN_ADDITIONS.NON_WI_MUNICIPAL_INTEREST,
      description: 'Non-Wisconsin municipal bond interest',
      amount: params.nonWisconsinMunicipalInterest,
    })
  }

  if (params.federalTuitionDeduction) {
    additions.push({
      type: COMMON_WISCONSIN_ADDITIONS.FEDERAL_TUITION_DEDUCTION,
      description: 'Federal tuition and fees deduction',
      amount: params.federalTuitionDeduction,
    })
  }

  if (params.otherAdditions) {
    additions.push(...params.otherAdditions)
  }

  // Process subtractions
  if (params.usBondInterest) {
    subtractions.push({
      type: COMMON_WISCONSIN_SUBTRACTIONS.US_BOND_INTEREST,
      description: 'U.S. government bond interest',
      amount: params.usBondInterest,
    })
  }

  if (params.wisconsinMunicipalInterest) {
    subtractions.push({
      type: COMMON_WISCONSIN_SUBTRACTIONS.WI_MUNICIPAL_INTEREST,
      description: 'Wisconsin municipal bond interest',
      amount: params.wisconsinMunicipalInterest,
    })
  }

  if (params.socialSecurityBenefits) {
    const ssSubtraction = calculateSocialSecuritySubtraction(
      params.federalAGI,
      params.socialSecurityBenefits,
      params.filingStatus
    )

    if (ssSubtraction > 0) {
      subtractions.push({
        type: COMMON_WISCONSIN_SUBTRACTIONS.SOCIAL_SECURITY,
        description: 'Social Security and railroad retirement benefits',
        amount: ssSubtraction,
      })
    }
  }

  if (params.militaryRetirement) {
    subtractions.push({
      type: COMMON_WISCONSIN_SUBTRACTIONS.MILITARY_RETIREMENT,
      description: 'Military retirement pay',
      amount: params.militaryRetirement,
    })
  }

  if (params.retirementIncome && params.taxpayerAge) {
    const retirementSubtraction = calculateRetirementIncomeSubtraction(
      params.retirementIncome,
      params.taxpayerAge,
      params.filingStatus
    )

    if (retirementSubtraction > 0) {
      subtractions.push({
        type: COMMON_WISCONSIN_SUBTRACTIONS.RETIREMENT_INCOME,
        description: 'Retirement income subtraction (age 65+)',
        amount: retirementSubtraction,
      })
    }
  }

  if (params.wisconsinTuitionExpenses && params.numberOfDependents) {
    const tuitionSubtraction = calculateWisconsinTuitionSubtraction(
      params.wisconsinTuitionExpenses,
      params.numberOfDependents
    )

    if (tuitionSubtraction > 0) {
      subtractions.push({
        type: COMMON_WISCONSIN_SUBTRACTIONS.WI_TUITION_EXPENSES,
        description: 'Wisconsin tuition and fee expenses',
        amount: tuitionSubtraction,
      })
    }
  }

  if (params.otherSubtractions) {
    subtractions.push(...params.otherSubtractions)
  }

  // Calculate totals
  const totalAdditions = additions.reduce((sum, add) => sum + add.amount, 0)
  const totalSubtractions = subtractions.reduce((sum, sub) => sum + sub.amount, 0)
  const netAdjustment = totalAdditions - totalSubtractions

  return {
    additions,
    subtractions,
    totalAdditions,
    totalSubtractions,
    netAdjustment,
  }
}

/**
 * Calculate Wisconsin itemized deduction differences
 * Wisconsin has different rules for itemized deductions
 */
export function calculateWisconsinItemizedDeduction(
  federalItemizedDeduction: number,
  stateAndLocalTaxes: number // SALT - different treatment
): number {
  // Wisconsin allows full state/local tax deduction (no $10K cap like federal)
  // This is a simplified calculation

  // If using federal itemized deduction, add back any SALT that was capped federally
  const federalSALTCap = 10000
  const saltAddback = Math.max(0, stateAndLocalTaxes - federalSALTCap)

  return federalItemizedDeduction + saltAddback
}
