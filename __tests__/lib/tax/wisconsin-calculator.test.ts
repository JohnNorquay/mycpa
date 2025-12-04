import { describe, it, expect } from 'vitest'
import {
  mapToWisconsinFilingStatus,
  calculateWisconsinStandardDeduction,
  calculateWisconsinTax,
  getWisconsinMarginalRate,
  WISCONSIN_TAX_BRACKETS_2024,
  WISCONSIN_STANDARD_DEDUCTION_2024,
  WISCONSIN_STANDARD_DEDUCTION_PHASEOUT_2024,
} from '@/lib/tax/wisconsin-calculator'

describe('Wisconsin Tax Calculator', () => {
  describe('mapToWisconsinFilingStatus', () => {
    it('maps single to single', () => {
      expect(mapToWisconsinFilingStatus('single')).toBe('single')
    })

    it('maps married_filing_jointly to married_joint', () => {
      expect(mapToWisconsinFilingStatus('married_filing_jointly')).toBe('married_joint')
    })

    it('maps qualifying_widow to married_joint', () => {
      expect(mapToWisconsinFilingStatus('qualifying_widow')).toBe('married_joint')
    })

    it('maps married_filing_separately to married_separate', () => {
      expect(mapToWisconsinFilingStatus('married_filing_separately')).toBe('married_separate')
    })

    it('maps head_of_household to head_of_household', () => {
      expect(mapToWisconsinFilingStatus('head_of_household')).toBe('head_of_household')
    })
  })

  describe('calculateWisconsinStandardDeduction', () => {
    it('returns full deduction below phase-out threshold (single)', () => {
      const deduction = calculateWisconsinStandardDeduction(100000, 'single')
      expect(deduction).toBe(WISCONSIN_STANDARD_DEDUCTION_2024.single)
    })

    it('returns full deduction at phase-out threshold', () => {
      const threshold = WISCONSIN_STANDARD_DEDUCTION_PHASEOUT_2024.single.start
      const deduction = calculateWisconsinStandardDeduction(threshold, 'single')
      expect(deduction).toBe(WISCONSIN_STANDARD_DEDUCTION_2024.single)
    })

    it('phases out deduction above threshold', () => {
      const threshold = WISCONSIN_STANDARD_DEDUCTION_PHASEOUT_2024.single.start
      const excess = 10000
      const rate = WISCONSIN_STANDARD_DEDUCTION_PHASEOUT_2024.single.rate

      const deduction = calculateWisconsinStandardDeduction(threshold + excess, 'single')

      const expected = WISCONSIN_STANDARD_DEDUCTION_2024.single - excess * rate
      expect(deduction).toBeCloseTo(expected, 2)
    })

    it('returns zero when fully phased out', () => {
      // Very high income should result in zero deduction
      const deduction = calculateWisconsinStandardDeduction(500000, 'single')
      expect(deduction).toBe(0)
    })

    it('calculates correctly for married filing jointly', () => {
      const deduction = calculateWisconsinStandardDeduction(100000, 'married_joint')
      expect(deduction).toBe(WISCONSIN_STANDARD_DEDUCTION_2024.married_joint)
    })
  })

  describe('calculateWisconsinTax', () => {
    it('returns zero tax for zero income', () => {
      const result = calculateWisconsinTax(0, 'single')

      expect(result.totalTax).toBe(0)
      expect(result.effectiveRate).toBe(0)
      expect(result.marginalRate).toBe(0)
    })

    it('returns zero tax when income is below deduction', () => {
      // Income below standard deduction
      const result = calculateWisconsinTax(10000, 'single')

      expect(result.totalTax).toBe(0)
      expect(result.wisconsinTaxableIncome).toBe(0)
    })

    it('calculates correct tax for income in first bracket (single)', () => {
      // $25,000 AGI - $12,760 deduction = $12,240 taxable (first bracket)
      const result = calculateWisconsinTax(25000, 'single')

      // All taxable income in 4% bracket
      expect(result.marginalRate).toBe(0.04)
      expect(result.totalTax).toBeCloseTo(12240 * 0.04, 0)
    })

    it('calculates correct tax for income in second bracket', () => {
      // $35,000 AGI - $12,760 deduction = $22,240 taxable
      // First bracket ends at $13,810, so this spans into second bracket
      const result = calculateWisconsinTax(35000, 'single')

      // Spans 4% and 5.3% brackets
      expect(result.marginalRate).toBe(0.053)
    })

    it('calculates correct tax for income in third bracket', () => {
      // $100,000 AGI - $12,760 deduction = $87,240 taxable
      const result = calculateWisconsinTax(100000, 'single')

      // Spans into 6.27% bracket
      expect(result.marginalRate).toBe(0.0627)
    })

    it('applies wisconsin adjustments', () => {
      const adjustments = 5000 // e.g., out-of-state income subtraction
      const result = calculateWisconsinTax(50000, 'single', adjustments)

      // Wisconsin AGI should be federal AGI + adjustments
      expect(result.wisconsinAGI).toBe(55000)
    })

    it('uses itemized deductions when greater than standard', () => {
      const itemized = 20000 // Greater than single standard of $12,760
      const result = calculateWisconsinTax(50000, 'single', 0, itemized)

      expect(result.totalDeduction).toBe(20000)
    })

    it('uses standard deduction when greater than itemized', () => {
      const itemized = 5000 // Less than single standard of $12,760
      const result = calculateWisconsinTax(50000, 'single', 0, itemized)

      expect(result.totalDeduction).toBe(WISCONSIN_STANDARD_DEDUCTION_2024.single)
    })

    it('calculates tax for married filing jointly', () => {
      const result = calculateWisconsinTax(150000, 'married_joint')

      // Should have appropriate deduction and brackets
      expect(result.standardDeduction).toBe(WISCONSIN_STANDARD_DEDUCTION_2024.married_joint)
      expect(result.totalTax).toBeGreaterThan(0)
    })

    it('includes tax breakdown by bracket', () => {
      const result = calculateWisconsinTax(100000, 'single')

      expect(result.taxByBracket.length).toBeGreaterThan(1)
      expect(result.taxByBracket[0]).toHaveProperty('rate')
      expect(result.taxByBracket[0]).toHaveProperty('income')
      expect(result.taxByBracket[0]).toHaveProperty('tax')
    })
  })

  describe('getWisconsinMarginalRate', () => {
    it('returns 0 for zero income', () => {
      expect(getWisconsinMarginalRate(0, 'single')).toBe(0)
    })

    it('returns 0 for negative income', () => {
      expect(getWisconsinMarginalRate(-1000, 'single')).toBe(0)
    })

    it('returns 4% for income in first bracket', () => {
      expect(getWisconsinMarginalRate(10000, 'single')).toBe(0.04)
    })

    it('returns 5.3% for income in second bracket', () => {
      expect(getWisconsinMarginalRate(20000, 'single')).toBe(0.053)
    })

    it('returns 6.27% for income in third bracket', () => {
      expect(getWisconsinMarginalRate(100000, 'single')).toBe(0.0627)
    })

    it('returns 7.65% for income in top bracket', () => {
      expect(getWisconsinMarginalRate(500000, 'single')).toBe(0.0765)
    })

    it('returns correct rate for married joint filing', () => {
      expect(getWisconsinMarginalRate(100000, 'married_joint')).toBe(0.0627)
    })
  })

  describe('Wisconsin Tax Constants', () => {
    it('has correct standard deductions for 2024', () => {
      expect(WISCONSIN_STANDARD_DEDUCTION_2024.single).toBe(12760)
      expect(WISCONSIN_STANDARD_DEDUCTION_2024.married_joint).toBe(23620)
      expect(WISCONSIN_STANDARD_DEDUCTION_2024.married_separate).toBe(11810)
      expect(WISCONSIN_STANDARD_DEDUCTION_2024.head_of_household).toBe(18760)
    })

    it('has tax brackets defined for all filing statuses', () => {
      expect(WISCONSIN_TAX_BRACKETS_2024.single).toBeDefined()
      expect(WISCONSIN_TAX_BRACKETS_2024.married_joint).toBeDefined()
      expect(WISCONSIN_TAX_BRACKETS_2024.married_separate).toBeDefined()
      expect(WISCONSIN_TAX_BRACKETS_2024.head_of_household).toBeDefined()
    })

    it('has 4 tax brackets per status', () => {
      expect(WISCONSIN_TAX_BRACKETS_2024.single).toHaveLength(4)
      expect(WISCONSIN_TAX_BRACKETS_2024.married_joint).toHaveLength(4)
    })

    it('has highest bracket rate of 7.65%', () => {
      const singleBrackets = WISCONSIN_TAX_BRACKETS_2024.single
      expect(singleBrackets[singleBrackets.length - 1].rate).toBe(0.0765)
    })

    it('has correct phase-out thresholds', () => {
      expect(WISCONSIN_STANDARD_DEDUCTION_PHASEOUT_2024.single.start).toBe(120760)
      expect(WISCONSIN_STANDARD_DEDUCTION_PHASEOUT_2024.married_joint.start).toBe(173960)
    })
  })
})
