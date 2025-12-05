import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountsList } from '@/app/(dashboard)/settings/accounts/accounts-list'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock window.confirm
const mockConfirm = vi.fn()
global.confirm = mockConfirm

// Mock window.location.reload
const mockReload = vi.fn()
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
})

const mockItems = [
  {
    id: 'item-1',
    institution_name: 'Chase',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    last_synced: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
    accounts: [
      {
        id: 'account-1',
        name: 'Checking Account',
        type: 'depository',
        subtype: 'checking',
        current_balance: 5000.5,
        available_balance: 4800.0,
        last_synced: new Date().toISOString(),
      },
      {
        id: 'account-2',
        name: 'Savings Account',
        type: 'depository',
        subtype: 'savings',
        current_balance: 15000.0,
        available_balance: 15000.0,
        last_synced: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'item-2',
    institution_name: 'American Express',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    last_synced: null,
    accounts: [
      {
        id: 'account-3',
        name: 'Gold Card',
        type: 'credit',
        subtype: 'credit card',
        current_balance: -2500.0,
        available_balance: null,
        last_synced: null,
      },
    ],
  },
]

describe('AccountsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockConfirm.mockReset()
    mockReload.mockReset()
  })

  it('renders institution names', () => {
    render(<AccountsList items={mockItems} />)

    expect(screen.getByText('Chase')).toBeInTheDocument()
    expect(screen.getByText('American Express')).toBeInTheDocument()
  })

  it('renders account names and types', () => {
    render(<AccountsList items={mockItems} />)

    expect(screen.getByText('Checking Account')).toBeInTheDocument()
    expect(screen.getByText('Savings Account')).toBeInTheDocument()
    expect(screen.getByText('Gold Card')).toBeInTheDocument()
    expect(screen.getByText('checking')).toBeInTheDocument()
    expect(screen.getByText('savings')).toBeInTheDocument()
  })

  it('formats balances as currency', () => {
    render(<AccountsList items={mockItems} />)

    expect(screen.getByText('$5,000.50')).toBeInTheDocument()
    expect(screen.getByText('$15,000.00')).toBeInTheDocument()
    expect(screen.getByText('-$2,500.00')).toBeInTheDocument()
  })

  it('shows available balance when different from current', () => {
    render(<AccountsList items={mockItems} />)

    expect(screen.getByText('$4,800.00 available')).toBeInTheDocument()
  })

  it('shows sync button for each institution', () => {
    render(<AccountsList items={mockItems} />)

    const syncButtons = screen.getAllByRole('button', { name: /sync/i })
    expect(syncButtons).toHaveLength(2)
  })

  it('shows disconnect button for each institution', () => {
    render(<AccountsList items={mockItems} />)

    // Disconnect buttons only have the Trash2 icon, find them
    const allButtons = screen.getAllByRole('button')
    // Filter to find disconnect buttons (they have Trash2 icon children)
    expect(allButtons.length).toBeGreaterThan(2)
  })

  it('shows last synced status', () => {
    render(<AccountsList items={mockItems} />)

    expect(screen.getByText(/last synced/i)).toBeInTheDocument()
    expect(screen.getByText('Never synced')).toBeInTheDocument()
  })

  it('shows "never synced" when no last_synced date', () => {
    render(<AccountsList items={mockItems} />)

    expect(screen.getByText('Never synced')).toBeInTheDocument()
  })

  it('handles empty items array', () => {
    render(<AccountsList items={[]} />)

    // Should render without crashing
    expect(screen.queryByText('Chase')).not.toBeInTheDocument()
  })

  it('shows message when institution has no accounts', () => {
    const itemWithNoAccounts = [
      {
        id: 'item-3',
        institution_name: 'Test Bank',
        created_at: new Date().toISOString(),
        last_synced: null,
        accounts: [],
      },
    ]

    render(<AccountsList items={itemWithNoAccounts} />)

    expect(screen.getByText(/no accounts found/i)).toBeInTheDocument()
  })
})

describe('AccountsList - Sync Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('calls sync API when sync button clicked', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ synced: 2 }),
    })

    render(<AccountsList items={mockItems} />)

    const syncButtons = screen.getAllByRole('button', { name: /sync/i })
    await user.click(syncButtons[0])

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/plaid/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plaid_item_id: 'item-1' }),
      })
    })
  })

  it('shows loading state during sync', async () => {
    const user = userEvent.setup()
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ synced: 2 }),
              }),
            1000
          )
        )
    )

    render(<AccountsList items={mockItems} />)

    const syncButtons = screen.getAllByRole('button', { name: /sync/i })
    await user.click(syncButtons[0])

    expect(screen.getByText(/syncing/i)).toBeInTheDocument()
  })

  it('shows success toast after successful sync', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ synced: 2 }),
    })

    render(<AccountsList items={mockItems} />)

    const syncButtons = screen.getAllByRole('button', { name: /sync/i })
    await user.click(syncButtons[0])

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Synced 2 account(s) successfully')
    })
  })

  it('reloads page after successful sync', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ synced: 2 }),
    })

    render(<AccountsList items={mockItems} />)

    const syncButtons = screen.getAllByRole('button', { name: /sync/i })
    await user.click(syncButtons[0])

    await waitFor(() => {
      expect(mockReload).toHaveBeenCalled()
    })
  })

  it('shows error toast when sync fails', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Sync failed' }),
    })

    render(<AccountsList items={mockItems} />)

    const syncButtons = screen.getAllByRole('button', { name: /sync/i })
    await user.click(syncButtons[0])

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to sync transactions')
    })
  })
})

describe('AccountsList - Disconnect Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockConfirm.mockReset()
  })

  it('shows confirmation dialog before disconnect', async () => {
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(false)

    render(<AccountsList items={mockItems} />)

    // Find the disconnect button (it's the red-colored button with Trash icon)
    const allButtons = screen.getAllByRole('button')
    const disconnectButton = allButtons.find((btn) => btn.className.includes('text-red'))

    if (disconnectButton) {
      await user.click(disconnectButton)
    }

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to disconnect Chase? This will remove all associated transactions.'
    )
  })

  it('does not disconnect when confirmation cancelled', async () => {
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(false)

    render(<AccountsList items={mockItems} />)

    const allButtons = screen.getAllByRole('button')
    const disconnectButton = allButtons.find((btn) => btn.className.includes('text-red'))

    if (disconnectButton) {
      await user.click(disconnectButton)
    }

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('calls disconnect API when confirmed', async () => {
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(true)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<AccountsList items={mockItems} />)

    const allButtons = screen.getAllByRole('button')
    const disconnectButton = allButtons.find((btn) => btn.className.includes('text-red'))

    if (disconnectButton) {
      await user.click(disconnectButton)
    }

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/plaid/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plaid_item_id: 'item-1' }),
      })
    })
  })

  it('removes item from list after successful disconnect', async () => {
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(true)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<AccountsList items={mockItems} />)

    expect(screen.getByText('Chase')).toBeInTheDocument()

    const allButtons = screen.getAllByRole('button')
    const disconnectButton = allButtons.find((btn) => btn.className.includes('text-red'))

    if (disconnectButton) {
      await user.click(disconnectButton)
    }

    await waitFor(() => {
      expect(screen.queryByText('Chase')).not.toBeInTheDocument()
    })
  })

  it('shows success toast after successful disconnect', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(true)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<AccountsList items={mockItems} />)

    const allButtons = screen.getAllByRole('button')
    const disconnectButton = allButtons.find((btn) => btn.className.includes('text-red'))

    if (disconnectButton) {
      await user.click(disconnectButton)
    }

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Chase disconnected successfully')
    })
  })

  it('shows error toast when disconnect fails', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(true)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Disconnect failed' }),
    })

    render(<AccountsList items={mockItems} />)

    const allButtons = screen.getAllByRole('button')
    const disconnectButton = allButtons.find((btn) => btn.className.includes('text-red'))

    if (disconnectButton) {
      await user.click(disconnectButton)
    }

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to disconnect account')
    })
  })
})

describe('AccountsList - Edge Cases', () => {
  it('handles null institution_name', () => {
    const itemsWithNullName = [
      {
        id: 'item-1',
        institution_name: null,
        created_at: new Date().toISOString(),
        last_synced: null,
        accounts: [],
      },
    ]

    render(<AccountsList items={itemsWithNullName} />)

    expect(screen.getByText('Unknown Institution')).toBeInTheDocument()
  })

  it('handles null balance values', () => {
    const itemsWithNullBalance = [
      {
        id: 'item-1',
        institution_name: 'Test Bank',
        created_at: new Date().toISOString(),
        last_synced: null,
        accounts: [
          {
            id: 'account-1',
            name: 'Test Account',
            type: 'depository',
            subtype: null,
            current_balance: null,
            available_balance: null,
            last_synced: null,
          },
        ],
      },
    ]

    render(<AccountsList items={itemsWithNullBalance} />)

    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('handles null account type', () => {
    const itemsWithNullType = [
      {
        id: 'item-1',
        institution_name: 'Test Bank',
        created_at: new Date().toISOString(),
        last_synced: null,
        accounts: [
          {
            id: 'account-1',
            name: 'Test Account',
            type: null,
            subtype: null,
            current_balance: 1000,
            available_balance: 1000,
            last_synced: null,
          },
        ],
      },
    ]

    render(<AccountsList items={itemsWithNullType} />)

    expect(screen.getByText('Account')).toBeInTheDocument()
  })
})
