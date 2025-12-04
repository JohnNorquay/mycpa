/**
 * Self-Employment Tax Calculator
 *
 * Implements self-employment tax calculations including:
 * - Social Security tax (12.4% up to wage base)
 * - Medicare tax (2.9% on all earnings)
 * - Additional Medicare tax (0.9% over threshold)
 *
 * 2024 Tax Year
 */

import type { FilingStatus } from './federal-calculator'

/**
 * 2024 Self-Employment Tax Constants
 */
export const SE_TAX_CONSTANTS_2024 = {
  // Social Security
  socialSecurityRate: 0.124, // 12.4%
  socialSecurityWageBase: 168600, // Maximum earnings subject to Social Security tax

  // Medicare
  medicareRate: 0.029, // 2.9%
  additionalMedicareRate: 0.009, // 0.9%

  // Additional Medicare Tax Thresholds (MAGI-based)
  additionalMedicareThreshold: {
    single: 200000,
    married_filing_jointly: 250000,
    married_filing_separately: 125000,
    head_of_household: 200000,
    qualifying_widow: 200000,
  },

  // Deduction factor (92.35% of net self-employment income)
  deductionFactor: 0.9235,
}

export interface SelfEmploymentTaxCalculation {
  netSelfEmploymentIncome: number
  deductibleIncome: number // 92.35% of net SE income
  socialSecurityTax: number
  medicareTax: number
  additionalMedicareTax: number
  totalSelfEmploymentTax: number
  deductiblePortion: number // 50% of SE tax (employer portion)
}

/**
 * Calculate self-employment tax
 */
export function calculateSelfEmploymentTax(
  netSelfEmploymentIncome: number,
  filingStatus: FilingStatus,
  otherIncome: number = 0 // W-2 wages or other earned income
): SelfEmploymentTaxCalculation {
  if (netSelfEmploymentIncome <= 0) {
    return {
      netSelfEmploymentIncome: 0,
      deductibleIncome: 0,
      socialSecurityTax: 0,
      medicareTax: 0,
      additionalMedicareTax: 0,
      totalSelfEmploymentTax: 0,
      deductiblePortion: 0,
    }
  }

  const constants = SE_TAX_CONSTANTS_2024

  // Step 1: Calculate deductible income (92.35% of net SE income)
  const deductibleIncome = netSelfEmploymentIncome * constants.deductionFactor

  // Step 2: Calculate Social Security tax (12.4% up to wage base)
  // Must account for any W-2 wages that already counted toward the wage base
  const remainingWageBase = Math.max(0, constants.socialSecurityWageBase - otherIncome)
  const socialSecurityBase = Math.min(deductibleIncome, remainingWageBase)
  const socialSecurityTax = socialSecurityBase * constants.socialSecurityRate

  // Step 3: Calculate regular Medicare tax (2.9% on all SE income)
  const medicareTax = deductibleIncome * constants.medicareRate

  // Step 4: Calculate Additional Medicare Tax (0.9% over threshold)
  const threshold = constants.additionalMedicareThreshold[filingStatus]
  const totalEarnedIncome = deductibleIncome + otherIncome
  const incomeOverThreshold = Math.max(0, totalEarnedIncome - threshold)
  const additionalMedicareTax = incomeOverThreshold * constants.additionalMedicareRate

  // Step 5: Calculate total SE tax and deductible portion
  const totalSelfEmploymentTax = socialSecurityTax + medicareTax + additionalMedicareTax
  const deductiblePortion = totalSelfEmploymentTax * 0.5 // Employer portion (50%)

  return {
    netSelfEmploymentIncome,
    deductibleIncome,
    socialSecurityTax,
    medicareTax,
    additionalMedicareTax,
    totalSelfEmploymentTax,
    deductiblePortion,
  }
}

/**
 * Calculate the deductible portion of self-employment tax (for AGI adjustment)
 */
export function getSelfEmploymentTaxDeduction(
  netSelfEmploymentIncome: number,
  filingStatus: FilingStatus,
  otherIncome: number = 0
): number {
  const calculation = calculateSelfEmploymentTax(netSelfEmploymentIncome, filingStatus, otherIncome)
  return calculation.deductiblePortion
}

/**
 * Calculate net self-employment income from gross receipts
 */
export function calculateNetSelfEmploymentIncome(
  grossReceipts: number,
  businessExpenses: number
): number {
  return Math.max(0, grossReceipts - businessExpenses)
}

/**
 * Estimate quarterly self-employment tax payment
 */
export function estimateQuarterlyPayment(
  annualNetSelfEmploymentIncome: number,
  filingStatus: FilingStatus,
  otherIncome: number = 0
): number {
  const annualTax = calculateSelfEmploymentTax(
    annualNetSelfEmploymentIncome,
    filingStatus,
    otherIncome
  )

  // Quarterly payment is 1/4 of annual tax
  return annualTax.totalSelfEmploymentTax / 4
}

/**
 * Check if self-employment tax applies
 * Generally applies if net earnings from self-employment are $400 or more
 */
export function isSubjectToSelfEmploymentTax(netSelfEmploymentIncome: number): boolean {
  return netSelfEmploymentIncome >= 400
}
