import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlaidLinkButton } from '@/components/features/transactions/plaid-link-button'

// Mock react-plaid-link
const mockOpen = vi.fn()
vi.mock('react-plaid-link', () => ({
  usePlaidLink: vi.fn(() => ({
    open: mockOpen,
    ready: true,
    error: null,
    exit: vi.fn(),
  })),
}))

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

describe('PlaidLinkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('renders the button with default text', () => {
    render(<PlaidLinkButton />)

    expect(screen.getByRole('button', { name: /connect bank account/i })).toBeInTheDocument()
  })

  it('renders custom children', () => {
    render(<PlaidLinkButton>Link My Bank</PlaidLinkButton>)

    expect(screen.getByRole('button', { name: /link my bank/i })).toBeInTheDocument()
  })

  it('fetches link token when clicked', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ link_token: 'test-link-token' }),
    })

    render(<PlaidLinkButton />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/plaid/create-link-token', {
        method: 'POST',
      })
    })
  })

  it('shows loading state while fetching link token', async () => {
    const user = userEvent.setup()
    // Never resolve to keep loading state
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true, json: async () => ({ link_token: 'test' }) }), 1000)
        })
    )

    render(<PlaidLinkButton />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('disables button when loading', async () => {
    const user = userEvent.setup()
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true, json: async () => ({ link_token: 'test' }) }), 1000)
        })
    )

    render(<PlaidLinkButton />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows error toast when link token fetch fails', async () => {
    const { toast } = await import('sonner')
    const user = userEvent.setup()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Token creation failed' }),
    })

    render(<PlaidLinkButton />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to initialize bank connection')
    })
  })

  it('accepts different variants', () => {
    const { rerender } = render(<PlaidLinkButton variant="outline" />)
    expect(screen.getByRole('button')).toBeInTheDocument()

    rerender(<PlaidLinkButton variant="secondary" />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('accepts different sizes', () => {
    const { rerender } = render(<PlaidLinkButton size="sm" />)
    expect(screen.getByRole('button')).toBeInTheDocument()

    rerender(<PlaidLinkButton size="lg" />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('accepts custom className', () => {
    render(<PlaidLinkButton className="custom-class" />)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })
})

describe('PlaidLinkButton - Token Exchange', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('handles successful token exchange flow', async () => {
    const { usePlaidLink } = await import('react-plaid-link')
    const { toast } = await import('sonner')

    let onSuccessCallback: (token: string) => void

    // Capture the onSuccess callback
    vi.mocked(usePlaidLink).mockImplementation(({ onSuccess }) => {
      onSuccessCallback = onSuccess as unknown as (token: string) => void
      return {
        open: mockOpen,
        ready: true,
        error: null,
        exit: vi.fn(),
      }
    })

    // Mock all API calls
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ link_token: 'test-link-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ item_id: 'item-123', institution_name: 'Chase' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

    const onSuccess = vi.fn()
    render(<PlaidLinkButton onSuccess={onSuccess} />)

    // Simulate successful Plaid Link flow
    // @ts-expect-error - onSuccessCallback is assigned in mock
    onSuccessCallback('public-token-123')

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/plaid/exchange-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ public_token: 'public-token-123' }),
      })
    })

    await waitFor(() => {
      // The toast message depends on whether institution_name is returned
      // We check that success was called with a message about connection
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('shows error toast when token exchange fails', async () => {
    const { usePlaidLink } = await import('react-plaid-link')
    const { toast } = await import('sonner')

    let onSuccessCallback: (token: string) => void

    vi.mocked(usePlaidLink).mockImplementation(({ onSuccess }) => {
      onSuccessCallback = onSuccess as unknown as (token: string) => void
      return {
        open: mockOpen,
        ready: true,
        error: null,
        exit: vi.fn(),
      }
    })

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Exchange failed' }),
    })

    render(<PlaidLinkButton />)

    // @ts-expect-error - onSuccessCallback is assigned in mock
    onSuccessCallback('public-token-123')

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to connect bank account')
    })
  })

  it('handles Plaid Link exit with error', async () => {
    const { usePlaidLink } = await import('react-plaid-link')
    const { toast } = await import('sonner')

    let onExitCallback: (error: { display_message: string } | null) => void

    vi.mocked(usePlaidLink).mockImplementation(({ onExit }) => {
      onExitCallback = onExit as unknown as (error: { display_message: string } | null) => void
      return {
        open: mockOpen,
        ready: true,
        error: null,
        exit: vi.fn(),
      }
    })

    render(<PlaidLinkButton />)

    // Simulate exit with error
    // @ts-expect-error - onExitCallback is assigned in mock
    onExitCallback({ display_message: 'User closed modal' })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Bank connection was interrupted')
    })
  })

  it('handles Plaid Link exit without error gracefully', async () => {
    const { usePlaidLink } = await import('react-plaid-link')
    const { toast } = await import('sonner')

    let onExitCallback: (error: null) => void

    vi.mocked(usePlaidLink).mockImplementation(({ onExit }) => {
      onExitCallback = onExit as unknown as (error: null) => void
      return {
        open: mockOpen,
        ready: true,
        error: null,
        exit: vi.fn(),
      }
    })

    render(<PlaidLinkButton />)

    // Simulate exit without error (user cancelled)
    // @ts-expect-error - onExitCallback is assigned in mock
    onExitCallback(null)

    // Should not show error toast when user simply closes modal
    expect(toast.error).not.toHaveBeenCalled()
  })
})
