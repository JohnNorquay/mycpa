import { describe, it, expect } from 'vitest'
import {
  getCapitalGainsRate,
  calculateCapitalGainsTax,
  calculateNetInvestmentIncomeTax,
  areQualifiedDividends,
  calculateShortTermCapitalGainsTax,
  calculateTotalCapitalGainsTax,
  LONG_TERM_CAPITAL_GAINS_BRACKETS_2024,
  NIIT_THRESHOLDS_2024,
  NIIT_RATE,
} from '@/lib/tax/capital-gains-tax'

describe('Capital Gains Tax Calculator', () => {
  describe('getCapitalGainsRate', () => {
    it('returns 0% for low income single filer', () => {
      expect(getCapitalGainsRate(40000, 'single')).toBe(0)
    })

    it('returns 15% for middle income single filer', () => {
      expect(getCapitalGainsRate(100000, 'single')).toBe(0.15)
    })

    it('returns 20% for high income single filer', () => {
      expect(getCapitalGainsRate(600000, 'single')).toBe(0.2)
    })

    it('uses correct thresholds for married filing jointly', () => {
      expect(getCapitalGainsRate(50000, 'married_filing_jointly')).toBe(0)
      expect(getCapitalGainsRate(200000, 'married_filing_jointly')).toBe(0.15)
      expect(getCapitalGainsRate(700000, 'married_filing_jointly')).toBe(0.2)
    })

    it('uses correct thresholds for head of household', () => {
      expect(getCapitalGainsRate(60000, 'head_of_household')).toBe(0)
      expect(getCapitalGainsRate(100000, 'head_of_household')).toBe(0.15)
    })
  })

  describe('calculateCapitalGainsTax', () => {
    it('returns zero tax for no capital gains', () => {
      const result = calculateCapitalGainsTax(50000, 0, 0, 'single')

      expect(result.capitalGainsTax).toBe(0)
      expect(result.totalTax).toBe(0)
    })

    it('calculates 0% rate for low income', () => {
      // $30,000 ordinary + $10,000 gains = $40,000 total (below 0% threshold)
      const result = calculateCapitalGainsTax(30000, 10000, 0, 'single')

      expect(result.capitalGainsTax).toBe(0)
      expect(result.breakdown.at0Percent).toBe(10000)
    })

    it('calculates 15% rate for middle income', () => {
      // $60,000 ordinary + $50,000 gains = $110,000 total (in 15% bracket)
      const result = calculateCapitalGainsTax(60000, 50000, 0, 'single')

      // All gains are in 15% bracket
      expect(result.capitalGainsTax).toBeCloseTo(50000 * 0.15, 0)
      expect(result.breakdown.at15Percent).toBe(50000)
    })

    it('calculates stacked rates when gains span brackets', () => {
      // $40,000 ordinary + $20,000 gains = $60,000 total
      // 0% bracket threshold for single is $47,025
      // So $7,025 of gains at 0% and $12,975 at 15%
      const result = calculateCapitalGainsTax(40000, 20000, 0, 'single')

      expect(result.breakdown.at0Percent).toBeCloseTo(7025, 0)
      expect(result.breakdown.at15Percent).toBeCloseTo(12975, 0)
      expect(result.capitalGainsTax).toBeCloseTo(12975 * 0.15, 0)
    })

    it('includes qualified dividends with capital gains', () => {
      const result = calculateCapitalGainsTax(60000, 20000, 10000, 'single')

      expect(result.totalPreferentialIncome).toBe(30000)
    })

    it('calculates effective rate on capital gains', () => {
      const result = calculateCapitalGainsTax(60000, 50000, 0, 'single')

      expect(result.capitalGainsRate).toBeCloseTo(0.15, 2)
    })

    it('includes NIIT for high earners', () => {
      // High income scenario - over NIIT threshold
      const result = calculateCapitalGainsTax(180000, 50000, 0, 'single')

      expect(result.netInvestmentIncomeTax).toBeGreaterThan(0)
    })
  })

  describe('calculateNetInvestmentIncomeTax', () => {
    it('returns 0 for no investment income', () => {
      const niit = calculateNetInvestmentIncomeTax(0, 250000, 'single')
      expect(niit).toBe(0)
    })

    it('returns 0 when MAGI below threshold', () => {
      const niit = calculateNetInvestmentIncomeTax(50000, 150000, 'single')
      expect(niit).toBe(0)
    })

    it('calculates NIIT when MAGI exceeds threshold', () => {
      // MAGI $250,000, threshold $200,000, excess $50,000
      // Investment income $30,000
      // NIIT = min(30000, 50000) * 3.8% = $1,140
      const niit = calculateNetInvestmentIncomeTax(30000, 250000, 'single')
      expect(niit).toBeCloseTo(30000 * NIIT_RATE, 0)
    })

    it('caps NIIT at excess MAGI', () => {
      // MAGI $220,000, threshold $200,000, excess $20,000
      // Investment income $50,000
      // NIIT = min(50000, 20000) * 3.8% = $760
      const niit = calculateNetInvestmentIncomeTax(50000, 220000, 'single')
      expect(niit).toBeCloseTo(20000 * NIIT_RATE, 0)
    })

    it('uses correct threshold for married filing jointly', () => {
      // MFJ threshold is $250,000
      const niit = calculateNetInvestmentIncomeTax(50000, 260000, 'married_filing_jointly')
      expect(niit).toBeCloseTo(10000 * NIIT_RATE, 0)
    })

    it('uses lower threshold for married filing separately', () => {
      // MFS threshold is $125,000
      const niit = calculateNetInvestmentIncomeTax(50000, 175000, 'married_filing_separately')
      expect(niit).toBeCloseTo(50000 * NIIT_RATE, 0)
    })
  })

  describe('areQualifiedDividends', () => {
    it('returns true for dividends with holding period met', () => {
      expect(areQualifiedDividends(1000, true)).toBe(true)
    })

    it('returns false for dividends without holding period', () => {
      expect(areQualifiedDividends(1000, false)).toBe(false)
    })

    it('returns false for zero dividends', () => {
      expect(areQualifiedDividends(0, true)).toBe(false)
    })

    it('returns false for negative dividends', () => {
      expect(areQualifiedDividends(-100, true)).toBe(false)
    })
  })

  describe('calculateShortTermCapitalGainsTax', () => {
    it('calculates tax at marginal rate', () => {
      const tax = calculateShortTermCapitalGainsTax(10000, 0.22)
      expect(tax).toBe(2200)
    })

    it('returns 0 for negative gains', () => {
      const tax = calculateShortTermCapitalGainsTax(-5000, 0.22)
      expect(tax).toBe(0)
    })

    it('returns 0 for zero gains', () => {
      const tax = calculateShortTermCapitalGainsTax(0, 0.22)
      expect(tax).toBe(0)
    })
  })

  describe('calculateTotalCapitalGainsTax', () => {
    it('calculates combined tax for all types of gains', () => {
      const result = calculateTotalCapitalGainsTax({
        ordinaryIncome: 75000,
        longTermCapitalGains: 20000,
        shortTermCapitalGains: 5000,
        qualifiedDividends: 2000,
        nonQualifiedDividends: 1000,
        filingStatus: 'single',
        marginalOrdinaryRate: 0.22,
      })

      expect(result.longTermTax).toBeGreaterThan(0)
      expect(result.shortTermTax).toBe(5000 * 0.22)
      expect(result.nonQualifiedDividendsTax).toBe(1000 * 0.22)
      expect(result.totalTax).toBeGreaterThan(0)
    })

    it('includes NIIT in total for high earners', () => {
      const result = calculateTotalCapitalGainsTax({
        ordinaryIncome: 200000,
        longTermCapitalGains: 100000,
        shortTermCapitalGains: 0,
        qualifiedDividends: 0,
        nonQualifiedDividends: 0,
        filingStatus: 'single',
        marginalOrdinaryRate: 0.32,
      })

      expect(result.netInvestmentIncomeTax).toBeGreaterThan(0)
    })
  })

  describe('Capital Gains Constants', () => {
    it('has correct 2024 single brackets', () => {
      const brackets = LONG_TERM_CAPITAL_GAINS_BRACKETS_2024.single
      expect(brackets[0]!.maxIncome).toBe(47025)
      expect(brackets[0]!.rate).toBe(0)
      expect(brackets[1]!.maxIncome).toBe(518900)
      expect(brackets[1]!.rate).toBe(0.15)
      expect(brackets[2]!.rate).toBe(0.2)
    })

    it('has correct NIIT thresholds', () => {
      expect(NIIT_THRESHOLDS_2024.single).toBe(200000)
      expect(NIIT_THRESHOLDS_2024.married_filing_jointly).toBe(250000)
      expect(NIIT_THRESHOLDS_2024.married_filing_separately).toBe(125000)
    })

    it('has correct NIIT rate', () => {
      expect(NIIT_RATE).toBe(0.038)
    })
  })
})
