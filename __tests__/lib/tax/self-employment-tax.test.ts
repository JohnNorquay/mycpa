import { describe, it, expect } from 'vitest'
import {
  calculateSelfEmploymentTax,
  getSelfEmploymentTaxDeduction,
  calculateNetSelfEmploymentIncome,
  estimateQuarterlyPayment,
  isSubjectToSelfEmploymentTax,
  SE_TAX_CONSTANTS_2024,
} from '@/lib/tax/self-employment-tax'

describe('Self-Employment Tax Calculator', () => {
  describe('calculateSelfEmploymentTax', () => {
    it('returns zero tax for zero income', () => {
      const result = calculateSelfEmploymentTax(0, 'single')

      expect(result.totalSelfEmploymentTax).toBe(0)
      expect(result.deductiblePortion).toBe(0)
    })

    it('returns zero tax for negative income', () => {
      const result = calculateSelfEmploymentTax(-1000, 'single')

      expect(result.totalSelfEmploymentTax).toBe(0)
    })

    it('calculates correct deductible income (92.35%)', () => {
      const result = calculateSelfEmploymentTax(100000, 'single')

      expect(result.deductibleIncome).toBe(100000 * 0.9235)
    })

    it('calculates correct Social Security tax', () => {
      const result = calculateSelfEmploymentTax(100000, 'single')

      // 92.35% of $100,000 = $92,350
      // SS tax = $92,350 * 12.4% = $11,451.40
      expect(result.socialSecurityTax).toBeCloseTo(11451.4, 1)
    })

    it('caps Social Security tax at wage base', () => {
      // Income way above wage base
      const result = calculateSelfEmploymentTax(250000, 'single')

      // Deductible income = $230,875 (92.35% of $250,000)
      // But SS is capped at wage base of $168,600
      // SS tax = $168,600 * 12.4% = $20,906.40
      expect(result.socialSecurityTax).toBeCloseTo(20906.4, 1)
    })

    it('calculates correct Medicare tax (2.9%)', () => {
      const result = calculateSelfEmploymentTax(100000, 'single')

      // 92.35% of $100,000 = $92,350
      // Medicare = $92,350 * 2.9% = $2,678.15
      expect(result.medicareTax).toBeCloseTo(2678.15, 1)
    })

    it('calculates additional Medicare tax for high earners', () => {
      // Income over $200,000 threshold for single filers
      const result = calculateSelfEmploymentTax(300000, 'single')

      // Deductible income = $277,050 (92.35% of $300,000)
      // Total earned income over $200,000 threshold = $77,050
      // Additional Medicare = $77,050 * 0.9% = $693.45
      expect(result.additionalMedicareTax).toBeCloseTo(693.45, 1)
    })

    it('no additional Medicare tax below threshold', () => {
      const result = calculateSelfEmploymentTax(150000, 'single')

      // Deductible income = $138,525 (below $200,000 threshold)
      expect(result.additionalMedicareTax).toBe(0)
    })

    it('uses higher threshold for married filing jointly', () => {
      const result = calculateSelfEmploymentTax(230000, 'married_filing_jointly')

      // Deductible income = $212,405 (below $250,000 MFJ threshold)
      expect(result.additionalMedicareTax).toBe(0)
    })

    it('uses lower threshold for married filing separately', () => {
      const result = calculateSelfEmploymentTax(150000, 'married_filing_separately')

      // Deductible income = $138,525 (above $125,000 MFS threshold)
      // Additional Medicare = ($138,525 - $125,000) * 0.9% = $121.725
      expect(result.additionalMedicareTax).toBeGreaterThan(0)
    })

    it('calculates deductible portion as 50% of total SE tax', () => {
      const result = calculateSelfEmploymentTax(100000, 'single')

      expect(result.deductiblePortion).toBe(result.totalSelfEmploymentTax * 0.5)
    })

    it('considers other income when calculating Social Security cap', () => {
      const otherIncome = 100000 // W-2 wages
      const result = calculateSelfEmploymentTax(100000, 'single', otherIncome)

      // Remaining wage base = $168,600 - $100,000 = $68,600
      // Deductible income = $92,350
      // SS base = min($92,350, $68,600) = $68,600
      // SS tax = $68,600 * 12.4% = $8,506.40
      expect(result.socialSecurityTax).toBeCloseTo(8506.4, 1)
    })

    it('considers other income for additional Medicare threshold', () => {
      const otherIncome = 150000 // W-2 wages
      const result = calculateSelfEmploymentTax(100000, 'single', otherIncome)

      // Deductible SE income = $92,350
      // Total earned = $92,350 + $150,000 = $242,350
      // Over threshold: $242,350 - $200,000 = $42,350
      // Additional Medicare = $42,350 * 0.9% = $381.15
      expect(result.additionalMedicareTax).toBeCloseTo(381.15, 1)
    })

    it('calculates correct total SE tax', () => {
      const result = calculateSelfEmploymentTax(100000, 'single')

      const expectedTotal =
        result.socialSecurityTax + result.medicareTax + result.additionalMedicareTax
      expect(result.totalSelfEmploymentTax).toBeCloseTo(expectedTotal, 1)
    })
  })

  describe('getSelfEmploymentTaxDeduction', () => {
    it('returns 50% of SE tax', () => {
      const deduction = getSelfEmploymentTaxDeduction(100000, 'single')
      const fullCalculation = calculateSelfEmploymentTax(100000, 'single')

      expect(deduction).toBe(fullCalculation.deductiblePortion)
    })

    it('handles zero income', () => {
      const deduction = getSelfEmploymentTaxDeduction(0, 'single')
      expect(deduction).toBe(0)
    })
  })

  describe('calculateNetSelfEmploymentIncome', () => {
    it('calculates net income correctly', () => {
      const net = calculateNetSelfEmploymentIncome(100000, 40000)
      expect(net).toBe(60000)
    })

    it('returns zero when expenses exceed income', () => {
      const net = calculateNetSelfEmploymentIncome(40000, 50000)
      expect(net).toBe(0)
    })

    it('returns gross when no expenses', () => {
      const net = calculateNetSelfEmploymentIncome(75000, 0)
      expect(net).toBe(75000)
    })
  })

  describe('estimateQuarterlyPayment', () => {
    it('returns 1/4 of annual SE tax', () => {
      const quarterly = estimateQuarterlyPayment(100000, 'single')
      const annual = calculateSelfEmploymentTax(100000, 'single')

      expect(quarterly).toBeCloseTo(annual.totalSelfEmploymentTax / 4, 2)
    })

    it('handles zero income', () => {
      const quarterly = estimateQuarterlyPayment(0, 'single')
      expect(quarterly).toBe(0)
    })
  })

  describe('isSubjectToSelfEmploymentTax', () => {
    it('returns true for income >= $400', () => {
      expect(isSubjectToSelfEmploymentTax(400)).toBe(true)
      expect(isSubjectToSelfEmploymentTax(1000)).toBe(true)
    })

    it('returns false for income < $400', () => {
      expect(isSubjectToSelfEmploymentTax(399)).toBe(false)
      expect(isSubjectToSelfEmploymentTax(0)).toBe(false)
    })

    it('returns false for negative income', () => {
      expect(isSubjectToSelfEmploymentTax(-1000)).toBe(false)
    })
  })

  describe('SE Tax Constants', () => {
    it('has correct 2024 rates', () => {
      expect(SE_TAX_CONSTANTS_2024.socialSecurityRate).toBe(0.124)
      expect(SE_TAX_CONSTANTS_2024.medicareRate).toBe(0.029)
      expect(SE_TAX_CONSTANTS_2024.additionalMedicareRate).toBe(0.009)
    })

    it('has correct 2024 wage base', () => {
      expect(SE_TAX_CONSTANTS_2024.socialSecurityWageBase).toBe(168600)
    })

    it('has correct additional Medicare thresholds', () => {
      expect(SE_TAX_CONSTANTS_2024.additionalMedicareThreshold.single).toBe(200000)
      expect(SE_TAX_CONSTANTS_2024.additionalMedicareThreshold.married_filing_jointly).toBe(250000)
      expect(SE_TAX_CONSTANTS_2024.additionalMedicareThreshold.married_filing_separately).toBe(
        125000
      )
    })

    it('has correct deduction factor', () => {
      expect(SE_TAX_CONSTANTS_2024.deductionFactor).toBe(0.9235)
    })
  })
})
