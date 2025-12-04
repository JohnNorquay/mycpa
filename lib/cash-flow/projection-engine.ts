import type { Tables } from '@/types'
import { calculateNextExpected, calculateHistoricalVariance } from './recurring-detector'

type RecurringTransaction = Tables<'recurring_transactions'>
type Transaction = Tables<'transactions'>

export interface ExpectedTransaction {
  id: string
  merchantName: string
  category: string | null
  expectedAmount: number
  date: string | undefined
  isIncome: boolean
  confidence: 'high' | 'medium' | 'low'
}

export interface DailyProjection {
  date: string | undefined
  expectedBalance: number
  expectedTransactions: ExpectedTransaction[]
  runningBalance: number
}

export interface CashFlowProjection {
  startDate: string | undefined
  endDate: string | undefined
  startingBalance: number
  projections: DailyProjection[]
  lowestBalance: number
  lowestBalanceDate: string | undefined
  totalIncome: number
  totalExpenses: number
}

export interface BalanceProjection {
  targetDate: string | undefined
  currentBalance: number
  projectedBalance: number
  bestCase: number
  worstCase: number
  confidence: 'high' | 'medium' | 'low'
  expectedTransactions: ExpectedTransaction[]
}

/**
 * Get expected transactions for a specific date
 */
export function getExpectedTransactionsForDate(
  recurringItems: RecurringTransaction[],
  targetDate: Date
): ExpectedTransaction[] {
  const expectedTransactions: ExpectedTransaction[] = []
  const targetDateStr = targetDate.toISOString().split('T')[0]

  for (const item of recurringItems) {
    if (!item.is_active) continue
    if (!item.next_expected) continue

    const nextExpected = new Date(item.next_expected)
    const nextExpectedStr = nextExpected.toISOString().split('T')[0]

    // Check if this recurring item is due on the target date
    if (nextExpectedStr === targetDateStr) {
      let confidence: 'high' | 'medium' | 'low' = 'medium'

      // Determine confidence based on variance
      if (item.amount_variance !== null && item.expected_amount !== null) {
        const variancePercent = (item.amount_variance / item.expected_amount) * 100
        if (variancePercent < 5) {
          confidence = 'high'
        } else if (variancePercent > 20) {
          confidence = 'low'
        }
      }

      expectedTransactions.push({
        id: item.id,
        merchantName: item.merchant_name,
        category: item.category,
        expectedAmount: item.expected_amount || 0,
        date: targetDateStr,
        isIncome: item.is_income,
        confidence,
      })
    }
  }

  return expectedTransactions
}

/**
 * Calculate all occurrences of a recurring transaction between two dates
 */
function getOccurrencesBetweenDates(
  item: RecurringTransaction,
  startDate: Date,
  endDate: Date
): ExpectedTransaction[] {
  if (!item.is_active || !item.frequency || !item.next_expected) {
    return []
  }

  const occurrences: ExpectedTransaction[] = []
  let currentDate = new Date(item.next_expected)

  // Start from the next expected date or the start date, whichever is later
  if (currentDate < startDate) {
    currentDate = new Date(startDate)
  }

  let confidence: 'high' | 'medium' | 'low' = 'medium'
  if (item.amount_variance !== null && item.expected_amount !== null) {
    const variancePercent = (item.amount_variance / item.expected_amount) * 100
    if (variancePercent < 5) {
      confidence = 'high'
    } else if (variancePercent > 20) {
      confidence = 'low'
    }
  }

  // Generate occurrences up to end date
  while (currentDate <= endDate) {
    if (currentDate >= startDate) {
      occurrences.push({
        id: item.id,
        merchantName: item.merchant_name,
        category: item.category,
        expectedAmount: item.expected_amount || 0,
        date: currentDate.toISOString().split('T')[0],
        isIncome: item.is_income,
        confidence,
      })
    }

    // Calculate next occurrence
    currentDate = calculateNextExpected(currentDate, item.frequency, item.expected_day)
  }

  return occurrences
}

/**
 * Generate daily cash flow projections
 */
export function generateCashFlowProjection(
  startingBalance: number,
  recurringItems: RecurringTransaction[],
  startDate: Date,
  endDate: Date
): CashFlowProjection {
  // Collect all expected transactions in the date range
  const allExpectedTransactions: ExpectedTransaction[] = []

  for (const item of recurringItems) {
    const occurrences = getOccurrencesBetweenDates(item, startDate, endDate)
    allExpectedTransactions.push(...occurrences)
  }

  // Group transactions by date
  const transactionsByDate = new Map<string, ExpectedTransaction[]>()
  for (const transaction of allExpectedTransactions) {
    const dateStr = transaction.date
    if (!dateStr) continue
    const group = transactionsByDate.get(dateStr) || []
    group.push(transaction)
    transactionsByDate.set(dateStr, group)
  }

  // Generate daily projections
  const projections: DailyProjection[] = []
  let runningBalance = startingBalance
  let lowestBalance = startingBalance
  let lowestBalanceDate = startDate.toISOString().split('T')[0]
  let totalIncome = 0
  let totalExpenses = 0

  // Iterate through each day in the range
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0] || ''
    if (!dateStr) break
    const expectedTransactions = transactionsByDate.get(dateStr) || []

    // Calculate expected balance for this day
    let dayIncome = 0
    let dayExpenses = 0

    for (const transaction of expectedTransactions) {
      if (transaction.isIncome) {
        dayIncome += transaction.expectedAmount
        totalIncome += transaction.expectedAmount
        runningBalance += transaction.expectedAmount
      } else {
        dayExpenses += transaction.expectedAmount
        totalExpenses += transaction.expectedAmount
        runningBalance -= transaction.expectedAmount
      }
    }

    // Track lowest balance
    if (runningBalance < lowestBalance) {
      lowestBalance = runningBalance
      lowestBalanceDate = dateStr
    }

    projections.push({
      date: dateStr,
      expectedBalance: runningBalance,
      expectedTransactions,
      runningBalance,
    })

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    startingBalance,
    projections,
    lowestBalance,
    lowestBalanceDate,
    totalIncome,
    totalExpenses,
  }
}

/**
 * Calculate "where will I be" projection for a target date
 * Includes best case, expected, and worst case scenarios
 */
export function calculateBalanceOnDate(
  currentBalance: number,
  recurringItems: RecurringTransaction[],
  targetDate: Date,
  historicalTransactions?: Map<string, Transaction[]>
): BalanceProjection {
  const today = new Date()
  const targetDateStr = targetDate.toISOString().split('T')[0]

  // Get all expected transactions between now and target date
  const expectedTransactions: ExpectedTransaction[] = []
  let expectedBalance = currentBalance
  let bestCaseBalance = currentBalance
  let worstCaseBalance = currentBalance
  let overallConfidence: 'high' | 'medium' | 'low' = 'high'

  for (const item of recurringItems) {
    const occurrences = getOccurrencesBetweenDates(item, today, targetDate)

    for (const occurrence of occurrences) {
      expectedTransactions.push(occurrence)

      // Calculate variance for confidence intervals
      let variance = item.amount_variance || 0
      let stdDev = 0

      // If we have historical transactions, calculate more accurate variance
      if (historicalTransactions && historicalTransactions.has(item.id)) {
        const history = historicalTransactions.get(item.id)!
        const stats = calculateHistoricalVariance(history)
        stdDev = stats.stdDev
        variance = stats.maxAmount - stats.minAmount
      }

      // Update balances
      if (occurrence.isIncome) {
        expectedBalance += occurrence.expectedAmount
        bestCaseBalance += occurrence.expectedAmount + stdDev
        worstCaseBalance += occurrence.expectedAmount - stdDev
      } else {
        expectedBalance -= occurrence.expectedAmount
        bestCaseBalance -= occurrence.expectedAmount - stdDev
        worstCaseBalance -= occurrence.expectedAmount + stdDev
      }

      // Update overall confidence
      if (occurrence.confidence === 'low') {
        overallConfidence = 'low'
      } else if (occurrence.confidence === 'medium' && overallConfidence === 'high') {
        overallConfidence = 'medium'
      }
    }
  }

  // If there are many transactions, reduce confidence
  if (expectedTransactions.length > 10) {
    if (overallConfidence === 'high') {
      overallConfidence = 'medium'
    } else if (overallConfidence === 'medium') {
      overallConfidence = 'low'
    }
  }

  return {
    targetDate: targetDateStr,
    currentBalance,
    projectedBalance: expectedBalance,
    bestCase: bestCaseBalance,
    worstCase: worstCaseBalance,
    confidence: overallConfidence,
    expectedTransactions,
  }
}
