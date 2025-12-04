import { describe, it, expect } from 'vitest'
import {
  normalizeMerchant,
  calculateNextExpected,
  detectRecurringPatterns,
  calculateHistoricalVariance,
  type RecurringFrequency,
} from '@/lib/cash-flow/recurring-detector'

// Helper to create mock transactions
function createTransaction(
  date: string,
  amount: number,
  merchantName: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    id: `tx-${date}-${Math.random()}`,
    user_id: 'user-123',
    account_id: 'account-123',
    date,
    amount,
    merchant_name: merchantName,
    category: 'Bills',
    plaid_transaction_id: null,
    description: null,
    notes: null,
    is_tax_deductible: false,
    is_recurring: false,
    is_removed: false,
    pending: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('Recurring Detector', () => {
  describe('normalizeMerchant', () => {
    it('converts to lowercase', () => {
      expect(normalizeMerchant('NETFLIX')).toBe('netflix')
    })

    it('normalizes whitespace', () => {
      expect(normalizeMerchant('Net  Flix')).toBe('net flix')
    })

    it('removes store location numbers', () => {
      expect(normalizeMerchant('Walmart #1234')).toBe('walmart')
    })

    it('removes dash with numbers', () => {
      expect(normalizeMerchant('Amazon - 12345')).toBe('amazon')
    })

    it('removes asterisks', () => {
      expect(normalizeMerchant('SPOTIFY*SUBSCRIPTION')).toBe('spotify')
    })

    it('trims whitespace', () => {
      expect(normalizeMerchant('  Netflix  ')).toBe('netflix')
    })

    it('handles complex merchant names', () => {
      expect(normalizeMerchant('GOOGLE *YouTube Premium #123')).toBe('google')
    })
  })

  describe('calculateNextExpected', () => {
    const baseDate = new Date('2024-01-15')

    it('adds 7 days for weekly frequency', () => {
      const next = calculateNextExpected(baseDate, 'weekly')
      expect(next.toISOString().split('T')[0]).toBe('2024-01-22')
    })

    it('adds 14 days for biweekly frequency', () => {
      const next = calculateNextExpected(baseDate, 'biweekly')
      expect(next.toISOString().split('T')[0]).toBe('2024-01-29')
    })

    it('adds 15 days for semimonthly frequency', () => {
      const next = calculateNextExpected(baseDate, 'semimonthly')
      expect(next.toISOString().split('T')[0]).toBe('2024-01-30')
    })

    it('adds 1 month for monthly frequency', () => {
      const next = calculateNextExpected(baseDate, 'monthly')
      expect(next.toISOString().split('T')[0]).toBe('2024-02-15')
    })

    it('uses expectedDay for monthly frequency', () => {
      const next = calculateNextExpected(baseDate, 'monthly', 1)
      // Date manipulation may shift by timezone - check the date is close to expected
      expect(next.getDate()).toBe(1)
      expect(next.getMonth()).toBe(1) // February (0-indexed)
    })

    it('adds 3 months for quarterly frequency', () => {
      const next = calculateNextExpected(baseDate, 'quarterly')
      // April is month 3 (0-indexed)
      expect(next.getMonth()).toBe(3)
      expect(next.getFullYear()).toBe(2024)
    })

    it('adds 1 year for annual frequency', () => {
      const next = calculateNextExpected(baseDate, 'annual')
      expect(next.toISOString().split('T')[0]).toBe('2025-01-15')
    })
  })

  describe('detectRecurringPatterns', () => {
    it('returns empty array for empty transactions', () => {
      const patterns = detectRecurringPatterns([])
      expect(patterns).toEqual([])
    })

    it('returns empty array for fewer than min occurrences', () => {
      const transactions = [
        createTransaction('2024-01-01', -10, 'Netflix'),
        createTransaction('2024-02-01', -10, 'Netflix'),
      ]
      const patterns = detectRecurringPatterns(transactions, 3)
      expect(patterns).toEqual([])
    })

    it('detects monthly recurring pattern', () => {
      const transactions = [
        createTransaction('2024-01-15', -15.99, 'Netflix'),
        createTransaction('2024-02-15', -15.99, 'Netflix'),
        createTransaction('2024-03-15', -15.99, 'Netflix'),
        createTransaction('2024-04-15', -15.99, 'Netflix'),
      ]

      const patterns = detectRecurringPatterns(transactions)

      expect(patterns).toHaveLength(1)
      expect(patterns[0]!.frequency).toBe('monthly')
      expect(patterns[0]!.expectedAmount).toBe(15.99)
      expect(patterns[0]!.merchantName).toBe('Netflix')
    })

    it('detects weekly recurring pattern', () => {
      const transactions = [
        createTransaction('2024-01-01', -50, 'Grocery Store'),
        createTransaction('2024-01-08', -55, 'Grocery Store'),
        createTransaction('2024-01-15', -48, 'Grocery Store'),
        createTransaction('2024-01-22', -52, 'Grocery Store'),
      ]

      const patterns = detectRecurringPatterns(transactions)

      expect(patterns).toHaveLength(1)
      expect(patterns[0]!.frequency).toBe('weekly')
    })

    it('detects biweekly recurring pattern', () => {
      const transactions = [
        createTransaction('2024-01-05', 2500, 'ACME Corp Payroll'),
        createTransaction('2024-01-19', 2500, 'ACME Corp Payroll'),
        createTransaction('2024-02-02', 2500, 'ACME Corp Payroll'),
        createTransaction('2024-02-16', 2500, 'ACME Corp Payroll'),
      ]

      const patterns = detectRecurringPatterns(transactions)

      expect(patterns).toHaveLength(1)
      expect(patterns[0]!.frequency).toBe('biweekly')
      expect(patterns[0]!.isIncome).toBe(true)
    })

    it('normalizes merchant names when grouping', () => {
      const transactions = [
        createTransaction('2024-01-01', -10, 'SPOTIFY*SUBSCRIPTION'),
        createTransaction('2024-02-01', -10, 'SPOTIFY *Premium'),
        createTransaction('2024-03-01', -10, 'Spotify'),
      ]

      const patterns = detectRecurringPatterns(transactions)

      expect(patterns).toHaveLength(1)
    })

    it('identifies income transactions correctly', () => {
      const transactions = [
        createTransaction('2024-01-15', 5000, 'Salary'),
        createTransaction('2024-02-15', 5000, 'Salary'),
        createTransaction('2024-03-15', 5000, 'Salary'),
      ]

      const patterns = detectRecurringPatterns(transactions)

      expect(patterns[0]!.isIncome).toBe(true)
    })

    it('identifies expense transactions correctly', () => {
      const transactions = [
        createTransaction('2024-01-01', -100, 'Electric Company'),
        createTransaction('2024-02-01', -105, 'Electric Company'),
        createTransaction('2024-03-01', -98, 'Electric Company'),
      ]

      const patterns = detectRecurringPatterns(transactions)

      expect(patterns[0]!.isIncome).toBe(false)
    })

    it('calculates amount variance', () => {
      const transactions = [
        createTransaction('2024-01-01', -100, 'Utility'),
        createTransaction('2024-02-01', -150, 'Utility'),
        createTransaction('2024-03-01', -125, 'Utility'),
      ]

      const patterns = detectRecurringPatterns(transactions)

      expect(patterns[0]!.amountVariance).toBe(50) // max - min = 150 - 100
    })

    it('sorts patterns by confidence and occurrence count', () => {
      // Create two patterns - one with more occurrences
      const transactions = [
        // 6 occurrences of Netflix (high confidence)
        createTransaction('2024-01-15', -15.99, 'Netflix'),
        createTransaction('2024-02-15', -15.99, 'Netflix'),
        createTransaction('2024-03-15', -15.99, 'Netflix'),
        createTransaction('2024-04-15', -15.99, 'Netflix'),
        createTransaction('2024-05-15', -15.99, 'Netflix'),
        createTransaction('2024-06-15', -15.99, 'Netflix'),
        // 3 occurrences of Hulu (lower confidence)
        createTransaction('2024-01-20', -7.99, 'Hulu'),
        createTransaction('2024-02-20', -7.99, 'Hulu'),
        createTransaction('2024-03-20', -7.99, 'Hulu'),
      ]

      const patterns = detectRecurringPatterns(transactions)

      expect(patterns).toHaveLength(2)
      expect(patterns[0]!.merchantName).toBe('Netflix')
      expect(patterns[0]!.confidence).toBe('high')
    })

    it('calculates next expected date', () => {
      const transactions = [
        createTransaction('2024-01-15', -100, 'Rent'),
        createTransaction('2024-02-15', -100, 'Rent'),
        createTransaction('2024-03-15', -100, 'Rent'),
      ]

      const patterns = detectRecurringPatterns(transactions)

      expect(patterns[0]!.nextExpected).toBe('2024-04-15')
    })

    it('ignores transactions without merchant name', () => {
      const transactions = [
        createTransaction('2024-01-01', -100, ''),
        createTransaction('2024-02-01', -100, ''),
        createTransaction('2024-03-01', -100, ''),
      ]

      // Clear merchant names
      transactions.forEach((t) => (t.merchant_name = null as unknown as string))

      const patterns = detectRecurringPatterns(transactions)

      expect(patterns).toHaveLength(0)
    })
  })

  describe('calculateHistoricalVariance', () => {
    it('returns zeros for empty array', () => {
      const result = calculateHistoricalVariance([])

      expect(result.minAmount).toBe(0)
      expect(result.maxAmount).toBe(0)
      expect(result.avgAmount).toBe(0)
      expect(result.stdDev).toBe(0)
    })

    it('calculates correct min and max', () => {
      const transactions = [
        createTransaction('2024-01-01', -100, 'Test'),
        createTransaction('2024-02-01', -150, 'Test'),
        createTransaction('2024-03-01', -75, 'Test'),
      ]

      const result = calculateHistoricalVariance(transactions)

      expect(result.minAmount).toBe(75)
      expect(result.maxAmount).toBe(150)
    })

    it('calculates correct average', () => {
      const transactions = [
        createTransaction('2024-01-01', -100, 'Test'),
        createTransaction('2024-02-01', -200, 'Test'),
        createTransaction('2024-03-01', -300, 'Test'),
      ]

      const result = calculateHistoricalVariance(transactions)

      expect(result.avgAmount).toBe(200) // (100 + 200 + 300) / 3
    })

    it('uses absolute values for amounts', () => {
      const transactions = [
        createTransaction('2024-01-01', -100, 'Test'),
        createTransaction('2024-02-01', 100, 'Test'), // positive (income)
      ]

      const result = calculateHistoricalVariance(transactions)

      expect(result.avgAmount).toBe(100)
    })

    it('calculates standard deviation', () => {
      const transactions = [
        createTransaction('2024-01-01', -10, 'Test'),
        createTransaction('2024-02-01', -20, 'Test'),
        createTransaction('2024-03-01', -30, 'Test'),
      ]

      const result = calculateHistoricalVariance(transactions)

      // avg = 20, variance = ((10-20)^2 + (20-20)^2 + (30-20)^2) / 3 = 66.67
      // stdDev = sqrt(66.67) ≈ 8.16
      expect(result.stdDev).toBeCloseTo(8.16, 1)
    })
  })

  describe('frequency detection edge cases', () => {
    it('detects quarterly patterns', () => {
      const transactions = [
        createTransaction('2024-01-15', -500, 'Insurance'),
        createTransaction('2024-04-15', -500, 'Insurance'),
        createTransaction('2024-07-15', -500, 'Insurance'),
      ]

      const patterns = detectRecurringPatterns(transactions)

      expect(patterns).toHaveLength(1)
      expect(patterns[0]!.frequency).toBe('quarterly')
    })

    it('handles truly irregular intervals without detecting pattern', () => {
      // Create transactions with very irregular intervals that won't match any pattern
      const transactions = [
        createTransaction('2024-01-01', -100, 'Random'),
        createTransaction('2024-01-05', -100, 'Random'), // 4 days
        createTransaction('2024-03-15', -100, 'Random'), // 69 days
      ]

      const patterns = detectRecurringPatterns(transactions)

      // Intervals are 4 days and 69 days - too irregular for any frequency
      expect(patterns).toHaveLength(0)
    })

    it('respects minOccurrences parameter', () => {
      const transactions = [
        createTransaction('2024-01-01', -10, 'Netflix'),
        createTransaction('2024-02-01', -10, 'Netflix'),
        createTransaction('2024-03-01', -10, 'Netflix'),
        createTransaction('2024-04-01', -10, 'Netflix'),
        createTransaction('2024-05-01', -10, 'Netflix'),
      ]

      const patternsMin3 = detectRecurringPatterns(transactions, 3)
      const patternsMin6 = detectRecurringPatterns(transactions, 6)

      expect(patternsMin3).toHaveLength(1)
      expect(patternsMin6).toHaveLength(0)
    })
  })
})
