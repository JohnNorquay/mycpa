import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '@/components/layout/sidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

describe('Sidebar', () => {
  it('renders the app title', () => {
    render(<Sidebar />)
    expect(screen.getByText('CPA Bot')).toBeInTheDocument()
  })

  it('renders all navigation items', () => {
    render(<Sidebar />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Tax Debt')).toBeInTheDocument()
    expect(screen.getByText('Cash Flow')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
    expect(screen.getByText('Tax Center')).toBeInTheDocument()
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders navigation links with correct hrefs', () => {
    render(<Sidebar />)

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: /tax debt/i })).toHaveAttribute('href', '/tax-debt')
    expect(screen.getByRole('link', { name: /cash flow/i })).toHaveAttribute('href', '/cash-flow')
    expect(screen.getByRole('link', { name: /transactions/i })).toHaveAttribute(
      'href',
      '/transactions'
    )
    expect(screen.getByRole('link', { name: /tax center/i })).toHaveAttribute('href', '/tax-center')
    expect(screen.getByRole('link', { name: /documents/i })).toHaveAttribute('href', '/documents')
    expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/settings')
  })

  it('renders mobile menu button', () => {
    render(<Sidebar />)

    // The mobile menu toggle button is always rendered
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('toggles sidebar visibility on mobile menu button click', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    const menuButton = screen.getByRole('button')
    const sidebar = screen.getByRole('complementary')

    // Initially sidebar is hidden (translated off-screen on mobile)
    expect(sidebar).toHaveClass('-translate-x-full')

    // Click to open
    await user.click(menuButton)
    expect(sidebar).toHaveClass('translate-x-0')

    // Click to close
    await user.click(menuButton)
    expect(sidebar).toHaveClass('-translate-x-full')
  })
})
