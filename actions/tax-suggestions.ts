'use server'

/**
 * Tax Suggestions Server Actions
 *
 * Provides server-side tax optimization suggestions including:
 * - IRA contribution recommendations
 * - W4 adjustment suggestions
 * - Estimated payment reminders
 * - Tax debt strategy updates
 */

import type { ActionResult } from '@/types'
import { createClient } from '@/lib/supabase/server'
import type { FilingStatus } from '@/lib/tax/federal-calculator'
import { optimizeTaxes, type RetirementOpportunity } from '@/lib/ai/tax-optimizer'
import { calculateFederalTax, type TaxCalculationInput } from './tax-projections'
import { format, subMonths } from 'date-fns'

export interface TaxSuggestion {
  id: string
  type:
    | 'retirement_contribution'
    | 'w4_adjustment'
    | 'estimated_payment'
    | 'tax_debt_strategy'
    | 'deduction_bunching'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  potentialSavings?: number
  actionItems: string[]
  dueDate?: string
}

export interface TaxSuggestionsResult {
  suggestions: TaxSuggestion[]
  totalPotentialSavings: number
  lastUpdated: string
}

/**
 * Generate all tax suggestions for a user
 */
export async function getTaxSuggestions(): Promise<ActionResult<TaxSuggestionsResult>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return {
        success: false,
        error: 'User profile not found',
      }
    }

    // Fetch tax debt
    const { data: taxDebt } = await supabase
      .from('tax_debt')
      .select('*')
      .eq('user_id', user.id)
      .order('tax_year', { ascending: false })

    // Fetch recent transactions to estimate income
    const sixMonthsAgo = format(subMonths(new Date(), 6), 'yyyy-MM-dd')
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_removed', false)
      .gte('date', sixMonthsAgo)

    // Estimate annual income from transactions
    const income =
      transactions?.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0) || 0
    const estimatedAnnualIncome = (income / 6) * 12

    // Estimate tax liability
    const filingStatus = (profile.filing_status as FilingStatus) || 'single'
    const taxInput: TaxCalculationInput = {
      grossIncome: estimatedAnnualIncome,
      filingStatus,
      numberOfChildren: profile.dependents,
    }

    const taxResult = await calculateFederalTax(taxInput)
    const estimatedTaxLiability = taxResult.success ? taxResult.data.totalTaxLiability : 0

    // Estimate YTD withholding (rough estimate from income)
    const ytdWithholding = estimatedTaxLiability * (new Date().getMonth() / 12)

    // Run tax optimization
    const optimization = optimizeTaxes(
      profile,
      estimatedAnnualIncome,
      estimatedTaxLiability,
      ytdWithholding
    )

    const suggestions: TaxSuggestion[] = []

    // 1. Retirement contribution suggestions
    optimization.retirementOpportunities.forEach((opp, index) => {
      if (opp.remainingSpace > 0 && opp.taxSavings > 100) {
        suggestions.push(generateRetirementSuggestion(opp, index))
      }
    })

    // 2. W4 adjustment suggestions
    if (optimization.withholdingAdjustment) {
      const suggestion = generateW4Suggestion(optimization.withholdingAdjustment)
      if (suggestion) {
        suggestions.push(suggestion)
      }
    }

    // 3. Estimated payment reminders
    if (profile.employment_status === 'self_employed' && estimatedTaxLiability > 1000) {
      suggestions.push(generateEstimatedPaymentReminder(estimatedTaxLiability))
    }

    // 4. Tax debt strategy suggestions
    if (taxDebt && taxDebt.length > 0) {
      const debtSuggestions = generateTaxDebtSuggestions(taxDebt)
      suggestions.push(...debtSuggestions)
    }

    // 5. Deduction bunching suggestions
    if (optimization.deductionBunching.bunchingOpportunity > 0) {
      suggestions.push(generateDeductionBunchingSuggestion(optimization.deductionBunching))
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    const totalPotentialSavings =
      suggestions.reduce((sum, s) => sum + (s.potentialSavings || 0), 0) +
      optimization.estimatedTaxSavings

    return {
      success: true,
      data: {
        suggestions,
        totalPotentialSavings,
        lastUpdated: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('Error generating tax suggestions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate tax suggestions',
    }
  }
}

/**
 * Generate retirement contribution suggestion
 */
function generateRetirementSuggestion(
  opportunity: RetirementOpportunity,
  index: number
): TaxSuggestion {
  const typeLabels = {
    traditional_ira: 'Traditional IRA',
    roth_ira: 'Roth IRA',
    '401k': '401(k)',
    sep_ira: 'SEP IRA',
  }

  const priority =
    opportunity.taxSavings > 2000 ? 'high' : opportunity.taxSavings > 500 ? 'medium' : 'low'

  const actionItems: string[] = []

  if (opportunity.type === 'traditional_ira' || opportunity.type === 'roth_ira') {
    actionItems.push("Open an IRA account if you don't have one (Vanguard, Fidelity, Schwab)")
    actionItems.push(
      `Set up automatic monthly contributions of $${(opportunity.remainingSpace / 6).toFixed(0)}`
    )
    actionItems.push('Contribution deadline: April 15 of next year')
  } else if (opportunity.type === '401k') {
    actionItems.push("Log into your employer's 401(k) portal")
    actionItems.push(`Increase your contribution percentage to max out by year-end`)
    actionItems.push('Check if your employer offers matching contributions')
  } else if (opportunity.type === 'sep_ira') {
    actionItems.push('Open a SEP IRA account for self-employed individuals')
    actionItems.push(`Make a contribution before tax filing deadline`)
    actionItems.push('Consult with a tax professional about contribution timing')
  }

  return {
    id: `retirement-${index}`,
    type: 'retirement_contribution',
    priority,
    title: `Maximize ${typeLabels[opportunity.type]} Contribution`,
    description: opportunity.recommendation,
    potentialSavings: opportunity.taxSavings,
    actionItems,
    dueDate:
      opportunity.type === 'sep_ira'
        ? undefined
        : format(new Date(new Date().getFullYear() + 1, 3, 15), 'yyyy-MM-dd'),
  }
}

/**
 * Generate W4 adjustment suggestion
 */
function generateW4Suggestion(adjustment: {
  currentWithholding: number
  recommendedWithholding: number
  adjustmentNeeded: number
  w4Recommendation: string
}): TaxSuggestion | null {
  if (Math.abs(adjustment.adjustmentNeeded) < 500) {
    return null // No significant adjustment needed
  }

  const priority = Math.abs(adjustment.adjustmentNeeded) > 2000 ? 'high' : 'medium'

  const actionItems = [
    'Download IRS Form W-4 from irs.gov',
    'Use the IRS Tax Withholding Estimator tool',
    "Submit updated W-4 to your employer's HR/payroll department",
    'Monitor your next few paychecks to verify the adjustment',
  ]

  return {
    id: 'w4-adjustment',
    type: 'w4_adjustment',
    priority,
    title: adjustment.adjustmentNeeded > 0 ? 'Increase W-4 Withholding' : 'Reduce W-4 Withholding',
    description: adjustment.w4Recommendation,
    actionItems,
  }
}

/**
 * Generate estimated payment reminder
 */
function generateEstimatedPaymentReminder(estimatedTaxLiability: number): TaxSuggestion {
  const quarterlyPayment = estimatedTaxLiability / 4

  // Determine next quarterly due date
  const now = new Date()
  const year = now.getFullYear()
  const quarterlyDates = [
    new Date(year, 3, 15), // April 15
    new Date(year, 5, 15), // June 15
    new Date(year, 8, 15), // September 15
    new Date(year + 1, 0, 15), // January 15 next year
  ]

  const nextDueDate = quarterlyDates.find((date) => date > now) || quarterlyDates[0]!

  return {
    id: 'estimated-payment',
    type: 'estimated_payment',
    priority: 'high',
    title: 'Quarterly Estimated Tax Payment Due',
    description: `As a self-employed individual, you need to make quarterly estimated tax payments. Your next payment of approximately $${quarterlyPayment.toFixed(0)} is due soon to avoid underpayment penalties.`,
    actionItems: [
      'Calculate exact payment amount using IRS Form 1040-ES',
      `Make payment online at irs.gov/payments or via EFTPS`,
      "Set calendar reminder for next quarter's payment",
      'Consider setting aside 25-30% of income for taxes',
    ],
    dueDate: format(nextDueDate, 'yyyy-MM-dd'),
  }
}

/**
 * Generate tax debt strategy suggestions
 */
function generateTaxDebtSuggestions(
  taxDebt: Array<{
    id: string
    tax_year: number
    current_balance: number
    interest_rate: number
    collection_status: string
  }>
): TaxSuggestion[] {
  const suggestions: TaxSuggestion[] = []
  const totalDebt = taxDebt.reduce((sum, debt) => sum + debt.current_balance, 0)

  // High-priority collection status debts
  const highPriorityStatuses = ['lien_filed', 'levy_pending', 'levy_active', 'garnishment']
  const highPriorityDebt = taxDebt.filter((debt) =>
    highPriorityStatuses.includes(debt.collection_status)
  )

  if (highPriorityDebt.length > 0) {
    suggestions.push({
      id: 'tax-debt-urgent',
      type: 'tax_debt_strategy',
      priority: 'high',
      title: 'Urgent: Address IRS Collection Actions',
      description: `You have ${highPriorityDebt.length} tax debt(s) in advanced collection status. Immediate action is needed to prevent or resolve liens, levies, or garnishments.`,
      actionItems: [
        'Contact the IRS immediately at 1-800-829-1040',
        'Consider requesting Currently Not Collectible status if facing financial hardship',
        "Explore Offer in Compromise if you can't pay the full amount",
        'Consult with a tax professional or enrolled agent',
        'Set up an installment agreement to prevent further collection actions',
      ],
    })
  }

  // General debt payoff strategy
  if (totalDebt > 5000) {
    const monthlyPayment = totalDebt * 0.02 // 2% minimum

    suggestions.push({
      id: 'tax-debt-strategy',
      type: 'tax_debt_strategy',
      priority: highPriorityDebt.length > 0 ? 'high' : 'medium',
      title: 'Develop Tax Debt Payoff Plan',
      description: `You have $${totalDebt.toFixed(0)} in total tax debt. Creating a structured payoff plan can help you resolve this debt efficiently and minimize interest charges.`,
      potentialSavings: totalDebt * 0.1, // Rough estimate of interest savings
      actionItems: [
        `Make minimum monthly payments of at least $${monthlyPayment.toFixed(0)}`,
        'Focus extra payments on highest interest rate debt first',
        'Request an installment agreement with the IRS (Form 9465)',
        'Consider debt consolidation or personal loan at lower interest rate',
        'Review your budget to find areas to cut expenses and increase payments',
      ],
    })
  }

  return suggestions
}

/**
 * Generate deduction bunching suggestion
 */
function generateDeductionBunchingSuggestion(bunching: {
  currentYearItemized: number
  standardDeduction: number
  bunchingOpportunity: number
  bunchingRecommendation: string
}): TaxSuggestion {
  return {
    id: 'deduction-bunching',
    type: 'deduction_bunching',
    priority: bunching.bunchingOpportunity > 2000 ? 'medium' : 'low',
    title: 'Consider Deduction Bunching Strategy',
    description: bunching.bunchingRecommendation,
    potentialSavings: bunching.bunchingOpportunity * 0.22, // Rough estimate at 22% bracket
    actionItems: [
      'Review your charitable giving plans for this year and next',
      "Consider prepaying next year's property taxes before December 31",
      'Bunch medical expenses in one year if possible',
      'Keep detailed records of all itemized deductions',
      'Consult with a tax professional before making large deductible payments',
    ],
  }
}
