import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DebtSummary, DebtSummaryCompact } from '@/components/features/tax-debt/debt-summary'

const mockDebts = [
  {
    id: 'debt-1',
    tax_year: 2022,
    original_amount: 10000,
    current_balance: 12000,
    daily_interest_rate: 0.00022,
    collection_status: 'normal',
  },
  {
    id: 'debt-2',
    tax_year: 2021,
    original_amount: 5000,
    current_balance: 6500,
    daily_interest_rate: 0.00022,
    collection_status: 'notice_sent',
  },
]

const urgentDebts = [
  {
    id: 'debt-3',
    tax_year: 2020,
    original_amount: 15000,
    current_balance: 20000,
    daily_interest_rate: 0.00022,
    collection_status: 'levy_active',
  },
]

describe('DebtSummary', () => {
  it('renders empty state when no debts', () => {
    render(<DebtSummary debts={[]} />)

    expect(screen.getByText('No Tax Debts')).toBeInTheDocument()
    expect(screen.getByText(/no tracked tax obligations/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /add tax debt/i })).toBeInTheDocument()
  })

  it('shows total debt amount', () => {
    render(<DebtSummary debts={mockDebts} />)

    // Total: $12,000 + $6,500 = $18,500
    expect(screen.getByText('$18,500')).toBeInTheDocument()
  })

  it('shows daily interest accruing', () => {
    render(<DebtSummary debts={mockDebts} />)

    expect(screen.getByText(/\/day/)).toBeInTheDocument()
    expect(screen.getByText(/daily interest accruing/i)).toBeInTheDocument()
  })

  it('shows oldest debt year', () => {
    render(<DebtSummary debts={mockDebts} />)

    expect(screen.getByText('2021')).toBeInTheDocument()
    expect(screen.getByText(/oldest debt/i)).toBeInTheDocument()
  })

  it('shows worst collection status', () => {
    render(<DebtSummary debts={mockDebts} />)

    // notice_sent has higher priority than normal
    expect(screen.getByText('Notice Sent')).toBeInTheDocument()
  })

  it('shows debt count', () => {
    render(<DebtSummary debts={mockDebts} />)

    expect(screen.getByText(/2 tax years tracked/i)).toBeInTheDocument()
  })

  it('shows "View All" link', () => {
    render(<DebtSummary debts={mockDebts} />)

    expect(screen.getByRole('link', { name: /view all/i })).toBeInTheDocument()
  })

  it('uses custom debtsHref', () => {
    render(<DebtSummary debts={mockDebts} debtsHref="/custom/path" />)

    const link = screen.getByRole('link', { name: /view all/i })
    expect(link).toHaveAttribute('href', '/custom/path')
  })
})

describe('DebtSummary - Urgent Alerts', () => {
  it('shows urgent alert for high priority debts', () => {
    render(<DebtSummary debts={urgentDebts} />)

    expect(screen.getByText(/urgent debt/i)).toBeInTheDocument()
    expect(screen.getByText(/requires immediate attention/i)).toBeInTheDocument()
  })

  it('shows correct number of urgent debts', () => {
    render(<DebtSummary debts={[...mockDebts, ...urgentDebts]} />)

    expect(screen.getByText(/1 urgent debt/i)).toBeInTheDocument()
  })

  it('pluralizes urgent debts correctly', () => {
    const multipleUrgent = [
      ...urgentDebts,
      {
        id: 'debt-4',
        tax_year: 2019,
        original_amount: 8000,
        current_balance: 10000,
        daily_interest_rate: 0.00022,
        collection_status: 'garnishment',
      },
    ]

    render(<DebtSummary debts={multipleUrgent} />)

    expect(screen.getByText(/2 urgent debts/i)).toBeInTheDocument()
  })
})

describe('DebtSummary - Collection Status Display', () => {
  it('shows Normal status correctly', () => {
    render(
      <DebtSummary
        debts={[
          {
            id: 'debt-1',
            tax_year: 2023,
            original_amount: 1000,
            current_balance: 1000,
            daily_interest_rate: 0.00022,
            collection_status: 'normal',
          },
        ]}
      />
    )

    expect(screen.getByText('Normal')).toBeInTheDocument()
  })

  it('shows Lien Filed status correctly', () => {
    render(
      <DebtSummary
        debts={[
          {
            id: 'debt-1',
            tax_year: 2023,
            original_amount: 1000,
            current_balance: 1000,
            daily_interest_rate: 0.00022,
            collection_status: 'lien_filed',
          },
        ]}
      />
    )

    expect(screen.getByText('Lien Filed')).toBeInTheDocument()
  })

  it('shows Currently Not Collectible status correctly', () => {
    render(
      <DebtSummary
        debts={[
          {
            id: 'debt-1',
            tax_year: 2023,
            original_amount: 1000,
            current_balance: 1000,
            daily_interest_rate: 0.00022,
            collection_status: 'currently_not_collectible',
          },
        ]}
      />
    )

    expect(screen.getByText('Currently Not Collectible')).toBeInTheDocument()
  })
})

describe('DebtSummaryCompact', () => {
  it('returns null when no debts', () => {
    const { container } = render(<DebtSummaryCompact debts={[]} />)

    expect(container.firstChild).toBeNull()
  })

  it('shows total debt amount', () => {
    render(<DebtSummaryCompact debts={mockDebts} />)

    expect(screen.getByText('$18,500')).toBeInTheDocument()
  })

  it('shows debt count', () => {
    render(<DebtSummaryCompact debts={mockDebts} />)

    expect(screen.getByText(/2 tax years/i)).toBeInTheDocument()
  })

  it('is a clickable link', () => {
    render(<DebtSummaryCompact debts={mockDebts} />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/tax-debt/debts')
  })

  it('uses custom debtsHref', () => {
    render(<DebtSummaryCompact debts={mockDebts} debtsHref="/custom/path" />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/custom/path')
  })

  it('shows urgent indicator for high priority debts', () => {
    render(<DebtSummaryCompact debts={urgentDebts} />)

    expect(screen.getByText(/urgent/i)).toBeInTheDocument()
  })

  it('pluralizes year count correctly for single debt', () => {
    render(
      <DebtSummaryCompact
        debts={[
          {
            id: 'debt-1',
            tax_year: 2023,
            original_amount: 1000,
            current_balance: 1000,
            daily_interest_rate: 0.00022,
            collection_status: 'normal',
          },
        ]}
      />
    )

    expect(screen.getByText(/1 tax year$/)).toBeInTheDocument()
  })
})
