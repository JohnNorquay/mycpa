import { describe, it, expect } from 'vitest'
import {
  calculateFederalTax,
  getMarginalRate,
  calculateTaxableIncome,
  calculateCompleteFederalTax,
  STANDARD_DEDUCTION_2024,
  FEDERAL_TAX_BRACKETS_2024,
} from '@/lib/tax/federal-calculator'

describe('Federal Tax Calculator', () => {
  describe('calculateFederalTax', () => {
    it('returns zero tax for zero income', () => {
      const result = calculateFederalTax(0, 'single')

      expect(result.totalTax).toBe(0)
      expect(result.effectiveRate).toBe(0)
      expect(result.marginalRate).toBe(0)
      expect(result.taxByBracket).toEqual([])
    })

    it('returns zero tax for negative income', () => {
      const result = calculateFederalTax(-1000, 'single')

      expect(result.totalTax).toBe(0)
      expect(result.effectiveRate).toBe(0)
    })

    it('calculates correct tax for income in first bracket (single)', () => {
      // $10,000 income, 10% bracket
      const result = calculateFederalTax(10000, 'single')

      expect(result.totalTax).toBe(1000) // 10,000 * 0.10
      expect(result.marginalRate).toBe(0.1)
      expect(result.effectiveRate).toBe(0.1)
    })

    it('calculates correct tax for income in second bracket (single)', () => {
      // $30,000 income spans 10% and 12% brackets
      // First $11,600 at 10% = $1,160
      // Next $18,400 ($30,000 - $11,600) at 12% = $2,208
      // Total = $3,368
      const result = calculateFederalTax(30000, 'single')

      expect(result.totalTax).toBeCloseTo(3368, 0)
      expect(result.marginalRate).toBe(0.12)
    })

    it('calculates correct tax for income in 22% bracket (single)', () => {
      // $75,000 taxable income
      // baseTax at 47,150 = $5,426
      // Additional: (75,000 - 47,150) * 0.22 = $6,127
      // Total = $11,553
      const result = calculateFederalTax(75000, 'single')

      expect(result.totalTax).toBeCloseTo(11553, 0)
      expect(result.marginalRate).toBe(0.22)
    })

    it('calculates correct tax for married filing jointly in 12% bracket', () => {
      // $60,000 income for MFJ
      // First $23,200 at 10% = $2,320
      // Next $36,800 ($60,000 - $23,200) at 12% = $4,416
      // Total = $6,736
      const result = calculateFederalTax(60000, 'married_filing_jointly')

      expect(result.totalTax).toBeCloseTo(6736, 0)
      expect(result.marginalRate).toBe(0.12)
    })

    it('calculates correct tax for head of household', () => {
      // $50,000 income for HoH
      // First $16,550 at 10% = $1,655
      // Next $33,450 ($50,000 - $16,550) at 12% = $4,014
      // Total = $5,669
      const result = calculateFederalTax(50000, 'head_of_household')

      expect(result.totalTax).toBeCloseTo(5669, 0)
      expect(result.marginalRate).toBe(0.12)
    })

    it('calculates tax for high income in 37% bracket', () => {
      // $700,000 income for single (37% bracket)
      const result = calculateFederalTax(700000, 'single')

      // baseTax at 609,350 = $183,647.25
      // Additional: (700,000 - 609,350) * 0.37 = $33,540.50
      // Total = $217,187.75
      expect(result.totalTax).toBeCloseTo(217187.75, 0)
      expect(result.marginalRate).toBe(0.37)
    })

    it('includes tax breakdown by bracket', () => {
      const result = calculateFederalTax(50000, 'single')

      expect(result.taxByBracket).toHaveLength(3) // spans 10%, 12%, 22%
      expect(result.taxByBracket[0]).toEqual({
        rate: 0.1,
        income: 11600,
        tax: 1160,
      })
    })
  })

  describe('getMarginalRate', () => {
    it('returns 0 for zero income', () => {
      expect(getMarginalRate(0, 'single')).toBe(0)
    })

    it('returns 0 for negative income', () => {
      expect(getMarginalRate(-1000, 'single')).toBe(0)
    })

    it('returns 10% for income in first bracket', () => {
      expect(getMarginalRate(5000, 'single')).toBe(0.1)
    })

    it('returns 12% for income in second bracket', () => {
      expect(getMarginalRate(25000, 'single')).toBe(0.12)
    })

    it('returns 22% for income in third bracket', () => {
      expect(getMarginalRate(60000, 'single')).toBe(0.22)
    })

    it('returns 37% for very high income', () => {
      expect(getMarginalRate(1000000, 'single')).toBe(0.37)
    })

    it('returns correct rate for married filing jointly', () => {
      expect(getMarginalRate(60000, 'married_filing_jointly')).toBe(0.12)
    })
  })

  describe('calculateTaxableIncome', () => {
    it('uses standard deduction when no itemized deductions', () => {
      const result = calculateTaxableIncome(50000, 'single')

      expect(result).toBe(50000 - STANDARD_DEDUCTION_2024.single)
    })

    it('uses itemized deductions when greater than standard', () => {
      const itemized = 20000 // greater than single standard of $14,600
      const result = calculateTaxableIncome(50000, 'single', itemized)

      expect(result).toBe(50000 - 20000)
    })

    it('uses standard deduction when itemized is less', () => {
      const itemized = 10000 // less than single standard of $14,600
      const result = calculateTaxableIncome(50000, 'single', itemized)

      expect(result).toBe(50000 - STANDARD_DEDUCTION_2024.single)
    })

    it('applies adjustments before deductions', () => {
      const adjustments = 5000
      const result = calculateTaxableIncome(50000, 'single', 0, adjustments)

      // AGI = 50000 - 5000 = 45000
      // Taxable = 45000 - 14600 = 30400
      expect(result).toBe(45000 - STANDARD_DEDUCTION_2024.single)
    })

    it('returns 0 when deductions exceed income', () => {
      const result = calculateTaxableIncome(10000, 'single')

      expect(result).toBe(0) // 10000 - 14600 = -4600 -> 0
    })

    it('uses correct standard deduction for married filing jointly', () => {
      const result = calculateTaxableIncome(50000, 'married_filing_jointly')

      expect(result).toBe(50000 - STANDARD_DEDUCTION_2024.married_filing_jointly)
    })
  })

  describe('calculateCompleteFederalTax', () => {
    it('calculates complete tax for simple case', () => {
      const result = calculateCompleteFederalTax({
        grossIncome: 75000,
        filingStatus: 'single',
      })

      // AGI = 75000
      // Taxable = 75000 - 14600 = 60400
      expect(result.grossIncome).toBe(75000)
      expect(result.adjustedGrossIncome).toBe(75000)
      expect(result.taxableIncome).toBe(75000 - STANDARD_DEDUCTION_2024.single)
      expect(result.totalTax).toBeGreaterThan(0)
    })

    it('applies adjustments to AGI', () => {
      const result = calculateCompleteFederalTax({
        grossIncome: 75000,
        filingStatus: 'single',
        adjustments: 5000,
      })

      expect(result.adjustedGrossIncome).toBe(70000)
    })

    it('uses itemized deductions when larger', () => {
      const result = calculateCompleteFederalTax({
        grossIncome: 100000,
        filingStatus: 'single',
        itemizedDeductions: 25000,
      })

      expect(result.taxableIncome).toBe(100000 - 25000)
    })

    it('handles married filing jointly correctly', () => {
      const result = calculateCompleteFederalTax({
        grossIncome: 150000,
        filingStatus: 'married_filing_jointly',
      })

      // AGI = 150000
      // Taxable = 150000 - 29200 = 120800
      expect(result.taxableIncome).toBe(150000 - STANDARD_DEDUCTION_2024.married_filing_jointly)
    })
  })

  describe('Tax Bracket Constants', () => {
    it('has correct standard deductions for 2024', () => {
      expect(STANDARD_DEDUCTION_2024.single).toBe(14600)
      expect(STANDARD_DEDUCTION_2024.married_filing_jointly).toBe(29200)
      expect(STANDARD_DEDUCTION_2024.married_filing_separately).toBe(14600)
      expect(STANDARD_DEDUCTION_2024.head_of_household).toBe(21900)
      expect(STANDARD_DEDUCTION_2024.qualifying_widow).toBe(29200)
    })

    it('has tax brackets defined for all filing statuses', () => {
      expect(FEDERAL_TAX_BRACKETS_2024.single).toBeDefined()
      expect(FEDERAL_TAX_BRACKETS_2024.married_filing_jointly).toBeDefined()
      expect(FEDERAL_TAX_BRACKETS_2024.married_filing_separately).toBeDefined()
      expect(FEDERAL_TAX_BRACKETS_2024.head_of_household).toBeDefined()
      expect(FEDERAL_TAX_BRACKETS_2024.qualifying_widow).toBeDefined()
    })

    it('single brackets have 7 tiers', () => {
      expect(FEDERAL_TAX_BRACKETS_2024.single).toHaveLength(7)
    })

    it('highest bracket rate is 37%', () => {
      const singleBrackets = FEDERAL_TAX_BRACKETS_2024.single
      expect(singleBrackets[singleBrackets.length - 1].rate).toBe(0.37)
    })
  })
})
