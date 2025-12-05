import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DebtForm } from '@/components/features/tax-debt/debt-form'

describe('DebtForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSubmit.mockResolvedValue(undefined)
  })

  it('renders all form fields', () => {
    render(<DebtForm onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/tax year/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/debt type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/original amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/current balance/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/interest rate/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/penalty rate/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/source of debt/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/collection status/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/collection statute expiration date/i)).toBeInTheDocument()
  })

  it('has default values', () => {
    render(<DebtForm onSubmit={mockOnSubmit} />)

    // Default interest rate is 8%
    expect(screen.getByLabelText(/interest rate/i)).toHaveValue(8)
    // Default collection status is 'normal'
    expect(screen.getByLabelText(/collection status/i)).toHaveValue('normal')
  })

  it('allows selecting tax year', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    const select = screen.getByLabelText(/tax year/i)
    await user.selectOptions(select, '2022')

    expect(select).toHaveValue('2022')
  })

  it('allows selecting debt type', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    const select = screen.getByLabelText(/debt type/i)
    await user.selectOptions(select, 'penalty_failure_to_file')

    expect(select).toHaveValue('penalty_failure_to_file')
  })

  it('allows entering original amount', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    const input = screen.getByLabelText(/original amount/i)
    await user.clear(input)
    await user.type(input, '5000')

    expect(input).toHaveValue(5000)
  })

  it('allows entering current balance', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    const input = screen.getByLabelText(/current balance/i)
    await user.clear(input)
    await user.type(input, '5500')

    expect(input).toHaveValue(5500)
  })

  it('shows warning when balance exceeds original amount', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    const originalInput = screen.getByLabelText(/original amount/i)
    const balanceInput = screen.getByLabelText(/current balance/i)

    await user.clear(originalInput)
    await user.type(originalInput, '5000')
    await user.clear(balanceInput)
    await user.type(balanceInput, '5500')

    expect(screen.getByText(/balance exceeds original/i)).toBeInTheDocument()
  })

  it('allows selecting source of debt', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    const select = screen.getByLabelText(/source of debt/i)
    await user.selectOptions(select, '1099_unreported')

    expect(select).toHaveValue('1099_unreported')
  })

  it('allows selecting collection status', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    const select = screen.getByLabelText(/collection status/i)
    await user.selectOptions(select, 'lien_filed')

    expect(select).toHaveValue('lien_filed')
  })

  it('allows entering statute expiration date', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    const input = screen.getByLabelText(/collection statute expiration date/i)
    await user.type(input, '2034-01-15')

    expect(input).toHaveValue('2034-01-15')
  })

  it('shows submit button with custom label', () => {
    render(<DebtForm onSubmit={mockOnSubmit} submitLabel="Add Debt" />)

    expect(screen.getByRole('button', { name: /add debt/i })).toBeInTheDocument()
  })

  it('shows cancel button when onCancel provided', () => {
    render(<DebtForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('does not show cancel button when onCancel not provided', () => {
    render(<DebtForm onSubmit={mockOnSubmit} />)

    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
  })

  it('calls onCancel when cancel clicked', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockOnCancel).toHaveBeenCalled()
  })
})

describe('DebtForm - Validation', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSubmit.mockResolvedValue(undefined)
  })

  it('validates original amount is required', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    await user.click(screen.getByRole('button', { name: /save/i }))

    // Form validation should prevent submission
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  it('requires positive original amount to submit', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    const originalInput = screen.getByLabelText(/original amount/i)
    const balanceInput = screen.getByLabelText(/current balance/i)

    // Try to submit with zero original amount
    await user.clear(originalInput)
    await user.clear(balanceInput)
    await user.type(balanceInput, '5000')

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  it('accepts valid form data', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    const originalInput = screen.getByLabelText(/original amount/i)
    const balanceInput = screen.getByLabelText(/current balance/i)

    await user.clear(originalInput)
    await user.type(originalInput, '5000')
    await user.clear(balanceInput)
    await user.type(balanceInput, '5000')

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })
})

describe('DebtForm - Submission', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSubmit.mockResolvedValue(undefined)
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    const originalInput = screen.getByLabelText(/original amount/i)
    const balanceInput = screen.getByLabelText(/current balance/i)

    await user.clear(originalInput)
    await user.type(originalInput, '5000')
    await user.clear(balanceInput)
    await user.type(balanceInput, '5500')

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          original_amount: 5000,
          current_balance: 5500,
        })
      )
    })
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)))

    render(<DebtForm onSubmit={mockOnSubmit} />)

    const originalInput = screen.getByLabelText(/original amount/i)
    const balanceInput = screen.getByLabelText(/current balance/i)

    await user.clear(originalInput)
    await user.type(originalInput, '5000')
    await user.clear(balanceInput)
    await user.type(balanceInput, '5500')

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText(/saving/i)).toBeInTheDocument()
  })

  it('disables buttons during submission', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)))

    render(<DebtForm onSubmit={mockOnSubmit} onCancel={vi.fn()} />)

    const originalInput = screen.getByLabelText(/original amount/i)
    const balanceInput = screen.getByLabelText(/current balance/i)

    await user.clear(originalInput)
    await user.type(originalInput, '5000')
    await user.clear(balanceInput)
    await user.type(balanceInput, '5500')

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
  })

  it('shows error when submission fails', async () => {
    const user = userEvent.setup()
    mockOnSubmit.mockRejectedValue(new Error('Server error'))

    render(<DebtForm onSubmit={mockOnSubmit} />)

    const originalInput = screen.getByLabelText(/original amount/i)
    const balanceInput = screen.getByLabelText(/current balance/i)

    await user.clear(originalInput)
    await user.type(originalInput, '5000')
    await user.clear(balanceInput)
    await user.type(balanceInput, '5500')

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })
  })
})

describe('DebtForm - Initial Data', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSubmit.mockResolvedValue(undefined)
  })

  it('populates form with initial data', () => {
    render(
      <DebtForm
        onSubmit={mockOnSubmit}
        initialData={{
          tax_year: 2022,
          debt_type: 'penalty_failure_to_file',
          original_amount: 10000,
          current_balance: 12000,
          interest_rate: 10,
          collection_status: 'lien_filed',
        }}
      />
    )

    expect(screen.getByLabelText(/tax year/i)).toHaveValue('2022')
    expect(screen.getByLabelText(/debt type/i)).toHaveValue('penalty_failure_to_file')
    expect(screen.getByLabelText(/original amount/i)).toHaveValue(10000)
    expect(screen.getByLabelText(/current balance/i)).toHaveValue(12000)
    expect(screen.getByLabelText(/interest rate/i)).toHaveValue(10)
    expect(screen.getByLabelText(/collection status/i)).toHaveValue('lien_filed')
  })
})

describe('DebtForm - Summary', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSubmit.mockResolvedValue(undefined)
  })

  it('shows summary when original amount > 0', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    const originalInput = screen.getByLabelText(/original amount/i)
    await user.clear(originalInput)
    await user.type(originalInput, '5000')

    expect(screen.getByRole('heading', { name: /summary/i })).toBeInTheDocument()
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
  })

  it('shows interest/penalties accrued in summary', async () => {
    const user = userEvent.setup()
    render(<DebtForm onSubmit={mockOnSubmit} />)

    const originalInput = screen.getByLabelText(/original amount/i)
    const balanceInput = screen.getByLabelText(/current balance/i)

    await user.clear(originalInput)
    await user.type(originalInput, '5000')
    await user.clear(balanceInput)
    await user.type(balanceInput, '5500')

    // Use getAllByText since the text appears in multiple places
    const interestElements = screen.getAllByText(/interest/i)
    expect(interestElements.length).toBeGreaterThan(0)
    expect(screen.getByText('+$500.00')).toBeInTheDocument()
  })

  it('does not show summary heading when original amount is 0', () => {
    render(<DebtForm onSubmit={mockOnSubmit} />)

    expect(screen.queryByRole('heading', { name: /summary/i })).not.toBeInTheDocument()
  })
})
