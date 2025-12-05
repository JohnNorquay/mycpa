import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpendingDashboard } from '@/components/features/insights/spending-dashboard'

const mockProps = {
  totalSpending: 3500,
  totalIncome: 5000,
  savingsRate: 30,
  categoryBreakdown: [
    { category: 'Food & Dining', total: 800, count: 25, percentage: 22.9, averageTransaction: 32 },
    { category: 'Transportation', total: 500, count: 10, percentage: 14.3, averageTransaction: 50 },
    { category: 'Shopping', total: 600, count: 8, percentage: 17.1, averageTransaction: 75 },
  ],
  monthlyComparison: [
    {
      category: 'Food & Dining',
      currentMonth: 800,
      previousMonth: 700,
      change: 100,
      percentageChange: 14.3,
    },
    {
      category: 'Transportation',
      currentMonth: 500,
      previousMonth: 600,
      change: -100,
      percentageChange: -16.7,
    },
  ],
  trends: [
    {
      category: 'Food & Dining',
      trend: 'increasing' as const,
      percentageChange: 15,
      description: 'Spending increased 15% over 3 months',
    },
    {
      category: 'Transportation',
      trend: 'decreasing' as const,
      percentageChange: -10,
      description: 'Spending decreased 10% over 3 months',
    },
  ],
  anomalies: [
    {
      id: 'a1',
      type: 'unusual_amount' as const,
      severity: 'high' as const,
      description: 'Unusually large transaction at Electronics Store',
      amount: 1500,
      date: '2024-01-15',
    },
    {
      id: 'a2',
      type: 'new_subscription' as const,
      severity: 'medium' as const,
      description: 'New recurring charge detected',
      amount: 49.99,
      date: '2024-01-10',
    },
  ],
}

describe('SpendingDashboard - Summary Cards', () => {
  it('renders monthly spending', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('Monthly Spending')).toBeInTheDocument()
    expect(screen.getByText('$3,500')).toBeInTheDocument()
  })

  it('renders monthly income', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('Monthly Income')).toBeInTheDocument()
    expect(screen.getByText('$5,000')).toBeInTheDocument()
  })

  it('renders savings rate', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('Savings Rate')).toBeInTheDocument()
    expect(screen.getByText('30.0%')).toBeInTheDocument()
  })

  it('shows "Great!" for high savings rate', () => {
    render(<SpendingDashboard {...mockProps} savingsRate={25} />)

    expect(screen.getByText('Great!')).toBeInTheDocument()
  })

  it('shows "Good" for medium savings rate', () => {
    render(<SpendingDashboard {...mockProps} savingsRate={15} />)

    expect(screen.getByText('Good')).toBeInTheDocument()
  })

  it('shows "Needs improvement" for low savings rate', () => {
    render(<SpendingDashboard {...mockProps} savingsRate={5} />)

    expect(screen.getByText('Needs improvement')).toBeInTheDocument()
  })

  it('renders net cash flow', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('Net Cash Flow')).toBeInTheDocument()
    // $5000 - $3500 = $1500
    expect(screen.getByText('$1,500')).toBeInTheDocument()
  })

  it('shows negative cash flow correctly', () => {
    render(<SpendingDashboard {...mockProps} totalSpending={6000} totalIncome={5000} />)

    // -$1000
    expect(screen.getByText('-$1,000')).toBeInTheDocument()
  })
})

describe('SpendingDashboard - Category Breakdown', () => {
  it('renders category breakdown section', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('Spending by Category')).toBeInTheDocument()
    expect(screen.getByText('Top categories this month')).toBeInTheDocument()
  })

  it('shows category names', () => {
    render(<SpendingDashboard {...mockProps} />)

    // Some category names may appear multiple times (in breakdown and comparison)
    expect(screen.getAllByText('Food & Dining').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Transportation').length).toBeGreaterThan(0)
    expect(screen.getByText('Shopping')).toBeInTheDocument()
  })

  it('shows category amounts', () => {
    render(<SpendingDashboard {...mockProps} />)

    // Amounts may appear in multiple sections
    expect(screen.getAllByText('$800').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$500').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$600').length).toBeGreaterThan(0)
  })

  it('shows transaction counts', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('25 transactions')).toBeInTheDocument()
    expect(screen.getByText('10 transactions')).toBeInTheDocument()
    expect(screen.getByText('8 transactions')).toBeInTheDocument()
  })

  it('shows percentages', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('22.9%')).toBeInTheDocument()
    expect(screen.getByText('14.3%')).toBeInTheDocument()
    expect(screen.getByText('17.1%')).toBeInTheDocument()
  })

  it('shows empty state when no category data', () => {
    render(<SpendingDashboard {...mockProps} categoryBreakdown={[]} />)

    expect(screen.getByText('No spending data available')).toBeInTheDocument()
  })
})

describe('SpendingDashboard - Monthly Comparison', () => {
  it('renders monthly comparison section', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('Month-over-Month')).toBeInTheDocument()
    expect(screen.getByText('Compared to last month')).toBeInTheDocument()
  })

  it('shows positive change with up arrow', () => {
    render(<SpendingDashboard {...mockProps} />)

    // Food & Dining increased 14.3%
    expect(screen.getByText('+14.3%')).toBeInTheDocument()
  })

  it('shows negative change with down arrow', () => {
    render(<SpendingDashboard {...mockProps} />)

    // Transportation decreased 16.7%
    expect(screen.getByText('-16.7%')).toBeInTheDocument()
  })

  it('shows empty state when no comparison data', () => {
    render(<SpendingDashboard {...mockProps} monthlyComparison={[]} />)

    expect(screen.getByText('Not enough data for comparison')).toBeInTheDocument()
  })
})

describe('SpendingDashboard - Trends', () => {
  it('renders trends section', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('Spending Trends')).toBeInTheDocument()
    expect(screen.getByText('Significant changes in spending')).toBeInTheDocument()
  })

  it('shows trend descriptions', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('Spending increased 15% over 3 months')).toBeInTheDocument()
    expect(screen.getByText('Spending decreased 10% over 3 months')).toBeInTheDocument()
  })

  it('shows increasing trend with up icon in red', () => {
    render(<SpendingDashboard {...mockProps} />)

    // Increasing spending is shown in red (bad)
    const trendContainers = document.querySelectorAll('[class*="bg-red-50"]')
    expect(trendContainers.length).toBeGreaterThan(0)
  })

  it('shows decreasing trend with down icon in green', () => {
    render(<SpendingDashboard {...mockProps} />)

    // Decreasing spending is shown in green (good)
    const trendContainers = document.querySelectorAll('[class*="bg-green-50"]')
    expect(trendContainers.length).toBeGreaterThan(0)
  })

  it('shows empty state when no trends', () => {
    render(<SpendingDashboard {...mockProps} trends={[]} />)

    expect(screen.getByText('No significant trends detected')).toBeInTheDocument()
  })
})

describe('SpendingDashboard - Anomalies/Alerts', () => {
  it('renders alerts section', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('Alerts')).toBeInTheDocument()
    expect(screen.getByText('Unusual activity detected')).toBeInTheDocument()
  })

  it('shows anomaly descriptions', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('Unusually large transaction at Electronics Store')).toBeInTheDocument()
    expect(screen.getByText('New recurring charge detected')).toBeInTheDocument()
  })

  it('shows severity badges', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText('medium')).toBeInTheDocument()
  })

  it('shows anomaly type', () => {
    render(<SpendingDashboard {...mockProps} />)

    expect(screen.getByText('unusual amount')).toBeInTheDocument()
    expect(screen.getByText('new subscription')).toBeInTheDocument()
  })

  it('shows high severity alerts in red', () => {
    render(<SpendingDashboard {...mockProps} />)

    const highSeverityAlerts = document.querySelectorAll('[class*="border-red-200"]')
    expect(highSeverityAlerts.length).toBeGreaterThan(0)
  })

  it('shows medium severity alerts in amber', () => {
    render(<SpendingDashboard {...mockProps} />)

    const mediumSeverityAlerts = document.querySelectorAll('[class*="border-amber-200"]')
    expect(mediumSeverityAlerts.length).toBeGreaterThan(0)
  })

  it('filters out low severity anomalies', () => {
    const propsWithLowSeverity = {
      ...mockProps,
      anomalies: [
        {
          id: 'a3',
          type: 'unusual_amount' as const,
          severity: 'low' as const,
          description: 'Low priority alert',
        },
      ],
    }

    render(<SpendingDashboard {...propsWithLowSeverity} />)

    expect(screen.queryByText('Low priority alert')).not.toBeInTheDocument()
    expect(screen.getByText('No alerts at this time')).toBeInTheDocument()
  })

  it('shows empty state when no high/medium severity anomalies', () => {
    render(<SpendingDashboard {...mockProps} anomalies={[]} />)

    expect(screen.getByText('No alerts at this time')).toBeInTheDocument()
  })
})

describe('SpendingDashboard - Edge Cases', () => {
  it('handles zero values', () => {
    render(
      <SpendingDashboard
        totalSpending={0}
        totalIncome={0}
        savingsRate={0}
        categoryBreakdown={[]}
        monthlyComparison={[]}
        trends={[]}
        anomalies={[]}
      />
    )

    // $0 may appear multiple times (spending, income, cash flow)
    expect(screen.getAllByText('$0').length).toBeGreaterThan(0)
    expect(screen.getByText('0.0%')).toBeInTheDocument()
  })

  it('handles large numbers', () => {
    render(<SpendingDashboard {...mockProps} totalSpending={1500000} totalIncome={2000000} />)

    expect(screen.getByText('$1,500,000')).toBeInTheDocument()
    expect(screen.getByText('$2,000,000')).toBeInTheDocument()
  })

  it('limits category breakdown to top 6', () => {
    const manyCategories = Array.from({ length: 10 }, (_, i) => ({
      category: `Category ${i}`,
      total: 100 * (10 - i),
      count: 5,
      percentage: 10,
      averageTransaction: 20,
    }))

    render(<SpendingDashboard {...mockProps} categoryBreakdown={manyCategories} />)

    // Should only show first 6 categories
    expect(screen.getByText('Category 0')).toBeInTheDocument()
    expect(screen.getByText('Category 5')).toBeInTheDocument()
    expect(screen.queryByText('Category 6')).not.toBeInTheDocument()
  })

  it('limits anomalies to top 5', () => {
    const manyAnomalies = Array.from({ length: 10 }, (_, i) => ({
      id: `a${i}`,
      type: 'unusual_amount' as const,
      severity: 'high' as const,
      description: `Alert ${i}`,
    }))

    render(<SpendingDashboard {...mockProps} anomalies={manyAnomalies} />)

    expect(screen.getByText('Alert 0')).toBeInTheDocument()
    expect(screen.getByText('Alert 4')).toBeInTheDocument()
    expect(screen.queryByText('Alert 5')).not.toBeInTheDocument()
  })
})
