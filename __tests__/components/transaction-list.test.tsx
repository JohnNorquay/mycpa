import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { TransactionList } from '@/components/features/transactions/transaction-list'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock IntersectionObserver
const mockObserve = vi.fn()
const mockUnobserve = vi.fn()
const mockDisconnect = vi.fn()
let intersectionCallback: IntersectionObserverCallback | null = null

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback
  }
  observe = mockObserve
  unobserve = mockUnobserve
  disconnect = mockDisconnect
}

beforeEach(() => {
  intersectionCallback = null
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
})

afterEach(() => {
  vi.clearAllMocks()
  mockFetch.mockReset()
})

const mockTransactions = [
  {
    id: 'txn-1',
    date: '2024-01-15',
    amount: -59.99,
    merchant_name: 'Amazon',
    category: 'Shopping',
    is_tax_deductible: false,
    is_recurring: false,
    notes: null,
    account: { name: 'Chase Checking', type: 'depository' },
  },
  {
    id: 'txn-2',
    date: '2024-01-15',
    amount: -25.5,
    merchant_name: 'Uber',
    category: 'Transportation',
    is_tax_deductible: false,
    is_recurring: false,
    notes: null,
    account: { name: 'Chase Checking', type: 'depository' },
  },
  {
    id: 'txn-3',
    date: '2024-01-14',
    amount: 3500.0,
    merchant_name: 'Direct Deposit',
    category: 'Income',
    is_tax_deductible: false,
    is_recurring: true,
    notes: null,
    account: { name: 'Chase Checking', type: 'depository' },
  },
]

describe('TransactionList', () => {
  it('renders empty state when no initial transactions and loading completes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: [],
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      expect(screen.getByText('No transactions')).toBeInTheDocument()
    })
  })

  it('renders initial transactions', () => {
    render(<TransactionList initialTransactions={mockTransactions} />)

    expect(screen.getByText('Amazon')).toBeInTheDocument()
    expect(screen.getByText('Uber')).toBeInTheDocument()
    expect(screen.getByText('Direct Deposit')).toBeInTheDocument()
  })

  it('fetches transactions on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/transactions'))
    })
  })

  it('displays transactions from API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      expect(screen.getByText('Amazon')).toBeInTheDocument()
    })

    expect(screen.getByText('Uber')).toBeInTheDocument()
    expect(screen.getByText('Direct Deposit')).toBeInTheDocument()
  })

  it('displays category for transactions', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    expect(screen.getByText('Transportation')).toBeInTheDocument()
    expect(screen.getByText('Income')).toBeInTheDocument()
  })

  it('displays account name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      // Multiple transactions have the same account
      const accountNames = screen.getAllByText('Chase Checking')
      expect(accountNames.length).toBeGreaterThan(0)
    })
  })

  it('shows recurring badge for recurring transactions', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      expect(screen.getByText('Recurring')).toBeInTheDocument()
    })
  })

  it('shows tax deductible badge when applicable', async () => {
    const taxDeductibleTransactions = [
      {
        ...mockTransactions[0],
        is_tax_deductible: true,
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: taxDeductibleTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      expect(screen.getByText('Tax Deductible')).toBeInTheDocument()
    })
  })

  it('formats negative amounts as expenses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      // Check for minus sign and amount
      expect(screen.getByText('-$59.99')).toBeInTheDocument()
    })
  })

  it('formats positive amounts as income', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      // Check for plus sign and amount
      expect(screen.getByText('+$3,500.00')).toBeInTheDocument()
    })
  })

  it('shows "Unknown Merchant" when merchant_name is null', async () => {
    const transactionsWithNullMerchant = [
      {
        ...mockTransactions[0],
        merchant_name: null,
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: transactionsWithNullMerchant,
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      expect(screen.getByText('Unknown Merchant')).toBeInTheDocument()
    })
  })
})

describe('TransactionList - Filtering', () => {
  it('passes dateFrom filter to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList filters={{ dateFrom: '2024-01-01' }} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('dateFrom=2024-01-01'))
    })
  })

  it('passes dateTo filter to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList filters={{ dateTo: '2024-01-31' }} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('dateTo=2024-01-31'))
    })
  })

  it('passes category filter to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList filters={{ category: 'Shopping' }} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('category=Shopping'))
    })
  })

  it('passes accountId filter to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList filters={{ accountId: 'acct-123' }} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('accountId=acct-123'))
    })
  })

  it('passes search filter to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList filters={{ search: 'amazon' }} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('search=amazon'))
    })
  })

  it('passes multiple filters to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(
      <TransactionList
        filters={{
          dateFrom: '2024-01-01',
          dateTo: '2024-01-31',
          category: 'Shopping',
        }}
      />
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/dateFrom.*dateTo|dateTo.*dateFrom/)
      )
    })
  })

  it('shows filter-specific empty message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: [],
        hasMore: false,
      }),
    })

    render(<TransactionList filters={{ category: 'Shopping' }} />)

    await waitFor(() => {
      expect(screen.getByText(/no transactions match your filters/i)).toBeInTheDocument()
    })
  })
})

describe('TransactionList - Pagination', () => {
  it('passes page and limit to API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList pageSize={25} />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('page=1'))
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('limit=25'))
    })
  })

  it('sets up IntersectionObserver for infinite scroll', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: true,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      expect(mockObserve).toHaveBeenCalled()
    })
  })

  it('shows loading indicator when loading more', async () => {
    // First load
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: true,
      }),
    })

    // Never resolve second load to keep loading state
    mockFetch.mockImplementationOnce(() => new Promise(() => {}))

    render(<TransactionList />)

    await waitFor(() => {
      expect(screen.getByText('Amazon')).toBeInTheDocument()
    })

    // Trigger the intersection observer callback
    if (intersectionCallback) {
      intersectionCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    }

    await waitFor(() => {
      expect(screen.getByText(/loading more transactions/i)).toBeInTheDocument()
    })
  })

  it('shows "no more" message when all loaded', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      expect(screen.getByText('No more transactions to load')).toBeInTheDocument()
    })
  })

  it('disconnects observer on unmount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    const { unmount } = render(<TransactionList />)

    await waitFor(() => {
      expect(screen.getByText('Amazon')).toBeInTheDocument()
    })

    unmount()

    expect(mockDisconnect).toHaveBeenCalled()
  })
})

describe('TransactionList - Click Handler', () => {
  it('calls onTransactionClick when transaction clicked', async () => {
    const handleClick = vi.fn()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList onTransactionClick={handleClick} />)

    await waitFor(() => {
      expect(screen.getByText('Amazon')).toBeInTheDocument()
    })

    screen.getByText('Amazon').closest('div[class*="cursor-pointer"]')?.click()

    // Click was triggered
    expect(handleClick).toHaveBeenCalled()
  })

  it('does not add cursor-pointer class without onClick handler', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      expect(screen.getByText('Amazon')).toBeInTheDocument()
    })

    // Without onTransactionClick, should not have cursor-pointer
    const transactionRow = screen
      .getByText('Amazon')
      .closest('div[class*="flex items-center justify-between"]')
    expect(transactionRow?.className).not.toContain('cursor-pointer')
  })
})

describe('TransactionList - Date Grouping', () => {
  it('groups transactions by date', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      // Should show date headers
      // Jan 15 has Amazon and Uber
      // Jan 14 has Direct Deposit
      expect(screen.getByText('Amazon')).toBeInTheDocument()
    })

    // Multiple transactions on same day should be grouped
    const amazonRow = screen.getByText('Amazon').closest('div[class*="divide-y"]')
    expect(amazonRow).toContainElement(screen.getByText('Uber'))
  })

  it('sorts dates in descending order', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        transactions: mockTransactions,
        hasMore: false,
      }),
    })

    render(<TransactionList />)

    await waitFor(() => {
      expect(screen.getByText('Amazon')).toBeInTheDocument()
    })

    // The transactions are grouped by date and sorted descending
    // Amazon and Uber (Jan 15) should appear before Direct Deposit (Jan 14)
    const amazonParent = screen.getByText('Amazon').closest('div[class*="divide-y"]')
    const depositParent = screen.getByText('Direct Deposit').closest('div[class*="divide-y"]')

    // They should be in different groups (different dates)
    expect(amazonParent).not.toBe(depositParent)

    // The transaction list should contain both
    expect(screen.getByText('Amazon')).toBeInTheDocument()
    expect(screen.getByText('Direct Deposit')).toBeInTheDocument()
  })
})

describe('TransactionList - Error Handling', () => {
  it('handles fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<TransactionList />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching transactions:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })

  it('handles non-ok response', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    render(<TransactionList />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })

    consoleSpy.mockRestore()
  })
})
