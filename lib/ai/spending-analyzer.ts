import type { Tables } from '@/types'
import { format, subMonths, parseISO, startOfMonth, endOfMonth, isSameMonth } from 'date-fns'

export interface CategoryBreakdown {
  category: string
  total: number
  count: number
  percentage: number
  averageTransaction: number
}

export interface MonthlyComparison {
  category: string
  currentMonth: number
  previousMonth: number
  change: number
  percentageChange: number
}

export interface SpendingAnalysis {
  totalSpending: number
  categoryBreakdown: CategoryBreakdown[]
  monthlyComparison: MonthlyComparison[]
  savingsRate: number
  topCategories: CategoryBreakdown[]
}

export interface Trend {
  category: string
  trend: 'increasing' | 'decreasing' | 'stable'
  percentageChange: number
  description: string
}

export interface Anomaly {
  transaction: Tables<'transactions'>
  type: 'unusual_amount' | 'new_merchant_large' | 'new_subscription' | 'missing_recurring'
  severity: 'high' | 'medium' | 'low'
  description: string
}

/**
 * Calculate category breakdown from transactions
 */
export function calculateCategoryBreakdown(
  transactions: Tables<'transactions'>[]
): CategoryBreakdown[] {
  const expenses = transactions.filter((tx) => tx.amount < 0)

  if (expenses.length === 0) {
    return []
  }

  const totalSpending = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  // Group by category
  const categoryMap = new Map<string, { total: number; count: number }>()

  expenses.forEach((tx) => {
    const category = tx.category || 'Uncategorized'
    const current = categoryMap.get(category) || { total: 0, count: 0 }
    categoryMap.set(category, {
      total: current.total + Math.abs(tx.amount),
      count: current.count + 1,
    })
  })

  // Convert to array and calculate percentages
  const breakdown: CategoryBreakdown[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: (data.total / totalSpending) * 100,
      averageTransaction: data.total / data.count,
    })
  )

  // Sort by total (descending)
  breakdown.sort((a, b) => b.total - a.total)

  return breakdown
}

/**
 * Calculate month-over-month comparison
 */
export function calculateMonthlyComparison(
  transactions: Tables<'transactions'>[]
): MonthlyComparison[] {
  const now = new Date()
  const currentMonthStart = startOfMonth(now)
  const currentMonthEnd = endOfMonth(now)
  const previousMonthStart = startOfMonth(subMonths(now, 1))
  const previousMonthEnd = endOfMonth(subMonths(now, 1))

  // Split transactions by month
  const currentMonthTxs = transactions.filter((tx) => {
    const txDate = parseISO(tx.date)
    return txDate >= currentMonthStart && txDate <= currentMonthEnd && tx.amount < 0
  })

  const previousMonthTxs = transactions.filter((tx) => {
    const txDate = parseISO(tx.date)
    return txDate >= previousMonthStart && txDate <= previousMonthEnd && tx.amount < 0
  })

  // Calculate category totals for each month
  const currentCategories = new Map<string, number>()
  const previousCategories = new Map<string, number>()

  currentMonthTxs.forEach((tx) => {
    const category = tx.category || 'Uncategorized'
    currentCategories.set(category, (currentCategories.get(category) || 0) + Math.abs(tx.amount))
  })

  previousMonthTxs.forEach((tx) => {
    const category = tx.category || 'Uncategorized'
    previousCategories.set(category, (previousCategories.get(category) || 0) + Math.abs(tx.amount))
  })

  // Build comparison array
  const allCategories = new Set([...currentCategories.keys(), ...previousCategories.keys()])
  const comparison: MonthlyComparison[] = []

  allCategories.forEach((category) => {
    const currentMonth = currentCategories.get(category) || 0
    const previousMonth = previousCategories.get(category) || 0
    const change = currentMonth - previousMonth
    const percentageChange = previousMonth > 0 ? (change / previousMonth) * 100 : 0

    comparison.push({
      category,
      currentMonth,
      previousMonth,
      change,
      percentageChange,
    })
  })

  // Sort by absolute change (descending)
  comparison.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

  return comparison
}

/**
 * Calculate savings rate from income and expenses
 */
export function calculateSavingsRate(transactions: Tables<'transactions'>[]): number {
  const income = transactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0)

  const expenses = transactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  if (income === 0) {
    return 0
  }

  const savings = income - expenses
  return (savings / income) * 100
}

/**
 * Perform complete spending analysis
 */
export function analyzeSpending(transactions: Tables<'transactions'>[]): SpendingAnalysis {
  const expenses = transactions.filter((tx) => tx.amount < 0)
  const totalSpending = expenses.reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

  const categoryBreakdown = calculateCategoryBreakdown(transactions)
  const monthlyComparison = calculateMonthlyComparison(transactions)
  const savingsRate = calculateSavingsRate(transactions)

  // Get top 5 categories
  const topCategories = categoryBreakdown.slice(0, 5)

  return {
    totalSpending,
    categoryBreakdown,
    monthlyComparison,
    savingsRate,
    topCategories,
  }
}

/**
 * Detect spending trends (increasing/decreasing categories)
 */
export function detectTrends(transactions: Tables<'transactions'>[]): Trend[] {
  const comparison = calculateMonthlyComparison(transactions)
  const trends: Trend[] = []

  comparison.forEach((comp) => {
    // Skip if spending is too low (less than $50 in both months)
    if (comp.currentMonth < 50 && comp.previousMonth < 50) {
      return
    }

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
    let description = ''

    // Determine trend based on percentage change
    if (Math.abs(comp.percentageChange) >= 20) {
      if (comp.percentageChange > 0) {
        trend = 'increasing'
        description = `${comp.category} spending increased by ${Math.abs(comp.percentageChange).toFixed(1)}% ($${Math.abs(comp.change).toFixed(2)})`
      } else {
        trend = 'decreasing'
        description = `${comp.category} spending decreased by ${Math.abs(comp.percentageChange).toFixed(1)}% ($${Math.abs(comp.change).toFixed(2)})`
      }

      trends.push({
        category: comp.category,
        trend,
        percentageChange: comp.percentageChange,
        description,
      })
    }
  })

  // Sort by absolute percentage change (most significant first)
  trends.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange))

  return trends.slice(0, 10) // Return top 10 trends
}

/**
 * Detect anomalies in transactions
 */
export function detectAnomalies(
  transactions: Tables<'transactions'>[],
  recurringTransactions: Tables<'recurring_transactions'>[]
): Anomaly[] {
  const anomalies: Anomaly[] = []

  // Calculate statistics for each category
  const categoryStats = calculateCategoryStatistics(transactions)

  // 1. Unusual transaction amounts (>2 standard deviations)
  transactions
    .filter((tx) => tx.amount < 0) // Only expenses
    .forEach((tx) => {
      const category = tx.category || 'Uncategorized'
      const stats = categoryStats.get(category)

      if (stats) {
        const amount = Math.abs(tx.amount)
        const zScore = (amount - stats.mean) / stats.stdDev

        if (zScore > 2 && amount > 100) {
          // Significant deviation and substantial amount
          anomalies.push({
            transaction: tx,
            type: 'unusual_amount',
            severity: zScore > 3 ? 'high' : 'medium',
            description: `Unusual ${category} charge of $${amount.toFixed(2)} at ${tx.merchant_name || 'Unknown'} (${zScore.toFixed(1)}x higher than average)`,
          })
        }
      }
    })

  // 2. New merchant large purchases (>$200)
  const merchantHistory = new Map<string, number>()
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  sortedTransactions.forEach((tx) => {
    if (tx.merchant_name && tx.amount < 0) {
      const count = merchantHistory.get(tx.merchant_name) || 0
      merchantHistory.set(tx.merchant_name, count + 1)

      if (count === 0 && Math.abs(tx.amount) > 200) {
        // First transaction with this merchant and it's large
        anomalies.push({
          transaction: tx,
          type: 'new_merchant_large',
          severity: Math.abs(tx.amount) > 500 ? 'high' : 'medium',
          description: `First purchase at ${tx.merchant_name} for $${Math.abs(tx.amount).toFixed(2)}`,
        })
      }
    }
  })

  // 3. New subscription detection (recurring small charges from new merchants)
  const recentTransactions = transactions.filter((tx) => {
    const txDate = parseISO(tx.date)
    return txDate >= subMonths(new Date(), 3) && tx.amount < 0 && Math.abs(tx.amount) < 100
  })

  const potentialSubscriptions = findPotentialSubscriptions(recentTransactions)
  potentialSubscriptions.forEach((tx) => {
    anomalies.push({
      transaction: tx,
      type: 'new_subscription',
      severity: 'low',
      description: `Possible new subscription: ${tx.merchant_name || 'Unknown'} ($${Math.abs(tx.amount).toFixed(2)}/month)`,
    })
  })

  // 4. Missing expected recurring transactions
  const now = new Date()
  recurringTransactions
    .filter((rec) => rec.is_active && rec.next_expected)
    .forEach((rec) => {
      const nextExpected = parseISO(rec.next_expected!)
      if (nextExpected < now) {
        // Expected transaction is overdue
        const daysOverdue = Math.floor(
          (now.getTime() - nextExpected.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysOverdue > 7) {
          // Create a pseudo-transaction for the anomaly
          const pseudoTx: Tables<'transactions'> = {
            id: `missing-${rec.id}`,
            user_id: rec.user_id,
            account_id: null,
            transaction_id: `missing-${rec.id}`,
            date: rec.next_expected!,
            amount: rec.expected_amount || 0,
            merchant_name: rec.merchant_name,
            category: rec.category,
            category_confidence: null,
            is_tax_deductible: false,
            is_recurring: true,
            recurrence_pattern: null,
            notes: null,
            receipt_document_id: null,
            is_removed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          anomalies.push({
            transaction: pseudoTx,
            type: 'missing_recurring',
            severity: daysOverdue > 14 ? 'high' : 'medium',
            description: `Expected ${rec.is_income ? 'income' : 'payment'} from ${rec.merchant_name} is ${daysOverdue} days overdue`,
          })
        }
      }
    })

  // Sort by severity (high > medium > low)
  const severityOrder = { high: 0, medium: 1, low: 2 }
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return anomalies.slice(0, 20) // Return top 20 anomalies
}

/**
 * Calculate mean and standard deviation for each category
 */
function calculateCategoryStatistics(
  transactions: Tables<'transactions'>[]
): Map<string, { mean: number; stdDev: number }> {
  const categoryAmounts = new Map<string, number[]>()

  transactions
    .filter((tx) => tx.amount < 0)
    .forEach((tx) => {
      const category = tx.category || 'Uncategorized'
      const amounts = categoryAmounts.get(category) || []
      amounts.push(Math.abs(tx.amount))
      categoryAmounts.set(category, amounts)
    })

  const stats = new Map<string, { mean: number; stdDev: number }>()

  categoryAmounts.forEach((amounts, category) => {
    if (amounts.length < 3) {
      return // Need at least 3 transactions for meaningful statistics
    }

    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
    const variance = amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length
    const stdDev = Math.sqrt(variance)

    stats.set(category, { mean, stdDev })
  })

  return stats
}

/**
 * Find potential new subscriptions (recurring charges from same merchant)
 */
function findPotentialSubscriptions(
  recentTransactions: Tables<'transactions'>[]
): Tables<'transactions'>[] {
  const merchantCounts = new Map<string, Tables<'transactions'>[]>()

  recentTransactions.forEach((tx) => {
    if (tx.merchant_name && !tx.is_recurring) {
      const txs = merchantCounts.get(tx.merchant_name) || []
      txs.push(tx)
      merchantCounts.set(tx.merchant_name, txs)
    }
  })

  const potentialSubs: Tables<'transactions'>[] = []

  merchantCounts.forEach((txs, merchant) => {
    // Look for merchants with 2+ transactions in last 3 months
    if (txs.length >= 2) {
      // Check if amounts are similar (within 10%)
      const amounts = txs.map((tx) => Math.abs(tx.amount))
      const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length
      const allSimilar = amounts.every((a) => Math.abs(a - avgAmount) / avgAmount < 0.1)

      if (allSimilar) {
        // Likely a subscription - return the most recent transaction
        const mostRecent = txs.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]
        if (mostRecent) {
          potentialSubs.push(mostRecent)
        }
      }
    }
  })

  return potentialSubs
}
