import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types'
import { format, subMonths } from 'date-fns'

interface FinancialContext {
  userProfile: Tables<'user_profile'> | null
  taxDebt: Tables<'tax_debt'>[]
  recentTransactions: Tables<'transactions'>[]
  recurringTransactions: Tables<'recurring_transactions'>[]
  cashFlowSummary: {
    monthlyIncome: number
    monthlyExpenses: number
    netCashFlow: number
  }
  taxSummary: {
    totalDebt: number
    totalInterest: number
    upcomingPayments: number
  }
}

/**
 * Build comprehensive financial context for AI chat
 * Trims data to stay under token limits (~100K tokens)
 */
export async function buildFinancialContext(userId: string): Promise<string> {
  const supabase = await createClient()

  try {
    // Fetch user profile
    const { data: profile } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Fetch tax debt
    const { data: taxDebt } = await supabase
      .from('tax_debt')
      .select('*')
      .eq('user_id', userId)
      .order('tax_year', { ascending: false })

    // Fetch recent transactions (last 6 months)
    const sixMonthsAgo = format(subMonths(new Date(), 6), 'yyyy-MM-dd')
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_removed', false)
      .gte('date', sixMonthsAgo)
      .order('date', { ascending: false })
      .limit(500) // Limit to most recent 500 transactions

    // Fetch recurring transactions
    const { data: recurringTxs } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    // Calculate cash flow summary
    const cashFlowSummary = calculateCashFlowSummary(transactions || [])

    // Calculate tax summary
    const taxSummary = calculateTaxSummary(taxDebt || [])

    const context: FinancialContext = {
      userProfile: profile,
      taxDebt: taxDebt || [],
      recentTransactions: transactions || [],
      recurringTransactions: recurringTxs || [],
      cashFlowSummary,
      taxSummary,
    }

    return formatContextForAI(context)
  } catch (error) {
    console.error('Error building financial context:', error)
    throw error
  }
}

/**
 * Calculate monthly cash flow summary from transactions
 */
function calculateCashFlowSummary(transactions: Tables<'transactions'>[]): {
  monthlyIncome: number
  monthlyExpenses: number
  netCashFlow: number
} {
  if (transactions.length === 0) {
    return { monthlyIncome: 0, monthlyExpenses: 0, netCashFlow: 0 }
  }

  const income = transactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0)

  const expenses = transactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  // Calculate average monthly values (assuming 6 months of data)
  const monthlyIncome = income / 6
  const monthlyExpenses = expenses / 6
  const netCashFlow = monthlyIncome - monthlyExpenses

  return { monthlyIncome, monthlyExpenses, netCashFlow }
}

/**
 * Calculate tax debt summary
 */
function calculateTaxSummary(taxDebt: Tables<'tax_debt'>[]): {
  totalDebt: number
  totalInterest: number
  upcomingPayments: number
} {
  const totalDebt = taxDebt.reduce((sum, debt) => sum + debt.current_balance, 0)

  // Calculate estimated monthly interest (approximate)
  const totalInterest = taxDebt.reduce((sum, debt) => {
    const monthlyRate = debt.interest_rate / 12 / 100
    return sum + debt.current_balance * monthlyRate
  }, 0)

  // For simplicity, assume upcoming payments = minimum monthly payment
  const upcomingPayments = totalDebt * 0.02 // Approximate 2% minimum

  return { totalDebt, totalInterest, upcomingPayments }
}

/**
 * Format financial context as a concise string for AI consumption
 * Keep under ~100K tokens by summarizing and limiting detail
 */
function formatContextForAI(context: FinancialContext): string {
  const sections: string[] = []

  // User Profile
  if (context.userProfile) {
    const p = context.userProfile
    sections.push(`USER PROFILE:
- Name: ${p.first_name || 'Not provided'} ${p.last_name || ''}
- Filing Status: ${p.filing_status || 'Not set'}
- Dependents: ${p.dependents}
- State: ${p.state || 'Not provided'}
- Employment: ${p.employment_status || 'Not set'}`)
  }

  // Cash Flow Summary
  sections.push(`CASH FLOW (6-month average):
- Monthly Income: $${context.cashFlowSummary.monthlyIncome.toFixed(2)}
- Monthly Expenses: $${context.cashFlowSummary.monthlyExpenses.toFixed(2)}
- Net Cash Flow: $${context.cashFlowSummary.netCashFlow.toFixed(2)}`)

  // Tax Debt Summary
  if (context.taxDebt.length > 0) {
    sections.push(`TAX DEBT SUMMARY:
- Total Debt: $${context.taxSummary.totalDebt.toFixed(2)}
- Monthly Interest: ~$${context.taxSummary.totalInterest.toFixed(2)}
- Number of Debts: ${context.taxDebt.length}`)

    // List individual debts
    const debtDetails = context.taxDebt
      .slice(0, 5) // Limit to top 5 debts
      .map(
        (debt) =>
          `  - ${debt.tax_year}: $${debt.current_balance.toFixed(2)} (${debt.debt_type}, ${debt.collection_status})`
      )
      .join('\n')
    sections.push(`TAX DEBTS:\n${debtDetails}`)
  }

  // Recurring Transactions
  if (context.recurringTransactions.length > 0) {
    const recurringIncome = context.recurringTransactions
      .filter((tx) => tx.is_income)
      .slice(0, 5)
      .map(
        (tx) =>
          `  - ${tx.merchant_name}: $${tx.expected_amount?.toFixed(2) || '?'} (${tx.frequency})`
      )
      .join('\n')

    const recurringExpenses = context.recurringTransactions
      .filter((tx) => !tx.is_income)
      .slice(0, 10)
      .map(
        (tx) =>
          `  - ${tx.merchant_name}: $${Math.abs(tx.expected_amount || 0).toFixed(2)} (${tx.frequency})`
      )
      .join('\n')

    if (recurringIncome) {
      sections.push(`RECURRING INCOME:\n${recurringIncome}`)
    }
    if (recurringExpenses) {
      sections.push(`RECURRING EXPENSES:\n${recurringExpenses}`)
    }
  }

  // Recent Transaction Summary (categorized)
  if (context.recentTransactions.length > 0) {
    const categoryTotals = new Map<string, number>()

    context.recentTransactions
      .filter((tx) => tx.amount < 0) // Only expenses
      .forEach((tx) => {
        const category = tx.category || 'Uncategorized'
        const current = categoryTotals.get(category) || 0
        categoryTotals.set(category, current + Math.abs(tx.amount))
      })

    // Sort by total and take top 10 categories
    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, total]) => `  - ${category}: $${total.toFixed(2)}`)
      .join('\n')

    if (topCategories) {
      sections.push(`TOP SPENDING CATEGORIES (6 months):\n${topCategories}`)
    }

    // Tax deductible expenses
    const taxDeductible = context.recentTransactions
      .filter((tx) => tx.is_tax_deductible && tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

    if (taxDeductible > 0) {
      sections.push(`TAX DEDUCTIBLE EXPENSES (6 months): $${taxDeductible.toFixed(2)}`)
    }
  }

  return sections.join('\n\n')
}

/**
 * Build a minimal context summary for suggested questions
 * More concise version for quick analysis
 */
export async function buildContextSummary(userId: string): Promise<string> {
  const supabase = await createClient()

  try {
    // Fetch minimal data
    const { data: profile } = await supabase
      .from('user_profile')
      .select('filing_status, employment_status, dependents')
      .eq('user_id', userId)
      .single()

    const { data: taxDebt } = await supabase
      .from('tax_debt')
      .select('current_balance, tax_year')
      .eq('user_id', userId)

    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, category')
      .eq('user_id', userId)
      .eq('is_removed', false)
      .gte('date', format(subMonths(new Date(), 3), 'yyyy-MM-dd'))
      .limit(100)

    const summary: string[] = []

    if (profile) {
      summary.push(
        `Filing status: ${profile.filing_status || 'not set'}, Dependents: ${profile.dependents}`
      )
    }

    if (taxDebt && taxDebt.length > 0) {
      const totalDebt = taxDebt.reduce((sum, debt) => sum + debt.current_balance, 0)
      summary.push(`Tax debt: $${totalDebt.toFixed(2)} across ${taxDebt.length} year(s)`)
    }

    if (transactions && transactions.length > 0) {
      const income = transactions.filter((tx) => tx.amount > 0).length
      const expenses = transactions.filter((tx) => tx.amount < 0).length
      summary.push(`Recent transactions: ${income} income, ${expenses} expenses`)
    }

    return summary.join('. ')
  } catch (error) {
    console.error('Error building context summary:', error)
    return 'User has financial data available'
  }
}
