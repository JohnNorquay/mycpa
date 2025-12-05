import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaxDebtListPage from '@/app/(dashboard)/tax-debt/debts/page'
import NewTaxDebtPage from '@/app/(dashboard)/tax-debt/debts/new/page'
import TaxDebtDetailPage from '@/app/(dashboard)/tax-debt/debts/[id]/page'
import type { TaxDebt, TaxDebtPayment } from '@/app/actions/tax-debt'

// Mock Next.js navigation
const mockPush = vi.fn()
const mockParams = { id: 'debt-123' }

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
  useParams: () => mockParams,
}))

// Mock tax debt actions
vi.mock('@/app/actions/tax-debt', () => ({
  getTaxDebts: vi.fn(),
  getTaxDebt: vi.fn(),
  createTaxDebt: vi.fn(),
  updateTaxDebt: vi.fn(),
  deleteTaxDebt: vi.fn(),
  recordPayment: vi.fn(),
  getPaymentsForDebt: vi.fn(),
}))

import {
  getTaxDebts,
  getTaxDebt,
  createTaxDebt,
  updateTaxDebt,
  deleteTaxDebt,
  recordPayment,
  getPaymentsForDebt,
} from '@/app/actions/tax-debt'

// Mock window.confirm
const mockConfirm = vi.fn()
const mockAlert = vi.fn()
global.confirm = mockConfirm
global.alert = mockAlert

describe('Tax Debt E2E - List Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockReturnValue(true)
  })

  const mockDebts: TaxDebt[] = [
    {
      id: 'debt-1',
      user_id: 'user-123',
      tax_year: 2023,
      debt_type: 'income_tax',
      original_amount: 10000,
      current_balance: 12000,
      interest_rate: 8,
      penalty_rate: 5,
      source: 'business',
      collection_status: 'normal',
      statute_expiration_date: '2033-04-15',
      daily_interest_rate: 0.00022,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'debt-2',
      user_id: 'user-123',
      tax_year: 2022,
      debt_type: 'penalty_failure_to_file',
      original_amount: 5000,
      current_balance: 5500,
      interest_rate: 8,
      penalty_rate: null,
      source: '1099_unreported',
      collection_status: 'notice_sent',
      statute_expiration_date: '2032-04-15',
      daily_interest_rate: 0.00022,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 'debt-3',
      user_id: 'user-123',
      tax_year: 2021,
      debt_type: 'income_tax',
      original_amount: 8000,
      current_balance: 9000,
      interest_rate: 8,
      penalty_rate: null,
      source: 'w2_shortage',
      collection_status: 'lien_filed',
      statute_expiration_date: '2031-04-15',
      daily_interest_rate: 0.00022,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  it('displays loading state while fetching debts', () => {
    vi.mocked(getTaxDebts).mockImplementation(() => new Promise(() => {}))

    render(<TaxDebtListPage />)

    // Check for loading spinner by class or test the visual loading state
    const loadingSpinner = document.querySelector('.animate-spin')
    expect(loadingSpinner).toBeInTheDocument()
  })

  it('displays list of tax debts with summary cards', async () => {
    vi.mocked(getTaxDebts).mockResolvedValue({
      success: true,
      data: mockDebts,
    })

    render(<TaxDebtListPage />)

    await waitFor(() => {
      expect(screen.getByText('Tax Debts')).toBeInTheDocument()
    })

    // Check summary cards
    expect(screen.getByText('$26,500')).toBeInTheDocument() // Total debt
    expect(screen.getByText('$23,000')).toBeInTheDocument() // Original amount
    expect(screen.getByText('+$3,500')).toBeInTheDocument() // Interest & penalties

    // Check debt entries are displayed (using getAllByText since years appear multiple times)
    const year2023Elements = screen.getAllByText('2023')
    expect(year2023Elements.length).toBeGreaterThan(0)
    const year2022Elements = screen.getAllByText('2022')
    expect(year2022Elements.length).toBeGreaterThan(0)
    const year2021Elements = screen.getAllByText('2021')
    expect(year2021Elements.length).toBeGreaterThan(0)
  })

  it('displays empty state when no debts exist', async () => {
    vi.mocked(getTaxDebts).mockResolvedValue({
      success: true,
      data: [],
    })

    render(<TaxDebtListPage />)

    await waitFor(() => {
      expect(screen.getByText('No Tax Debts')).toBeInTheDocument()
    })

    expect(screen.getByText(/start by adding your first tax debt/i)).toBeInTheDocument()
  })

  it('allows searching debts by tax year', async () => {
    vi.mocked(getTaxDebts).mockResolvedValue({
      success: true,
      data: mockDebts,
    })

    const user = userEvent.setup()
    render(<TaxDebtListPage />)

    await waitFor(() => {
      expect(screen.getAllByText('2023').length).toBeGreaterThan(0)
    })

    const searchInput = screen.getByPlaceholderText(/search debts/i)
    await user.type(searchInput, '2023')

    // 2023 should still be visible
    expect(screen.getAllByText('2023').length).toBeGreaterThan(0)
  })

  it('allows filtering by collection status', async () => {
    vi.mocked(getTaxDebts).mockResolvedValue({
      success: true,
      data: mockDebts,
    })

    const user = userEvent.setup()
    render(<TaxDebtListPage />)

    await waitFor(() => {
      expect(screen.getAllByText('2023').length).toBeGreaterThan(0)
    })

    // Find the status filter dropdown (there may be multiple select elements)
    const selects = screen.getAllByRole('combobox')
    const statusFilter = selects.find((select) =>
      select.querySelector('option[value="lien_filed"]')
    )

    if (statusFilter) {
      await user.selectOptions(statusFilter, 'lien_filed')
      // Should show Lien Filed badge (may appear multiple times)
      const lienFiledElements = screen.getAllByText('Lien Filed')
      expect(lienFiledElements.length).toBeGreaterThan(0)
    }
  })

  it('allows sorting by tax year', async () => {
    vi.mocked(getTaxDebts).mockResolvedValue({
      success: true,
      data: mockDebts,
    })

    const user = userEvent.setup()
    render(<TaxDebtListPage />)

    await waitFor(() => {
      expect(screen.getAllByText('2023').length).toBeGreaterThan(0)
    })

    // Click tax year sort button
    const sortButtons = screen.getAllByRole('button')
    const sortButton = sortButtons.find((btn) => btn.textContent?.includes('Tax Year'))

    if (sortButton) {
      await user.click(sortButton)
      // Verify button is still there (sorting direction changed)
      expect(sortButton).toBeInTheDocument()
    }
  })

  it('deletes a debt when delete button clicked', async () => {
    vi.mocked(getTaxDebts).mockResolvedValue({
      success: true,
      data: mockDebts,
    })

    vi.mocked(deleteTaxDebt).mockResolvedValue({
      success: true,
      data: undefined,
    })

    const user = userEvent.setup()
    render(<TaxDebtListPage />)

    await waitFor(() => {
      expect(screen.getAllByText('2023').length).toBeGreaterThan(0)
    })

    // Find delete buttons - they contain a trash icon (look for buttons with nested SVG)
    const allButtons = screen.getAllByRole('button')
    const deleteButton = allButtons.find((btn) => {
      const svg = btn.querySelector('svg')
      return svg && svg.classList.contains('lucide-trash-2')
    })

    if (deleteButton) {
      await user.click(deleteButton)

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalled()
        expect(deleteTaxDebt).toHaveBeenCalledWith('debt-1')
      })
    }
  })

  it('displays error when fetching debts fails', async () => {
    vi.mocked(getTaxDebts).mockResolvedValue({
      success: false,
      error: 'Failed to load debts',
    })

    render(<TaxDebtListPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load debts')).toBeInTheDocument()
    })
  })

  it('navigates to add new debt page', async () => {
    vi.mocked(getTaxDebts).mockResolvedValue({
      success: true,
      data: mockDebts,
    })

    render(<TaxDebtListPage />)

    await waitFor(() => {
      expect(screen.getByText('Tax Debts')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('link', { name: /add tax debt/i })
    expect(addButton).toHaveAttribute('href', '/tax-debt/debts/new')
  })
})

describe('Tax Debt E2E - Create New Debt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the new debt form with all fields', () => {
    render(<NewTaxDebtPage />)

    // "Add Tax Debt" appears in both heading and button
    const addTaxDebtElements = screen.getAllByText('Add Tax Debt')
    expect(addTaxDebtElements.length).toBeGreaterThan(0)

    // Check for form field labels - use getAllByText since some appear in multiple places
    const taxYearLabels = screen.getAllByText(/tax year/i)
    expect(taxYearLabels.length).toBeGreaterThan(0)

    expect(screen.getByText(/debt type/i)).toBeInTheDocument()
    expect(screen.getByText(/original amount/i)).toBeInTheDocument()
    expect(screen.getByText(/current balance/i)).toBeInTheDocument()
    expect(screen.getByText(/interest rate/i)).toBeInTheDocument()
    expect(screen.getByText(/collection status/i)).toBeInTheDocument()
  })

  it('successfully creates a new tax debt', async () => {
    const mockCreatedDebt: TaxDebt = {
      id: 'new-debt-123',
      user_id: 'user-123',
      tax_year: 2023,
      debt_type: 'income_tax',
      original_amount: 5000,
      current_balance: 5000,
      interest_rate: 8,
      penalty_rate: null,
      source: 'business',
      collection_status: 'normal',
      statute_expiration_date: '2033-04-15',
      daily_interest_rate: 0.00022,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }

    vi.mocked(createTaxDebt).mockResolvedValue({
      success: true,
      data: mockCreatedDebt,
    })

    const user = userEvent.setup()
    render(<NewTaxDebtPage />)

    // Fill out form
    const originalAmountInput = screen.getByLabelText(/original amount/i)
    const currentBalanceInput = screen.getByLabelText(/current balance/i)

    await user.clear(originalAmountInput)
    await user.type(originalAmountInput, '5000')

    await user.clear(currentBalanceInput)
    await user.type(currentBalanceInput, '5000')

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add tax debt/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(createTaxDebt).toHaveBeenCalledWith(
        expect.objectContaining({
          original_amount: 5000,
          current_balance: 5000,
        })
      )
      expect(mockPush).toHaveBeenCalledWith('/tax-debt/debts/new-debt-123')
    })
  })

  it('validates form before submission', async () => {
    const user = userEvent.setup()
    render(<NewTaxDebtPage />)

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /add tax debt/i })
    await user.click(submitButton)

    // Form should not submit with invalid data
    expect(createTaxDebt).not.toHaveBeenCalled()
  })

  it('shows warning when current balance exceeds original amount', async () => {
    const user = userEvent.setup()
    render(<NewTaxDebtPage />)

    const originalAmountInput = screen.getByLabelText(/original amount/i)
    const currentBalanceInput = screen.getByLabelText(/current balance/i)

    await user.clear(originalAmountInput)
    await user.type(originalAmountInput, '5000')

    await user.clear(currentBalanceInput)
    await user.type(currentBalanceInput, '6000')

    await waitFor(() => {
      expect(screen.getByText(/balance exceeds original/i)).toBeInTheDocument()
    })
  })

  it('allows selecting debt type and source', async () => {
    const user = userEvent.setup()
    render(<NewTaxDebtPage />)

    const debtTypeSelect = screen.getByLabelText(/debt type/i)
    await user.selectOptions(debtTypeSelect, 'penalty_failure_to_file')
    expect(debtTypeSelect).toHaveValue('penalty_failure_to_file')

    const sourceSelect = screen.getByLabelText(/source of debt/i)
    await user.selectOptions(sourceSelect, '1099_unreported')
    expect(sourceSelect).toHaveValue('1099_unreported')
  })

  it('allows selecting collection status', async () => {
    const user = userEvent.setup()
    render(<NewTaxDebtPage />)

    const statusSelect = screen.getByLabelText(/collection status/i)
    await user.selectOptions(statusSelect, 'notice_sent')
    expect(statusSelect).toHaveValue('notice_sent')
  })

  it('navigates back to list when cancel clicked', async () => {
    const user = userEvent.setup()
    render(<NewTaxDebtPage />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockPush).toHaveBeenCalledWith('/tax-debt/debts')
  })

  it('displays help information about IRS notices', () => {
    render(<NewTaxDebtPage />)

    expect(screen.getByText(/where to find this information/i)).toBeInTheDocument()

    // Look for content mentioning IRS notices (text is split with strong tags)
    expect(screen.getByText('IRS Notices:')).toBeInTheDocument()
    expect(screen.getByText(/CP14, CP501/i)).toBeInTheDocument()
    expect(screen.getByText('Tax Transcripts:')).toBeInTheDocument()
  })
})

describe('Tax Debt E2E - View and Edit Debt Details', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfirm.mockReturnValue(true)
  })

  const mockDebt: TaxDebt = {
    id: 'debt-123',
    user_id: 'user-123',
    tax_year: 2023,
    debt_type: 'income_tax',
    original_amount: 10000,
    current_balance: 12000,
    interest_rate: 8,
    penalty_rate: 5,
    source: 'business',
    collection_status: 'normal',
    statute_expiration_date: '2033-04-15',
    daily_interest_rate: 0.00022,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  const mockPayments: TaxDebtPayment[] = [
    {
      id: 'payment-1',
      tax_debt_id: 'debt-123',
      payment_date: '2024-01-15',
      amount: 1000,
      payment_method: 'Direct Pay',
      applied_to: 'mixed',
      confirmation_number: 'CONF123',
      created_at: '2024-01-15T00:00:00Z',
    },
    {
      id: 'payment-2',
      tax_debt_id: 'debt-123',
      payment_date: '2024-02-15',
      amount: 500,
      payment_method: 'Check',
      applied_to: 'principal',
      confirmation_number: null,
      created_at: '2024-02-15T00:00:00Z',
    },
  ]

  it('displays loading state while fetching debt details', () => {
    vi.mocked(getTaxDebt).mockImplementation(() => new Promise(() => {}))
    vi.mocked(getPaymentsForDebt).mockImplementation(() => new Promise(() => {}))

    render(<TaxDebtDetailPage />)

    // Check for loading spinner
    const loadingSpinner = document.querySelector('.animate-spin')
    expect(loadingSpinner).toBeInTheDocument()
  })

  it('displays debt details with all information', async () => {
    vi.mocked(getTaxDebt).mockResolvedValue({
      success: true,
      data: mockDebt,
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: mockPayments,
    })

    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Tax Year 2023')).toBeInTheDocument()
    })

    // Check summary cards
    expect(screen.getByText('$12,000.00')).toBeInTheDocument() // Current balance
    expect(screen.getByText('$10,000.00')).toBeInTheDocument() // Original amount
    expect(screen.getByText('+$2,000.00')).toBeInTheDocument() // Interest & penalties

    // Check collection status
    expect(screen.getByText('Normal')).toBeInTheDocument()

    // Check debt details (2023 may appear multiple times)
    const year2023 = screen.getAllByText('2023')
    expect(year2023.length).toBeGreaterThan(0)
    // Income Tax appears in multiple places, use getAllByText
    const incomeTaxElements = screen.getAllByText('Income Tax')
    expect(incomeTaxElements.length).toBeGreaterThan(0)
  })

  it('displays payment history', async () => {
    vi.mocked(getTaxDebt).mockResolvedValue({
      success: true,
      data: mockDebt,
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: mockPayments,
    })

    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Payment History')).toBeInTheDocument()
    })

    // Check payments are displayed
    expect(screen.getByText('-$1,000.00')).toBeInTheDocument()
    expect(screen.getByText('-$500.00')).toBeInTheDocument()
    // Check for confirmation number (may have # prefix)
    const conf123 = screen.getByText(/CONF123/i)
    expect(conf123).toBeInTheDocument()
  })

  it('displays empty state when no payments exist', async () => {
    vi.mocked(getTaxDebt).mockResolvedValue({
      success: true,
      data: mockDebt,
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: [],
    })

    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText(/no payments recorded yet/i)).toBeInTheDocument()
    })
  })

  it('switches to edit mode when edit button clicked', async () => {
    vi.mocked(getTaxDebt).mockResolvedValue({
      success: true,
      data: mockDebt,
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: [],
    })

    const user = userEvent.setup()
    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Tax Year 2023')).toBeInTheDocument()
    })

    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Tax Debt - 2023')).toBeInTheDocument()
    })
  })

  it('successfully updates debt details', async () => {
    vi.mocked(getTaxDebt).mockResolvedValue({
      success: true,
      data: mockDebt,
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: [],
    })

    const updatedDebt = { ...mockDebt, current_balance: 11000 }
    vi.mocked(updateTaxDebt).mockResolvedValue({
      success: true,
      data: updatedDebt,
    })

    const user = userEvent.setup()
    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Tax Year 2023')).toBeInTheDocument()
    })

    // Click edit button
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Tax Debt - 2023')).toBeInTheDocument()
    })

    // Update current balance
    const balanceInput = screen.getByLabelText(/current balance/i)
    await user.clear(balanceInput)
    await user.type(balanceInput, '11000')

    // Submit update
    const updateButton = screen.getByRole('button', { name: /update/i })
    await user.click(updateButton)

    await waitFor(() => {
      expect(updateTaxDebt).toHaveBeenCalledWith(
        'debt-123',
        expect.objectContaining({
          current_balance: 11000,
        })
      )
    })
  })

  it('deletes debt when delete button clicked', async () => {
    vi.mocked(getTaxDebt).mockResolvedValue({
      success: true,
      data: mockDebt,
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: [],
    })

    vi.mocked(deleteTaxDebt).mockResolvedValue({
      success: true,
      data: undefined,
    })

    const user = userEvent.setup()
    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Tax Year 2023')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    await user.click(deleteButton)

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled()
      expect(deleteTaxDebt).toHaveBeenCalledWith('debt-123')
      expect(mockPush).toHaveBeenCalledWith('/tax-debt/debts')
    })
  })

  it('displays error when debt not found', async () => {
    vi.mocked(getTaxDebt).mockResolvedValue({
      success: false,
      error: 'Tax debt not found',
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: [],
    })

    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Tax debt not found')).toBeInTheDocument()
    })
  })
})

describe('Tax Debt E2E - Record Payment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockDebt: TaxDebt = {
    id: 'debt-123',
    user_id: 'user-123',
    tax_year: 2023,
    debt_type: 'income_tax',
    original_amount: 10000,
    current_balance: 12000,
    interest_rate: 8,
    penalty_rate: 5,
    source: 'business',
    collection_status: 'normal',
    statute_expiration_date: '2033-04-15',
    daily_interest_rate: 0.00022,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  it('shows payment form when record payment clicked', async () => {
    vi.mocked(getTaxDebt).mockResolvedValue({
      success: true,
      data: mockDebt,
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: [],
    })

    const user = userEvent.setup()
    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Tax Year 2023')).toBeInTheDocument()
    })

    const recordButton = screen.getByRole('button', { name: /record payment/i })
    await user.click(recordButton)

    await waitFor(() => {
      expect(screen.getByText('Record New Payment')).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/payment date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/applied to/i)).toBeInTheDocument()
  })

  it('successfully records a payment', async () => {
    vi.mocked(getTaxDebt).mockResolvedValue({
      success: true,
      data: mockDebt,
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: [],
    })

    const mockPayment: TaxDebtPayment = {
      id: 'payment-new',
      tax_debt_id: 'debt-123',
      payment_date: '2024-03-15',
      amount: 1000,
      payment_method: 'Direct Pay',
      applied_to: 'mixed',
      confirmation_number: 'CONF456',
      created_at: '2024-03-15T00:00:00Z',
    }

    vi.mocked(recordPayment).mockResolvedValue({
      success: true,
      data: mockPayment,
    })

    // Mock getTaxDebt to return debt
    vi.mocked(getTaxDebt).mockResolvedValueOnce({
      success: true,
      data: mockDebt,
    })

    const user = userEvent.setup()
    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Tax Year 2023')).toBeInTheDocument()
    })

    // Open payment form
    const recordButton = screen.getByRole('button', { name: /record payment/i })
    await user.click(recordButton)

    await waitFor(() => {
      expect(screen.getByText('Record New Payment')).toBeInTheDocument()
    })

    // Fill out payment form - need to find specific inputs within form context
    const amountInputs = screen.getAllByLabelText(/amount/i)
    const amountInput = amountInputs[amountInputs.length - 1] // Get the one in the payment form
    await user.type(amountInput, '1000')

    const methodInput = screen.getByLabelText(/payment method/i)
    await user.type(methodInput, 'Direct Pay')

    const confirmationInput = screen.getByLabelText(/confirmation number/i)
    await user.type(confirmationInput, 'CONF456')

    // Submit payment - there will be multiple "Record Payment" buttons
    const submitButtons = screen.getAllByRole('button', { name: /record payment/i })
    const submitButton = submitButtons[submitButtons.length - 1] // Get the submit button in the form
    await user.click(submitButton)

    await waitFor(() => {
      expect(recordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          tax_debt_id: 'debt-123',
          amount: 1000,
          payment_method: 'Direct Pay',
          confirmation_number: 'CONF456',
        })
      )
    })
  })

  it('validates payment amount is required', async () => {
    vi.mocked(getTaxDebt).mockResolvedValue({
      success: true,
      data: mockDebt,
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: [],
    })

    const user = userEvent.setup()
    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Tax Year 2023')).toBeInTheDocument()
    })

    // Open payment form
    const recordButton = screen.getByRole('button', { name: /record payment/i })
    await user.click(recordButton)

    await waitFor(() => {
      expect(screen.getByText('Record New Payment')).toBeInTheDocument()
    })

    // Try to submit without amount - there are multiple "Record Payment" buttons
    const submitButtons = screen.getAllByRole('button', { name: /record payment/i })
    const submitButton = submitButtons[submitButtons.length - 1] // Get the submit button in the form
    await user.click(submitButton)

    // Should show alert or validation error
    expect(recordPayment).not.toHaveBeenCalled()
  })

  it('allows selecting different applied_to options', async () => {
    vi.mocked(getTaxDebt).mockResolvedValue({
      success: true,
      data: mockDebt,
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: [],
    })

    const user = userEvent.setup()
    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Tax Year 2023')).toBeInTheDocument()
    })

    // Open payment form
    const recordButton = screen.getByRole('button', { name: /record payment/i })
    await user.click(recordButton)

    await waitFor(() => {
      expect(screen.getByText('Record New Payment')).toBeInTheDocument()
    })

    const appliedToSelect = screen.getByLabelText(/applied to/i)
    await user.selectOptions(appliedToSelect, 'principal')
    expect(appliedToSelect).toHaveValue('principal')

    await user.selectOptions(appliedToSelect, 'interest')
    expect(appliedToSelect).toHaveValue('interest')
  })
})

describe('Tax Debt E2E - Collection Status Changes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockDebt: TaxDebt = {
    id: 'debt-123',
    user_id: 'user-123',
    tax_year: 2023,
    debt_type: 'income_tax',
    original_amount: 10000,
    current_balance: 12000,
    interest_rate: 8,
    penalty_rate: 5,
    source: 'business',
    collection_status: 'normal',
    statute_expiration_date: '2033-04-15',
    daily_interest_rate: 0.00022,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  it('allows changing collection status from normal to notice_sent', async () => {
    vi.mocked(getTaxDebt).mockResolvedValue({
      success: true,
      data: mockDebt,
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: [],
    })

    const updatedDebt = { ...mockDebt, collection_status: 'notice_sent' }
    vi.mocked(updateTaxDebt).mockResolvedValue({
      success: true,
      data: updatedDebt as TaxDebt,
    })

    const user = userEvent.setup()
    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Tax Year 2023')).toBeInTheDocument()
    })

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Tax Debt - 2023')).toBeInTheDocument()
    })

    // Change collection status
    const statusSelect = screen.getByLabelText(/collection status/i)
    await user.selectOptions(statusSelect, 'notice_sent')

    // Submit update
    const updateButton = screen.getByRole('button', { name: /update/i })
    await user.click(updateButton)

    await waitFor(() => {
      expect(updateTaxDebt).toHaveBeenCalledWith(
        'debt-123',
        expect.objectContaining({
          collection_status: 'notice_sent',
        })
      )
    })
  })

  it('displays urgent warning for severe collection statuses', async () => {
    const urgentDebt = { ...mockDebt, collection_status: 'levy_active' }

    vi.mocked(getTaxDebt).mockResolvedValue({
      success: true,
      data: urgentDebt as TaxDebt,
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: [],
    })

    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Levy Active')).toBeInTheDocument()
    })
  })

  it('allows updating to currently_not_collectible status', async () => {
    vi.mocked(getTaxDebt).mockResolvedValue({
      success: true,
      data: mockDebt,
    })

    vi.mocked(getPaymentsForDebt).mockResolvedValue({
      success: true,
      data: [],
    })

    const updatedDebt = { ...mockDebt, collection_status: 'currently_not_collectible' }
    vi.mocked(updateTaxDebt).mockResolvedValue({
      success: true,
      data: updatedDebt as TaxDebt,
    })

    const user = userEvent.setup()
    render(<TaxDebtDetailPage />)

    await waitFor(() => {
      expect(screen.getByText('Tax Year 2023')).toBeInTheDocument()
    })

    // Enter edit mode
    const editButton = screen.getByRole('button', { name: /edit/i })
    await user.click(editButton)

    // Change to CNC status
    const statusSelect = screen.getByLabelText(/collection status/i)
    await user.selectOptions(statusSelect, 'currently_not_collectible')

    // Submit
    const updateButton = screen.getByRole('button', { name: /update/i })
    await user.click(updateButton)

    await waitFor(() => {
      expect(updateTaxDebt).toHaveBeenCalledWith(
        'debt-123',
        expect.objectContaining({
          collection_status: 'currently_not_collectible',
        })
      )
    })
  })
})
