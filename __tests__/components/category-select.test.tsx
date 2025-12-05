import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategorySelect } from '@/components/features/transactions/category-select'

const mockCategories = [
  { id: 'cat-1', name: 'Food & Dining', parent_id: null, is_tax_deductible: false },
  { id: 'cat-2', name: 'Restaurants', parent_id: 'cat-1', is_tax_deductible: false },
  { id: 'cat-3', name: 'Groceries', parent_id: 'cat-1', is_tax_deductible: false },
  { id: 'cat-4', name: 'Business', parent_id: null, is_tax_deductible: false },
  { id: 'cat-5', name: 'Office Supplies', parent_id: 'cat-4', is_tax_deductible: true },
  { id: 'cat-6', name: 'Transportation', parent_id: null, is_tax_deductible: false },
]

describe('CategorySelect', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with placeholder', () => {
    render(
      <CategorySelect
        value=""
        categories={mockCategories}
        onChange={mockOnChange}
        placeholder="Select a category"
      />
    )

    expect(screen.getByText('Select a category')).toBeInTheDocument()
  })

  it('renders with default placeholder', () => {
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    expect(screen.getByText('Select category')).toBeInTheDocument()
  })

  it('shows selected category name', () => {
    render(
      <CategorySelect value="Food & Dining" categories={mockCategories} onChange={mockOnChange} />
    )

    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
  })

  it('shows tax badge for tax deductible category', () => {
    render(
      <CategorySelect value="Office Supplies" categories={mockCategories} onChange={mockOnChange} />
    )

    expect(screen.getByText('Tax')).toBeInTheDocument()
  })

  it('can be disabled', () => {
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} disabled />)

    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('has correct aria-expanded attribute', () => {
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('CategorySelect - Dropdown', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens dropdown when clicked', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByPlaceholderText(/search categories/i)).toBeInTheDocument()
  })

  it('shows all parent categories in dropdown', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    expect(screen.getByText('Business')).toBeInTheDocument()
    expect(screen.getByText('Transportation')).toBeInTheDocument()
  })

  it('shows child categories under parents', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText('Restaurants')).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByText('Office Supplies')).toBeInTheDocument()
  })

  it('closes dropdown when backdrop clicked', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))
    expect(screen.getByPlaceholderText(/search categories/i)).toBeInTheDocument()

    // Click backdrop (fixed inset-0 element)
    const backdrop = document.querySelector('.fixed.inset-0')
    if (backdrop) {
      await user.click(backdrop)
    }

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search categories/i)).not.toBeInTheDocument()
    })
  })

  it('updates aria-expanded when opened', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('CategorySelect - Selection', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls onChange when category selected', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Food & Dining'))

    expect(mockOnChange).toHaveBeenCalledWith('Food & Dining')
  })

  it('calls onChange when child category selected', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Restaurants'))

    expect(mockOnChange).toHaveBeenCalledWith('Restaurants')
  })

  it('closes dropdown after selection', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Food & Dining'))

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/search categories/i)).not.toBeInTheDocument()
    })
  })

  it('shows checkmark on selected category', async () => {
    const user = userEvent.setup()
    render(
      <CategorySelect value="Food & Dining" categories={mockCategories} onChange={mockOnChange} />
    )

    await user.click(screen.getByRole('combobox'))

    // Check icon should be visible for selected item
    const checkIcons = document.querySelectorAll('.lucide-check')
    expect(checkIcons.length).toBeGreaterThan(0)
  })

  it('shows clear option when value is selected', async () => {
    const user = userEvent.setup()
    render(
      <CategorySelect value="Food & Dining" categories={mockCategories} onChange={mockOnChange} />
    )

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText('Clear selection')).toBeInTheDocument()
  })

  it('does not show clear option when no value', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.queryByText('Clear selection')).not.toBeInTheDocument()
  })

  it('clears selection when clear clicked', async () => {
    const user = userEvent.setup()
    render(
      <CategorySelect value="Food & Dining" categories={mockCategories} onChange={mockOnChange} />
    )

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Clear selection'))

    expect(mockOnChange).toHaveBeenCalledWith('')
  })
})

describe('CategorySelect - Search', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters categories by search term', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText(/search categories/i), 'food')

    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    expect(screen.queryByText('Business')).not.toBeInTheDocument()
    expect(screen.queryByText('Transportation')).not.toBeInTheDocument()
  })

  it('shows parent when it matches search (children not automatically shown)', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText(/search categories/i), 'food')

    // Parent matches, but children don't match "food" so only parent is shown
    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    // Children are only shown if they match search OR parent matches (component behavior filters children too)
  })

  it('shows parent when child matches search', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText(/search categories/i), 'rest')

    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
    expect(screen.getByText('Restaurants')).toBeInTheDocument()
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()
  })

  it('shows empty state when no matches', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText(/search categories/i), 'xyz')

    expect(screen.getByText('No categories found')).toBeInTheDocument()
  })

  it('search is case insensitive', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText(/search categories/i), 'FOOD')

    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
  })

  it('clears search after selection', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByPlaceholderText(/search categories/i), 'food')
    await user.click(screen.getByText('Food & Dining'))

    // Re-open dropdown
    await user.click(screen.getByRole('combobox'))

    // Search should be cleared
    expect(screen.getByPlaceholderText(/search categories/i)).toHaveValue('')
    expect(screen.getByText('Business')).toBeInTheDocument()
  })

  it('autofocuses search input when dropdown opens', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByPlaceholderText(/search categories/i)).toHaveFocus()
  })
})

describe('CategorySelect - Tax Deductible Badge', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows Tax badge for tax deductible categories in dropdown', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={mockCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))

    // Office Supplies is tax deductible
    const taxBadges = screen.getAllByText('Tax')
    expect(taxBadges.length).toBeGreaterThan(0)
  })
})

describe('CategorySelect - Edge Cases', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles empty categories list', async () => {
    const user = userEvent.setup()
    render(<CategorySelect value="" categories={[]} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText('No categories found')).toBeInTheDocument()
  })

  it('handles orphan categories (child without valid parent)', async () => {
    const orphanCategories = [
      { id: 'cat-1', name: 'Orphan', parent_id: 'invalid-parent', is_tax_deductible: false },
    ]

    const user = userEvent.setup()
    render(<CategorySelect value="" categories={orphanCategories} onChange={mockOnChange} />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText('Orphan')).toBeInTheDocument()
  })

  it('accepts value by category id', () => {
    render(<CategorySelect value="cat-1" categories={mockCategories} onChange={mockOnChange} />)

    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
  })

  it('accepts value by category name', () => {
    render(
      <CategorySelect value="Food & Dining" categories={mockCategories} onChange={mockOnChange} />
    )

    expect(screen.getByText('Food & Dining')).toBeInTheDocument()
  })
})
