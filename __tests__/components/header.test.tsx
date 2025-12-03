import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '@/components/layout/header'

// Mock the auth action
vi.mock('@/app/actions/auth', () => ({
  signOut: vi.fn(),
}))

describe('Header', () => {
  it('renders the user menu button', () => {
    render(<Header />)

    const menuButton = screen.getByRole('button')
    expect(menuButton).toBeInTheDocument()
  })

  it('shows user email when menu is open', async () => {
    const user = userEvent.setup()
    render(<Header userEmail="test@example.com" />)

    // Click to open menu
    await user.click(screen.getByRole('button'))

    expect(screen.getByText('Signed in as')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('shows settings link when menu is open', async () => {
    const user = userEvent.setup()
    render(<Header />)

    // Click to open menu
    await user.click(screen.getByRole('button'))

    const settingsLink = screen.getByRole('link', { name: /settings/i })
    expect(settingsLink).toBeInTheDocument()
    expect(settingsLink).toHaveAttribute('href', '/settings')
  })

  it('shows sign out button when menu is open', async () => {
    const user = userEvent.setup()
    render(<Header />)

    // Click to open menu
    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('closes menu when clicking outside', async () => {
    const user = userEvent.setup()
    render(<Header userEmail="test@example.com" />)

    // Open menu
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Signed in as')).toBeInTheDocument()

    // Click outside (on body)
    await user.click(document.body)

    // Menu should be closed
    expect(screen.queryByText('Signed in as')).not.toBeInTheDocument()
  })
})
