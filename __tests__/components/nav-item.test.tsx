import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavItem } from '@/components/layout/nav-item'
import { Home } from 'lucide-react'

describe('NavItem', () => {
  it('renders with label and icon', () => {
    render(<NavItem href="/test" icon={Home} label="Test Label" />)

    expect(screen.getByText('Test Label')).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/test')
  })

  it('applies active styles when pathname matches href exactly', () => {
    vi.mock('next/navigation', () => ({
      usePathname: () => '/test',
    }))

    render(<NavItem href="/test" icon={Home} label="Test" />)

    const link = screen.getByRole('link')
    expect(link).toHaveClass('dark:bg-gray-800')
    expect(link).toHaveClass('dark:text-white')
  })

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(<NavItem href="/test" icon={Home} label="Test" onClick={onClick} />)

    await user.click(screen.getByRole('link'))
    expect(onClick).toHaveBeenCalled()
  })
})
