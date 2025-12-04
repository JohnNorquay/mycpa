import type { Tables } from '@/types'
import type { FilingStatus } from '@/lib/tax/federal-calculator'
import { getMarginalRate } from '@/lib/tax/federal-calculator'

export interface RetirementOpportunity {
  type: 'traditional_ira' | 'roth_ira' | '401k' | 'sep_ira'
  maxContribution: number
  currentContribution: number
  remainingSpace: number
  taxSavings: number
  recommendation: string
}

export interface DeductionBunchingAnalysis {
  currentYearItemized: number
  standardDeduction: number
  shouldItemize: boolean
  bunchingOpportunity: number
  bunchingRecommendation: string
}

export interface WithholdingAdjustment {
  currentWithholding: number
  recommendedWithholding: number
  adjustmentNeeded: number
  w4Recommendation: string
}

export interface TaxOptimization {
  retirementOpportunities: RetirementOpportunity[]
  deductionBunching: DeductionBunchingAnalysis
  withholdingAdjustment: WithholdingAdjustment | null
  estimatedTaxSavings: number
}

// 2024 IRA contribution limits
const IRA_LIMIT_2024 = 7000
const IRA_CATCHUP_2024 = 1000 // Age 50+
const CONTRIBUTION_401K_2024 = 23000
const CONTRIBUTION_401K_CATCHUP_2024 = 7500 // Age 50+
const SEP_IRA_LIMIT_PERCENTAGE = 0.25 // 25% of net self-employment income

// 2024 standard deductions
const STANDARD_DEDUCTION_2024: Record<FilingStatus, number> = {
  single: 14600,
  married_filing_jointly: 29200,
  married_filing_separately: 14600,
  head_of_household: 21900,
  qualifying_widow: 29200,
}

/**
 * Analyze retirement contribution opportunities
 */
export function analyzeRetirementOpportunities(
  income: number,
  filingStatus: FilingStatus,
  employmentStatus: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'disabled' | null,
  age: number,
  currentContributions: {
    traditional_ira?: number
    roth_ira?: number
    k401?: number
    sep_ira?: number
  } = {}
): RetirementOpportunity[] {
  const opportunities: RetirementOpportunity[] = []
  const marginalRate = getMarginalRate(income, filingStatus)
  const isCatchupEligible = age >= 50

  // Traditional IRA
  const iraLimit = IRA_LIMIT_2024 + (isCatchupEligible ? IRA_CATCHUP_2024 : 0)
  const currentIRA = currentContributions.traditional_ira || 0
  const iraSpace = Math.max(0, iraLimit - currentIRA)

  if (iraSpace > 0) {
    const taxSavings = iraSpace * marginalRate

    opportunities.push({
      type: 'traditional_ira',
      maxContribution: iraLimit,
      currentContribution: currentIRA,
      remainingSpace: iraSpace,
      taxSavings,
      recommendation: `Contributing the remaining $${iraSpace.toFixed(0)} to a Traditional IRA could save you $${taxSavings.toFixed(0)} in taxes this year.`,
    })
  }

  // Roth IRA (no immediate tax benefit, but mention it)
  const currentRoth = currentContributions.roth_ira || 0
  const rothSpace = Math.max(0, iraLimit - currentRoth - currentIRA) // Combined IRA limit

  if (rothSpace > 0 && iraSpace === 0) {
    opportunities.push({
      type: 'roth_ira',
      maxContribution: iraLimit,
      currentContribution: currentRoth,
      remainingSpace: rothSpace,
      taxSavings: 0, // No immediate tax benefit
      recommendation: `While Roth IRA contributions don't reduce current taxes, you have $${rothSpace.toFixed(0)} of contribution space for tax-free growth.`,
    })
  }

  // 401(k) - if employed
  if (employmentStatus === 'employed') {
    const k401Limit =
      CONTRIBUTION_401K_2024 + (isCatchupEligible ? CONTRIBUTION_401K_CATCHUP_2024 : 0)
    const current401k = currentContributions.k401 || 0
    const k401Space = Math.max(0, k401Limit - current401k)

    if (k401Space > 0) {
      const taxSavings = k401Space * marginalRate

      opportunities.push({
        type: '401k',
        maxContribution: k401Limit,
        currentContribution: current401k,
        remainingSpace: k401Space,
        taxSavings,
        recommendation: `Maxing out your 401(k) with an additional $${k401Space.toFixed(0)} could save you $${taxSavings.toFixed(0)} in taxes. Check if your employer offers matching!`,
      })
    }
  }

  // SEP IRA - if self-employed
  if (employmentStatus === 'self_employed') {
    const sepLimit = income * SEP_IRA_LIMIT_PERCENTAGE
    const currentSEP = currentContributions.sep_ira || 0
    const sepSpace = Math.max(0, sepLimit - currentSEP)

    if (sepSpace > 0) {
      const taxSavings = sepSpace * marginalRate

      opportunities.push({
        type: 'sep_ira',
        maxContribution: sepLimit,
        currentContribution: currentSEP,
        remainingSpace: sepSpace,
        taxSavings,
        recommendation: `As a self-employed individual, you can contribute up to $${sepLimit.toFixed(0)} to a SEP IRA (25% of net income). Contributing the remaining $${sepSpace.toFixed(0)} could save $${taxSavings.toFixed(0)} in taxes.`,
      })
    }
  }

  return opportunities
}

/**
 * Analyze deduction bunching opportunities
 */
export function analyzeDeductionBunching(
  filingStatus: FilingStatus,
  currentYearDeductions: {
    medicalExpenses?: number
    stateLocalTaxes?: number
    mortgageInterest?: number
    charitableContributions?: number
    otherDeductions?: number
  }
): DeductionBunchingAnalysis {
  const standardDeduction = STANDARD_DEDUCTION_2024[filingStatus]

  const totalItemized =
    (currentYearDeductions.medicalExpenses || 0) +
    Math.min(10000, currentYearDeductions.stateLocalTaxes || 0) + // SALT cap
    (currentYearDeductions.mortgageInterest || 0) +
    (currentYearDeductions.charitableContributions || 0) +
    (currentYearDeductions.otherDeductions || 0)

  const shouldItemize = totalItemized > standardDeduction
  const shortfall = standardDeduction - totalItemized

  let bunchingOpportunity = 0
  let bunchingRecommendation = ''

  if (!shouldItemize && shortfall < 5000) {
    // Close to itemizing threshold - bunching might help
    bunchingOpportunity = shortfall

    bunchingRecommendation = `You're $${shortfall.toFixed(0)} away from benefiting from itemized deductions. Consider "bunching" charitable contributions or prepaying property taxes to exceed the standard deduction this year, then taking the standard deduction next year.`
  } else if (!shouldItemize) {
    bunchingRecommendation = `You're currently better off taking the standard deduction of $${standardDeduction.toFixed(0)}. Your itemized deductions ($${totalItemized.toFixed(0)}) don't exceed this threshold.`
  } else {
    const benefit = totalItemized - standardDeduction
    bunchingRecommendation = `You're already benefiting from itemizing ($${benefit.toFixed(0)} more than standard deduction). Consider bunching next year's charitable contributions into this year for even greater tax savings.`
  }

  return {
    currentYearItemized: totalItemized,
    standardDeduction,
    shouldItemize,
    bunchingOpportunity,
    bunchingRecommendation,
  }
}

/**
 * Calculate withholding adjustment recommendations
 */
export function calculateWithholdingAdjustment(
  annualIncome: number,
  filingStatus: FilingStatus,
  estimatedTaxLiability: number,
  yearToDateWithholding: number,
  monthsRemaining: number
): WithholdingAdjustment | null {
  if (monthsRemaining <= 0) {
    return null // Can't adjust if year is over
  }

  // Target: withhold 90% of current year tax or 100% of prior year tax (safe harbor)
  const targetWithholding = estimatedTaxLiability * 0.9
  const totalNeeded = targetWithholding - yearToDateWithholding
  const monthlyNeeded = totalNeeded / monthsRemaining

  const currentMonthlyWithholding = yearToDateWithholding / (12 - monthsRemaining)
  const recommendedMonthlyWithholding = Math.max(0, monthlyNeeded)

  const adjustmentNeeded = recommendedMonthlyWithholding - currentMonthlyWithholding

  let w4Recommendation = ''

  if (adjustmentNeeded > 100) {
    w4Recommendation = `Increase your W-4 withholding by approximately $${adjustmentNeeded.toFixed(0)}/month to avoid underpayment penalties. Consider updating your W-4 to withhold an additional $${totalNeeded.toFixed(0)} over the remaining ${monthsRemaining} months.`
  } else if (adjustmentNeeded < -100) {
    w4Recommendation = `You're over-withholding by about $${Math.abs(adjustmentNeeded).toFixed(0)}/month. You could reduce your W-4 withholding to increase your monthly take-home pay, but ensure you maintain safe harbor (90% of current year tax).`
  } else {
    w4Recommendation = `Your current withholding is on track. No W-4 adjustment needed.`
  }

  return {
    currentWithholding: yearToDateWithholding,
    recommendedWithholding: targetWithholding,
    adjustmentNeeded: totalNeeded,
    w4Recommendation,
  }
}

/**
 * Perform complete tax optimization analysis
 */
export function optimizeTaxes(
  userProfile: Tables<'user_profile'>,
  income: number,
  estimatedTaxLiability: number,
  ytdWithholding: number,
  currentContributions?: {
    traditional_ira?: number
    roth_ira?: number
    k401?: number
    sep_ira?: number
  },
  currentDeductions?: {
    medicalExpenses?: number
    stateLocalTaxes?: number
    mortgageInterest?: number
    charitableContributions?: number
    otherDeductions?: number
  }
): TaxOptimization {
  const filingStatus = (userProfile.filing_status as FilingStatus) || 'single'

  // Calculate age from date of birth
  let age = 30 // Default
  if (userProfile.date_of_birth) {
    const dob = new Date(userProfile.date_of_birth)
    age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  }

  // Analyze retirement opportunities
  const retirementOpportunities = analyzeRetirementOpportunities(
    income,
    filingStatus,
    userProfile.employment_status,
    age,
    currentContributions
  )

  // Analyze deduction bunching
  const deductionBunching = analyzeDeductionBunching(filingStatus, currentDeductions || {})

  // Calculate withholding adjustment
  const now = new Date()
  const monthsRemaining = 12 - now.getMonth()
  const withholdingAdjustment = calculateWithholdingAdjustment(
    income,
    filingStatus,
    estimatedTaxLiability,
    ytdWithholding,
    monthsRemaining
  )

  // Calculate total estimated tax savings
  const estimatedTaxSavings = retirementOpportunities.reduce((sum, opp) => sum + opp.taxSavings, 0)

  return {
    retirementOpportunities,
    deductionBunching,
    withholdingAdjustment,
    estimatedTaxSavings,
  }
}
