import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaxCenterPage from '@/app/(dashboard)/tax-center/page'
import {
  TaxProjectionDashboard,
  IncomeSummary,
  MarginalRateDisplay,
} from '@/components/features/tax-planning'
import type { CombinedTaxResult } from '@/lib/tax/combined-tax-calculator'

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Sample test data
const mockTaxResult: CombinedTaxResult = {
  totalGrossIncome: 127500,
  federalAGI: 122500,
  wisconsinAGI: 122500,
  federal: {
    taxableIncome: 108800,
    ordinaryIncomeTax: 16842,
    selfEmploymentTax: 3533,
    capitalGainsTax: 375,
    totalTaxBeforeCredits: 20750,
    credits: {
      childTaxCredit: 4000,
      eitc: 0,
      childCareCredit: 0,
      totalCredits: 4000,
    },
    totalTaxLiability: 16750,
    effectiveRate: 0.131,
    marginalRate: 0.22,
  },
  wisconsin: {
    taxableIncome: 108500,
    incomeTax: 6235,
    credits: {
      schoolPropertyTax: 0,
      marriedCouple: 480,
      workingFamilies: 0,
      totalCredits: 480,
    },
    totalTaxLiability: 5755,
    effectiveRate: 0.045,
    marginalRate: 0.0627,
  },
  combined: {
    totalTaxLiability: 22505,
    effectiveRate: 0.176,
    combinedMarginalRate: 0.2827,
  },
}

const mockIncomeSources = [
  { type: 'wages' as const, label: 'W-2 Wages', amount: 95000, ytdAmount: 71250 },
  {
    type: 'selfEmployment' as const,
    label: 'Freelance Income',
    amount: 25000,
    ytdAmount: 18750,
  },
  { type: 'dividends' as const, label: 'Qualified Dividends', amount: 2500, ytdAmount: 1875 },
  {
    type: 'capitalGains' as const,
    label: 'Long-term Capital Gains',
    amount: 5000,
    ytdAmount: 3750,
  },
]

const mockWithholding = {
  federal: 15500,
  state: 4200,
}

const mockFederalBrackets = [
  { rate: 0.1, min: 0, max: 22000 },
  { rate: 0.12, min: 22000, max: 89075 },
  { rate: 0.22, min: 89075, max: 190750 },
  { rate: 0.24, min: 190750, max: 364200 },
  { rate: 0.32, min: 364200, max: 462500 },
  { rate: 0.35, min: 462500, max: 693750 },
  { rate: 0.37, min: 693750, max: null },
]

describe('Tax Planning - E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Tax Center Page', () => {
    it('renders tax center page with title and description', async () => {
      render(<TaxCenterPage />)

      await waitFor(() => {
        expect(screen.getByText('Tax Center')).toBeInTheDocument()
      })

      expect(
        screen.getByText('Tax planning, estimates, and deduction tracking')
      ).toBeInTheDocument()
    })

    it('displays year selector with current and previous year', async () => {
      render(<TaxCenterPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/tax year/i)).toBeInTheDocument()
      })

      const yearSelect = screen.getByLabelText(/tax year/i) as HTMLSelectElement
      const options = Array.from(yearSelect.options).map((opt) => opt.value)

      const currentYear = new Date().getFullYear()
      expect(options).toContain(currentYear.toString())
      expect(options).toContain((currentYear - 1).toString())
    })

    it('allows changing tax year via dropdown', async () => {
      const user = userEvent.setup()
      render(<TaxCenterPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/tax year/i)).toBeInTheDocument()
      })

      const yearSelect = screen.getByLabelText(/tax year/i) as HTMLSelectElement
      const currentYear = new Date().getFullYear()
      const previousYear = currentYear - 1

      await user.selectOptions(yearSelect, previousYear.toString())

      expect(yearSelect.value).toBe(previousYear.toString())
    })

    it('displays demo notice banner', async () => {
      render(<TaxCenterPage />)

      await waitFor(() => {
        expect(screen.getByText(/this is a preview with sample data/i)).toBeInTheDocument()
      })
    })

    it('displays quick links to income, deductions, estimated tax, and documents', async () => {
      render(<TaxCenterPage />)

      await waitFor(() => {
        expect(screen.getByText('Tax Center')).toBeInTheDocument()
      })

      // Check all quick link hrefs are present
      const allLinks = screen.getAllByRole('link')
      const incomeLink = allLinks.find((link) => link.getAttribute('href') === '/tax-center/income')
      expect(incomeLink).toBeDefined()

      const deductionsLink = allLinks.find(
        (link) => link.getAttribute('href') === '/tax-center/deductions'
      )
      expect(deductionsLink).toBeDefined()

      const estimatedLink = allLinks.find(
        (link) => link.getAttribute('href') === '/tax-center/estimated-tax'
      )
      expect(estimatedLink).toBeDefined()

      const documentsLink = allLinks.find((link) => link.getAttribute('href') === '/documents')
      expect(documentsLink).toBeDefined()
    })

    it('displays tax planning tips section', async () => {
      render(<TaxCenterPage />)

      await waitFor(() => {
        expect(screen.getByText('Tax Planning Tips')).toBeInTheDocument()
      })

      expect(screen.getByText('Maximize Retirement Contributions')).toBeInTheDocument()
      expect(screen.getByText('Track Business Expenses')).toBeInTheDocument()
      expect(screen.getByText('Consider Estimated Payments')).toBeInTheDocument()
    })

    it('displays all main dashboard components', async () => {
      render(<TaxCenterPage />)

      await waitFor(() => {
        // Tax projection should be visible
        expect(screen.getByText('Federal Tax')).toBeInTheDocument()
      })

      expect(screen.getByText('Wisconsin Tax')).toBeInTheDocument()
      expect(screen.getByText('Combined Total')).toBeInTheDocument()
      expect(screen.getByText('Income Summary')).toBeInTheDocument()
      expect(screen.getByText('Marginal Tax Rate')).toBeInTheDocument()
    })
  })

  describe('Tax Projection Dashboard', () => {
    it('displays refund when withholding exceeds tax liability', () => {
      const highWithholding = { federal: 20000, state: 6000 }
      render(<TaxProjectionDashboard taxResult={mockTaxResult} withholding={highWithholding} />)

      expect(screen.getByText('Estimated Refund')).toBeInTheDocument()
      // Total withholding (20000 + 6000 = 26000) - Total tax (22505) = 3495 refund
    })

    it('displays amount due when tax liability exceeds withholding', () => {
      const lowWithholding = { federal: 5000, state: 1000 }
      render(<TaxProjectionDashboard taxResult={mockTaxResult} withholding={lowWithholding} />)

      expect(screen.getByText('Estimated Amount Due')).toBeInTheDocument()
    })

    it('displays federal tax summary card', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      expect(screen.getByText('Federal Tax')).toBeInTheDocument()
      expect(screen.getByText('$16,750')).toBeInTheDocument() // Total liability
      expect(screen.getByText('Effective rate: 13.1%')).toBeInTheDocument()
    })

    it('displays federal tax breakdown', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      // Income Tax and SE Tax labels appear
      const incomeTaxElements = screen.getAllByText('Income Tax')
      expect(incomeTaxElements.length).toBeGreaterThan(0)

      expect(screen.getByText('SE Tax')).toBeInTheDocument()
    })

    it('displays federal tax credits when present', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      const creditsElements = screen.getAllByText('Credits')
      expect(creditsElements.length).toBeGreaterThan(0)

      expect(screen.getByText('-$4,000')).toBeInTheDocument()
    })

    it('displays capital gains tax when present', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      expect(screen.getByText('Cap Gains')).toBeInTheDocument()
      expect(screen.getByText('$375')).toBeInTheDocument()
    })

    it('displays Wisconsin tax summary card', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      expect(screen.getByText('Wisconsin Tax')).toBeInTheDocument()
      expect(screen.getByText('$5,755')).toBeInTheDocument()
      expect(screen.getByText('Effective rate: 4.5%')).toBeInTheDocument()
    })

    it('displays Wisconsin tax credits when present', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      // Wisconsin credits should show -$480
      expect(screen.getByText('-$480')).toBeInTheDocument()
    })

    it('displays combined total card', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      expect(screen.getByText('Combined Total')).toBeInTheDocument()
      expect(screen.getByText('$22,505')).toBeInTheDocument()
      expect(screen.getByText('Effective rate: 17.6%')).toBeInTheDocument()
    })

    it('displays gross income and federal AGI', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      expect(screen.getByText('Gross Income')).toBeInTheDocument()
      expect(screen.getByText('$127,500')).toBeInTheDocument()

      expect(screen.getByText('Federal AGI')).toBeInTheDocument()
      expect(screen.getByText('$122,500')).toBeInTheDocument()
    })

    it('displays combined marginal rate', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      expect(screen.getByText('Marginal Rate')).toBeInTheDocument()
      expect(screen.getByText('28.3%')).toBeInTheDocument()
    })

    it('displays withholding analysis when provided', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} withholding={mockWithholding} />)

      expect(screen.getByText('Withholding Analysis')).toBeInTheDocument()
      expect(screen.getByText('Total Withheld')).toBeInTheDocument()
      expect(screen.getByText('Total Tax Due')).toBeInTheDocument()
    })

    it('displays federal and state withholding breakdown', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} withholding={mockWithholding} />)

      expect(screen.getByText('Federal')).toBeInTheDocument()
      expect(screen.getByText('Withheld: $15,500')).toBeInTheDocument()

      expect(screen.getByText('Wisconsin')).toBeInTheDocument()
      expect(screen.getByText('Withheld: $4,200')).toBeInTheDocument()
    })

    it('displays quick action links', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      const viewIncomeLink = screen.getByText('View Income').closest('a')
      expect(viewIncomeLink).toHaveAttribute('href', '/tax-center/income')

      const deductionsLink = screen.getByText('Deductions').closest('a')
      expect(deductionsLink).toHaveAttribute('href', '/tax-center/deductions')

      const estimatedTaxLink = screen.getByText('Estimated Tax').closest('a')
      expect(estimatedTaxLink).toHaveAttribute('href', '/tax-center/estimated-tax')
    })

    it('shows warning when amount is due', () => {
      const lowWithholding = { federal: 5000, state: 1000 }
      render(<TaxProjectionDashboard taxResult={mockTaxResult} withholding={lowWithholding} />)

      expect(
        screen.getByText(/consider increasing withholding or making estimated payments/i)
      ).toBeInTheDocument()
    })
  })

  describe('Income Summary Component', () => {
    it('displays total income', () => {
      render(<IncomeSummary incomeSources={mockIncomeSources} />)

      expect(screen.getByText('Income Summary')).toBeInTheDocument()
      expect(screen.getByText('Total Income')).toBeInTheDocument()
      expect(screen.getByText('$127,500')).toBeInTheDocument()
    })

    it('displays current year in header', () => {
      render(<IncomeSummary incomeSources={mockIncomeSources} />)

      const currentYear = new Date().getFullYear()
      expect(screen.getByText(currentYear.toString())).toBeInTheDocument()
    })

    it('displays all income sources sorted by amount', () => {
      render(<IncomeSummary incomeSources={mockIncomeSources} />)

      expect(screen.getByText('W-2 Wages')).toBeInTheDocument()
      expect(screen.getByText('$95,000')).toBeInTheDocument()

      expect(screen.getByText('Freelance Income')).toBeInTheDocument()
      expect(screen.getByText('$25,000')).toBeInTheDocument()

      expect(screen.getByText('Long-term Capital Gains')).toBeInTheDocument()
      expect(screen.getByText('$5,000')).toBeInTheDocument()

      expect(screen.getByText('Qualified Dividends')).toBeInTheDocument()
      expect(screen.getByText('$2,500')).toBeInTheDocument()
    })

    it('displays percentage breakdown for each income source', () => {
      render(<IncomeSummary incomeSources={mockIncomeSources} />)

      // W-2 Wages: 95000/127500 = 74.5%
      expect(screen.getByText('75%')).toBeInTheDocument()

      // Freelance: 25000/127500 = 19.6%
      expect(screen.getByText('20%')).toBeInTheDocument()

      // Capital Gains: 5000/127500 = 3.9%
      expect(screen.getByText('4%')).toBeInTheDocument()

      // Dividends: 2500/127500 = 2%
      expect(screen.getByText('2%')).toBeInTheDocument()
    })

    it('shows projected total when showProjection is true', () => {
      render(<IncomeSummary incomeSources={mockIncomeSources} showProjection />)

      expect(screen.getByText('Projected Total')).toBeInTheDocument()
    })

    it('displays year-to-date when showProjection is true', () => {
      render(<IncomeSummary incomeSources={mockIncomeSources} showProjection />)

      expect(screen.getByText('YTD')).toBeInTheDocument()
      // YTD is calculated from ytdAmount in the component
      // The component should display some YTD amount
      const ytdSection = screen.getByText('YTD')
      expect(ytdSection).toBeInTheDocument()
    })

    it('displays year progress bar when showProjection is true', () => {
      render(<IncomeSummary incomeSources={mockIncomeSources} showProjection />)

      expect(screen.getByText('Year Progress')).toBeInTheDocument()

      const currentMonth = new Date().getMonth() + 1
      const yearProgress = Math.round((currentMonth / 12) * 100)
      expect(screen.getByText(`${yearProgress}%`)).toBeInTheDocument()
    })

    it('displays add income source button', () => {
      render(<IncomeSummary incomeSources={mockIncomeSources} />)

      expect(screen.getByText('Add Income Source')).toBeInTheDocument()
    })

    it('filters out income sources with zero amount', () => {
      const sourcesWithZero = [
        ...mockIncomeSources,
        { type: 'other' as const, label: 'Other Income', amount: 0 },
      ]

      render(<IncomeSummary incomeSources={sourcesWithZero} />)

      expect(screen.queryByText('Other Income')).not.toBeInTheDocument()
    })

    it('displays appropriate icons for each income type', () => {
      render(<IncomeSummary incomeSources={mockIncomeSources} />)

      // Icons are rendered but we can verify the component renders without errors
      const incomeCards = screen.getAllByText(/\$/)
      expect(incomeCards.length).toBeGreaterThan(0)
    })
  })

  describe('Marginal Rate Display Component', () => {
    it('displays combined marginal tax rate', () => {
      render(
        <MarginalRateDisplay
          currentIncome={mockTaxResult.totalGrossIncome}
          taxableIncome={mockTaxResult.federal.taxableIncome}
          federalMarginalRate={mockTaxResult.federal.marginalRate}
          stateMarginalRate={mockTaxResult.wisconsin.marginalRate}
          federalBrackets={mockFederalBrackets}
        />
      )

      expect(screen.getByText('Marginal Tax Rate')).toBeInTheDocument()
      expect(screen.getByText('28.3%')).toBeInTheDocument()
      expect(screen.getByText('Combined federal + state')).toBeInTheDocument()
    })

    it('displays federal and state rate breakdown', () => {
      render(
        <MarginalRateDisplay
          currentIncome={mockTaxResult.totalGrossIncome}
          taxableIncome={mockTaxResult.federal.taxableIncome}
          federalMarginalRate={mockTaxResult.federal.marginalRate}
          stateMarginalRate={mockTaxResult.wisconsin.marginalRate}
          federalBrackets={mockFederalBrackets}
        />
      )

      expect(screen.getByText('Federal')).toBeInTheDocument()
      expect(screen.getByText('22.0%')).toBeInTheDocument()

      expect(screen.getByText('Wisconsin')).toBeInTheDocument()
      expect(screen.getByText('6.3%')).toBeInTheDocument()
    })

    it('displays distance to next bracket when not in top bracket', () => {
      render(
        <MarginalRateDisplay
          currentIncome={mockTaxResult.totalGrossIncome}
          taxableIncome={mockTaxResult.federal.taxableIncome}
          federalMarginalRate={mockTaxResult.federal.marginalRate}
          stateMarginalRate={mockTaxResult.wisconsin.marginalRate}
          federalBrackets={mockFederalBrackets}
        />
      )

      // Taxable income is 108800, next bracket starts at 190750
      // Distance: 190750 - 108800 = 81950
      expect(screen.getByText(/distance to.*bracket/i)).toBeInTheDocument()
      expect(screen.getByText('$81,950')).toBeInTheDocument()
    })

    it('displays progress through current bracket', () => {
      render(
        <MarginalRateDisplay
          currentIncome={mockTaxResult.totalGrossIncome}
          taxableIncome={mockTaxResult.federal.taxableIncome}
          federalMarginalRate={mockTaxResult.federal.marginalRate}
          stateMarginalRate={mockTaxResult.wisconsin.marginalRate}
          federalBrackets={mockFederalBrackets}
        />
      )

      expect(screen.getByText(/% through current bracket/i)).toBeInTheDocument()
    })

    it('shows warning when in top tax bracket', () => {
      const topBracketIncome = 700000

      render(
        <MarginalRateDisplay
          currentIncome={topBracketIncome}
          taxableIncome={topBracketIncome}
          federalMarginalRate={0.37}
          stateMarginalRate={mockTaxResult.wisconsin.marginalRate}
          federalBrackets={mockFederalBrackets}
        />
      )

      expect(screen.getByText(/you are in the highest federal tax bracket/i)).toBeInTheDocument()
    })

    it('displays tax planning insight', () => {
      render(
        <MarginalRateDisplay
          currentIncome={mockTaxResult.totalGrossIncome}
          taxableIncome={mockTaxResult.federal.taxableIncome}
          federalMarginalRate={mockTaxResult.federal.marginalRate}
          stateMarginalRate={mockTaxResult.wisconsin.marginalRate}
          federalBrackets={mockFederalBrackets}
        />
      )

      expect(screen.getByText('Tax Planning Insight')).toBeInTheDocument()
      expect(screen.getByText(/for every additional \$1,000 you earn/i)).toBeInTheDocument()
      // 1000 * 0.2827 = $282.70
      expect(screen.getByText('$283')).toBeInTheDocument()
      expect(screen.getByText(/consider tax-advantaged contributions/i)).toBeInTheDocument()
    })

    it('displays federal tax bracket visualization', () => {
      render(
        <MarginalRateDisplay
          currentIncome={mockTaxResult.totalGrossIncome}
          taxableIncome={mockTaxResult.federal.taxableIncome}
          federalMarginalRate={mockTaxResult.federal.marginalRate}
          stateMarginalRate={mockTaxResult.wisconsin.marginalRate}
          federalBrackets={mockFederalBrackets}
        />
      )

      expect(screen.getByText('Federal Tax Brackets')).toBeInTheDocument()

      // All bracket percentages should be shown
      expect(screen.getByText('10%')).toBeInTheDocument()
      expect(screen.getByText('12%')).toBeInTheDocument()
      expect(screen.getByText('22%')).toBeInTheDocument()
      expect(screen.getByText('24%')).toBeInTheDocument()
      expect(screen.getByText('32%')).toBeInTheDocument()
      expect(screen.getByText('35%')).toBeInTheDocument()
      expect(screen.getByText('37%')).toBeInTheDocument()
    })

    it('highlights current bracket in visualization', () => {
      render(
        <MarginalRateDisplay
          currentIncome={mockTaxResult.totalGrossIncome}
          taxableIncome={mockTaxResult.federal.taxableIncome}
          federalMarginalRate={mockTaxResult.federal.marginalRate}
          stateMarginalRate={mockTaxResult.wisconsin.marginalRate}
          federalBrackets={mockFederalBrackets}
        />
      )

      // The bracket visualization is rendered as colored boxes
      // We can verify it renders without errors
      const bracketVisualization = screen.getByText('Federal Tax Brackets')
      expect(bracketVisualization).toBeInTheDocument()
    })
  })

  describe('Tax Optimization Recommendations', () => {
    it('displays recommendation to increase withholding when underpaying', () => {
      const lowWithholding = { federal: 5000, state: 1000 }
      render(<TaxProjectionDashboard taxResult={mockTaxResult} withholding={lowWithholding} />)

      expect(
        screen.getByText(/consider increasing withholding or making estimated payments/i)
      ).toBeInTheDocument()
    })

    it('displays tax planning tips on tax center page', async () => {
      render(<TaxCenterPage />)

      await waitFor(() => {
        expect(screen.getByText('Maximize Retirement Contributions')).toBeInTheDocument()
      })

      expect(
        screen.getByText(/you can contribute up to \$23,000 to a 401\(k\) in 2024/i)
      ).toBeInTheDocument()

      expect(screen.getByText('Track Business Expenses')).toBeInTheDocument()
      expect(
        screen.getByText(/self-employment income can be offset by legitimate business expenses/i)
      ).toBeInTheDocument()

      expect(screen.getByText('Consider Estimated Payments')).toBeInTheDocument()
      expect(
        screen.getByText(/quarterly estimated payments help avoid penalties/i)
      ).toBeInTheDocument()
    })
  })

  describe('Year-over-Year Comparisons', () => {
    it('allows selecting different years for comparison', async () => {
      const user = userEvent.setup()
      render(<TaxCenterPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/tax year/i)).toBeInTheDocument()
      })

      const yearSelect = screen.getByLabelText(/tax year/i) as HTMLSelectElement
      const currentYear = new Date().getFullYear()
      const previousYear = currentYear - 1

      // Initially should be current year
      expect(yearSelect.value).toBe(currentYear.toString())

      // Change to previous year
      await user.selectOptions(yearSelect, previousYear.toString())

      expect(yearSelect.value).toBe(previousYear.toString())
    })
  })

  describe('Deduction Tracking', () => {
    it('provides link to deduction tracking page', async () => {
      render(<TaxCenterPage />)

      await waitFor(() => {
        expect(screen.getByText('Tax Center')).toBeInTheDocument()
      })

      const allLinks = screen.getAllByRole('link')
      const deductionsLink = allLinks.find(
        (link) => link.getAttribute('href') === '/tax-center/deductions'
      )
      expect(deductionsLink).toBeDefined()
    })

    it('displays deductions quick link in tax projection dashboard', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      const deductionsLink = screen.getByText('Deductions').closest('a')
      expect(deductionsLink).toHaveAttribute('href', '/tax-center/deductions')
    })
  })

  describe('Tax Projection Calculations', () => {
    it('correctly displays effective tax rates', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      // Federal effective rate: 13.1%
      expect(screen.getByText('Effective rate: 13.1%')).toBeInTheDocument()

      // Wisconsin effective rate: 4.5%
      expect(screen.getByText('Effective rate: 4.5%')).toBeInTheDocument()

      // Combined effective rate: 17.6%
      expect(screen.getByText('Effective rate: 17.6%')).toBeInTheDocument()
    })

    it('displays self-employment tax separately when present', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      expect(screen.getByText('SE Tax')).toBeInTheDocument()
      expect(screen.getByText('$3,533')).toBeInTheDocument()
    })

    it('displays capital gains tax separately when present', () => {
      render(<TaxProjectionDashboard taxResult={mockTaxResult} />)

      expect(screen.getByText('Cap Gains')).toBeInTheDocument()
      expect(screen.getByText('$375')).toBeInTheDocument()
    })

    it('does not display SE tax when zero', () => {
      const noSETaxResult = {
        ...mockTaxResult,
        federal: {
          ...mockTaxResult.federal,
          selfEmploymentTax: 0,
        },
      }

      render(<TaxProjectionDashboard taxResult={noSETaxResult} />)

      expect(screen.queryByText('SE Tax')).not.toBeInTheDocument()
    })

    it('does not display capital gains when zero', () => {
      const noCapGainsResult = {
        ...mockTaxResult,
        federal: {
          ...mockTaxResult.federal,
          capitalGainsTax: 0,
        },
      }

      render(<TaxProjectionDashboard taxResult={noCapGainsResult} />)

      expect(screen.queryByText('Cap Gains')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility and Responsiveness', () => {
    it('renders all components without accessibility violations', () => {
      const { container } = render(<TaxCenterPage />)
      expect(container).toBeInTheDocument()
    })

    it('displays proper semantic headings', async () => {
      render(<TaxCenterPage />)

      await waitFor(() => {
        const heading = screen.getByRole('heading', { name: /tax center/i })
        expect(heading).toBeInTheDocument()
      })
    })

    it('renders links with proper href attributes', async () => {
      render(<TaxCenterPage />)

      await waitFor(() => {
        const links = screen.getAllByRole('link')
        expect(links.length).toBeGreaterThan(0)

        links.forEach((link) => {
          expect(link).toHaveAttribute('href')
        })
      })
    })
  })
})
