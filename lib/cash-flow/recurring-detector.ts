import type { Tables } from '@/types'

type Transaction = Tables<'transactions'>

export type RecurringFrequency =
  | 'weekly'
  | 'biweekly'
  | 'semimonthly'
  | 'monthly'
  | 'quarterly'
  | 'annual'

export type RecurringConfidence = 'high' | 'medium' | 'low'

export interface DetectedRecurringPattern {
  merchantName: string
  category: string | null
  expectedAmount: number
  amountVariance: number
  frequency: RecurringFrequency
  expectedDay: number | null // day of month (1-31) or day of week (0-6) for weekly
  lastOccurrence: string
  nextExpected: string
  isIncome: boolean
  confidence: RecurringConfidence
  occurrenceCount: number
  timingVariancePercent: number
  amountVariancePercent: number
}

/**
 * Normalize merchant name for grouping
 * Removes common variations to better group transactions
 */
export function normalizeMerchant(merchantName: string): string {
  return merchantName
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\s*#\d+.*$/, '') // Remove location numbers (e.g., "Store #123")
    .replace(/\s*-\s*\d+.*$/, '') // Remove dashes with numbers
    .replace(/\s*\*+.*$/, '') // Remove asterisks
    .trim()
}

/**
 * Calculate the number of days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Detect frequency based on average interval between transactions
 */
function detectFrequency(intervals: number[]): {
  frequency: RecurringFrequency | null
  expectedDay: number | null
} {
  if (intervals.length === 0) {
    return { frequency: null, expectedDay: null }
  }

  const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length

  // Weekly: 7±1 days
  if (avgInterval >= 6 && avgInterval <= 8) {
    return { frequency: 'weekly', expectedDay: null }
  }

  // Biweekly: 14±1 days
  if (avgInterval >= 13 && avgInterval <= 15) {
    return { frequency: 'biweekly', expectedDay: null }
  }

  // Semimonthly: ~15 days
  if (avgInterval >= 14 && avgInterval <= 16) {
    return { frequency: 'semimonthly', expectedDay: null }
  }

  // Monthly: 30±3 days
  if (avgInterval >= 27 && avgInterval <= 33) {
    return { frequency: 'monthly', expectedDay: null }
  }

  // Quarterly: ~90 days
  if (avgInterval >= 85 && avgInterval <= 95) {
    return { frequency: 'quarterly', expectedDay: null }
  }

  // Annual: ~365 days
  if (avgInterval >= 355 && avgInterval <= 375) {
    return { frequency: 'annual', expectedDay: null }
  }

  return { frequency: null, expectedDay: null }
}

/**
 * Calculate expected day for monthly patterns
 */
function calculateExpectedDay(dates: Date[], frequency: RecurringFrequency): number | null {
  if (frequency === 'weekly' || frequency === 'biweekly') {
    // For weekly patterns, use day of week (0-6)
    const daysOfWeek = dates.map((d) => d.getDay())
    const avgDay = daysOfWeek.reduce((sum, val) => sum + val, 0) / daysOfWeek.length
    return Math.round(avgDay)
  }

  if (frequency === 'monthly' || frequency === 'semimonthly') {
    // For monthly patterns, use day of month (1-31)
    const daysOfMonth = dates.map((d) => d.getDate())
    const avgDay = daysOfMonth.reduce((sum, val) => sum + val, 0) / daysOfMonth.length
    return Math.round(avgDay)
  }

  return null
}

/**
 * Calculate variance as a percentage
 */
function calculateVariancePercent(values: number[]): number {
  if (values.length === 0) return 100

  const avg = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  return avg === 0 ? 0 : (stdDev / avg) * 100
}

/**
 * Calculate confidence score based on occurrence count and variance
 */
function calculateConfidence(
  occurrenceCount: number,
  timingVariancePercent: number,
  amountVariancePercent: number
): RecurringConfidence {
  // High: 6+ occurrences, <5% timing/amount variance
  if (occurrenceCount >= 6 && timingVariancePercent < 5 && amountVariancePercent < 5) {
    return 'high'
  }

  // Medium: 3-5 occurrences, <20% variance
  if (
    occurrenceCount >= 3 &&
    occurrenceCount < 6 &&
    timingVariancePercent < 20 &&
    amountVariancePercent < 20
  ) {
    return 'medium'
  }

  // Low: 3 occurrences, higher variance
  if (occurrenceCount >= 3) {
    return 'low'
  }

  // Not enough data
  return 'low'
}

/**
 * Calculate the next expected transaction date based on frequency
 */
export function calculateNextExpected(
  lastOccurrence: Date,
  frequency: RecurringFrequency,
  expectedDay?: number | null
): Date {
  const next = new Date(lastOccurrence)

  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'biweekly':
      next.setDate(next.getDate() + 14)
      break
    case 'semimonthly':
      next.setDate(next.getDate() + 15)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      if (expectedDay) {
        next.setDate(expectedDay)
      }
      break
    case 'quarterly':
      next.setMonth(next.getMonth() + 3)
      break
    case 'annual':
      next.setFullYear(next.getFullYear() + 1)
      break
  }

  return next
}

/**
 * Group transactions by normalized merchant name
 */
function groupByMerchant(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>()

  for (const transaction of transactions) {
    if (!transaction.merchant_name) continue

    const normalizedMerchant = normalizeMerchant(transaction.merchant_name)
    const group = groups.get(normalizedMerchant) || []
    group.push(transaction)
    groups.set(normalizedMerchant, group)
  }

  return groups
}

/**
 * Analyze a group of transactions for recurring patterns
 */
function analyzeGroup(
  merchantName: string,
  transactions: Transaction[]
): DetectedRecurringPattern | null {
  // Need at least 3 occurrences to detect a pattern
  if (transactions.length < 3) {
    return null
  }

  // Sort by date
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate intervals between transactions
  const intervals: number[] = []
  const dates: Date[] = sorted.map((t) => new Date(t.date))
  const amounts: number[] = sorted.map((t) => Math.abs(t.amount))

  for (let i = 1; i < dates.length; i++) {
    const prevDate = dates[i - 1]
    const currDate = dates[i]
    if (prevDate && currDate) {
      intervals.push(daysBetween(prevDate, currDate))
    }
  }

  // Detect frequency
  const { frequency, expectedDay: initialExpectedDay } = detectFrequency(intervals)

  if (!frequency) {
    return null
  }

  // Calculate expected day
  const expectedDay = initialExpectedDay || calculateExpectedDay(dates, frequency)

  // Calculate variances
  const timingVariancePercent = calculateVariancePercent(intervals)
  const amountVariancePercent = calculateVariancePercent(amounts)

  // Calculate confidence
  const confidence = calculateConfidence(
    sorted.length,
    timingVariancePercent,
    amountVariancePercent
  )

  // Calculate expected amount and variance
  const expectedAmount = amounts.reduce((sum, val) => sum + val, 0) / amounts.length
  const amountVariance = Math.max(...amounts) - Math.min(...amounts)

  // Determine if it's income (positive amount)
  const firstTransaction = sorted[0]
  const lastTransaction = sorted[sorted.length - 1]

  if (!firstTransaction || !lastTransaction) {
    return null
  }

  const isIncome = firstTransaction.amount > 0
  const lastOccurrence = lastTransaction.date
  const nextExpected =
    calculateNextExpected(new Date(lastOccurrence), frequency, expectedDay)
      .toISOString()
      .split('T')[0] || ''

  if (!nextExpected) {
    return null
  }

  return {
    merchantName: firstTransaction.merchant_name || merchantName,
    category: firstTransaction.category,
    expectedAmount,
    amountVariance,
    frequency,
    expectedDay,
    lastOccurrence,
    nextExpected,
    isIncome,
    confidence,
    occurrenceCount: sorted.length,
    timingVariancePercent,
    amountVariancePercent,
  }
}

/**
 * Detect recurring transaction patterns from a list of transactions
 * @param transactions - List of transactions to analyze
 * @param minOccurrences - Minimum number of occurrences to consider a pattern (default: 3)
 * @returns Array of detected recurring patterns
 */
export function detectRecurringPatterns(
  transactions: Transaction[],
  minOccurrences: number = 3
): DetectedRecurringPattern[] {
  // Group transactions by merchant
  const merchantGroups = groupByMerchant(transactions)

  const patterns: DetectedRecurringPattern[] = []

  // Analyze each group
  for (const [merchantName, group] of merchantGroups) {
    if (group.length < minOccurrences) continue

    const pattern = analyzeGroup(merchantName, group)
    if (pattern) {
      patterns.push(pattern)
    }
  }

  // Sort by confidence and occurrence count
  return patterns.sort((a, b) => {
    const confidenceOrder = { high: 3, medium: 2, low: 1 }
    const confidenceDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
    if (confidenceDiff !== 0) return confidenceDiff
    return b.occurrenceCount - a.occurrenceCount
  })
}

/**
 * Calculate historical variance for a recurring transaction
 * Used for confidence intervals in projections
 */
export function calculateHistoricalVariance(transactions: Transaction[]): {
  minAmount: number
  maxAmount: number
  avgAmount: number
  stdDev: number
} {
  if (transactions.length === 0) {
    return { minAmount: 0, maxAmount: 0, avgAmount: 0, stdDev: 0 }
  }

  const amounts = transactions.map((t) => Math.abs(t.amount))
  const avgAmount = amounts.reduce((sum, val) => sum + val, 0) / amounts.length
  const variance =
    amounts.reduce((sum, val) => sum + Math.pow(val - avgAmount, 2), 0) / amounts.length
  const stdDev = Math.sqrt(variance)

  return {
    minAmount: Math.min(...amounts),
    maxAmount: Math.max(...amounts),
    avgAmount,
    stdDev,
  }
}
