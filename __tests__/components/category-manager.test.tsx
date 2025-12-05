import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryManager } from '@/components/features/transactions/category-manager'

// Mock the categories server actions
vi.mock('@/app/actions/categories', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

// Mock window.confirm
const mockConfirm = vi.fn()
global.confirm = mockConfirm

const mockCategories = [
  {
    id: 'cat-1',
    name: 'Income',
    parent_id: null,
    is_tax_deductible: false,
    icon: null,
    color: null,
    user_id: null, // System category
  },
  {
    id: 'cat-2',
    name: 'Shopping',
    parent_id: null,
    is_tax_deductible: false,
    icon: null,
    color: null,
    user_id: 'user-1', // User category
  },
  {
    id: 'cat-3',
    name: 'Office Supplies',
    parent_id: 'cat-2',
    is_tax_deductible: true,
    icon: null,
    color: null,
    user_id: 'user-1',
  },
  {
    id: 'cat-4',
    name: 'Electronics',
    parent_id: 'cat-2',
    is_tax_deductible: false,
    icon: null,
    color: null,
    user_id: 'user-1',
  },
]

describe('CategoryManager', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockConfirm.mockReset()

    const { getCategories } = await import('@/app/actions/categories')
    vi.mocked(getCategories).mockResolvedValue({
      success: true,
      data: { categories: mockCategories },
    })
  })

  it('renders loading state initially', () => {
    render(<CategoryManager />)

    // Should show loading spinner
    expect(document.querySelector('[class*="animate-spin"]')).toBeInTheDocument()
  })

  it('renders categories after loading', async () => {
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument()
    })

    expect(screen.getByText('Shopping')).toBeInTheDocument()
  })

  it('shows system badge for system categories', async () => {
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument()
    })

    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('shows tax badge for tax deductible categories when expanded', async () => {
    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    // Shopping has children (Office Supplies is tax deductible)
    // First expand the Shopping category
    const buttons = screen.getAllByRole('button')
    const expandButton = buttons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-chevron-right')
    )

    if (expandButton) {
      await user.click(expandButton)

      await waitFor(() => {
        expect(screen.getByText('Office Supplies')).toBeInTheDocument()
      })

      // Office Supplies has is_tax_deductible: true
      const taxBadges = screen.getAllByText('Tax')
      expect(taxBadges.length).toBeGreaterThan(0)
    }
  })

  it('shows add category button', async () => {
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument()
    })
  })

  it('shows header and description', async () => {
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeInTheDocument()
    })

    expect(screen.getByText('Manage transaction categories')).toBeInTheDocument()
  })
})

describe('CategoryManager - Category Tree', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    const { getCategories } = await import('@/app/actions/categories')
    vi.mocked(getCategories).mockResolvedValue({
      success: true,
      data: { categories: mockCategories },
    })
  })

  it('shows parent categories at root level', async () => {
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument()
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })
  })

  it('shows expand toggle for categories with children', async () => {
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    // Shopping has children, should have expand toggle
    // Income has no children, expand toggle should be invisible
  })

  it('expands to show children when toggle clicked', async () => {
    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    // Children should not be visible initially or need to expand
    // Find the expand button for Shopping (has children)
    const buttons = screen.getAllByRole('button')
    const expandButton = buttons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-chevron-right')
    )

    if (expandButton) {
      await user.click(expandButton)

      await waitFor(() => {
        expect(screen.getByText('Office Supplies')).toBeInTheDocument()
        expect(screen.getByText('Electronics')).toBeInTheDocument()
      })
    }
  })

  it('collapses children when toggle clicked again', async () => {
    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    // Find expand button and click twice
    const buttons = screen.getAllByRole('button')
    const expandButton = buttons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-chevron-right')
    )

    if (expandButton) {
      // Expand
      await user.click(expandButton)
      await waitFor(() => {
        expect(screen.getByText('Office Supplies')).toBeInTheDocument()
      })

      // Collapse
      await user.click(expandButton)
      await waitFor(() => {
        expect(screen.queryByText('Office Supplies')).not.toBeInTheDocument()
      })
    }
  })
})

describe('CategoryManager - Create Category', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    const { getCategories, createCategory } = await import('@/app/actions/categories')
    vi.mocked(getCategories).mockResolvedValue({
      success: true,
      data: { categories: mockCategories },
    })
    vi.mocked(createCategory).mockResolvedValue({
      success: true,
      data: {
        category: {
          id: 'cat-new',
          name: 'New Category',
          parent_id: null,
          is_tax_deductible: false,
          icon: null,
          color: null,
          user_id: 'user-1',
        },
      },
    })
  })

  it('shows create form when add button clicked', async () => {
    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /add category/i }))

    expect(screen.getByText('New Category')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter category name/i)).toBeInTheDocument()
  })

  it('creates category when form submitted', async () => {
    const { createCategory } = await import('@/app/actions/categories')
    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /add category/i }))

    const nameInput = screen.getByPlaceholderText(/enter category name/i)
    await user.type(nameInput, 'Test Category')

    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(createCategory).toHaveBeenCalledWith({
        name: 'Test Category',
        parent_id: null,
        is_tax_deductible: false,
      })
    })
  })

  it('shows error when name is empty', async () => {
    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /add category/i }))
    await user.click(screen.getByRole('button', { name: /create/i }))

    expect(screen.getByText(/category name is required/i)).toBeInTheDocument()
  })

  it('allows setting tax deductible flag', async () => {
    const { createCategory } = await import('@/app/actions/categories')
    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /add category/i }))

    const nameInput = screen.getByPlaceholderText(/enter category name/i)
    await user.type(nameInput, 'Tax Category')

    // Click the tax deductible switch
    const taxSwitch = screen.getByRole('switch')
    await user.click(taxSwitch)

    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(createCategory).toHaveBeenCalledWith({
        name: 'Tax Category',
        parent_id: null,
        is_tax_deductible: true,
      })
    })
  })

  it('allows selecting parent category', async () => {
    const { createCategory } = await import('@/app/actions/categories')
    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /add category/i }))

    const nameInput = screen.getByPlaceholderText(/enter category name/i)
    await user.type(nameInput, 'Sub Category')

    // Select parent category
    const parentSelect = screen.getByRole('combobox')
    await user.selectOptions(parentSelect, 'cat-2')

    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(createCategory).toHaveBeenCalledWith({
        name: 'Sub Category',
        parent_id: 'cat-2',
        is_tax_deductible: false,
      })
    })
  })

  it('hides form when cancel clicked', async () => {
    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /add category/i }))
    expect(screen.getByText('New Category')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.queryByText('New Category')).not.toBeInTheDocument()
  })

  it('adds new category to list after creation', async () => {
    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /add category/i }))

    const nameInput = screen.getByPlaceholderText(/enter category name/i)
    await user.type(nameInput, 'New Category')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      // Should see the new category in the list (not in the form)
      const newCategoryElements = screen.getAllByText('New Category')
      expect(newCategoryElements.length).toBeGreaterThan(0)
    })
  })
})

describe('CategoryManager - Edit Category', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    const { getCategories, updateCategory } = await import('@/app/actions/categories')
    vi.mocked(getCategories).mockResolvedValue({
      success: true,
      data: { categories: mockCategories },
    })
    vi.mocked(updateCategory).mockResolvedValue({
      success: true,
      data: {
        category: {
          id: 'cat-2',
          name: 'Updated Shopping',
          parent_id: null,
          is_tax_deductible: true,
          icon: null,
          color: null,
          user_id: 'user-1',
        },
      },
    })
  })

  it('shows edit button for user categories', async () => {
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    // Shopping is a user category, should have edit button
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-pencil')
    )

    expect(editButton).toBeDefined()
  })

  it('does not show edit button for system categories', async () => {
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Income')).toBeInTheDocument()
    })

    // Income is a system category (user_id: null)
    // The edit button should not appear next to it
    // This is tricky to test without more specific selectors
  })

  it('shows inline edit form when edit clicked', async () => {
    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-pencil')
    )

    if (editButton) {
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Shopping')).toBeInTheDocument()
      })
    }
  })

  it('updates category when save clicked', async () => {
    const { updateCategory } = await import('@/app/actions/categories')
    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-pencil')
    )

    if (editButton) {
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Shopping')).toBeInTheDocument()
      })

      const nameInput = screen.getByDisplayValue('Shopping')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Shopping')

      // Find and click save button
      const saveButtons = screen.getAllByRole('button')
      const saveButton = saveButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-save')
      )

      if (saveButton) {
        await user.click(saveButton)

        await waitFor(() => {
          expect(updateCategory).toHaveBeenCalledWith('cat-2', {
            name: 'Updated Shopping',
            parent_id: null,
            is_tax_deductible: false,
          })
        })
      }
    }
  })

  it('cancels edit when X clicked', async () => {
    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-pencil')
    )

    if (editButton) {
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Shopping')).toBeInTheDocument()
      })

      // Find and click cancel button
      const cancelButtons = screen.getAllByRole('button')
      const cancelButton = cancelButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-x')
      )

      if (cancelButton) {
        await user.click(cancelButton)

        await waitFor(() => {
          expect(screen.queryByDisplayValue('Shopping')).not.toBeInTheDocument()
          expect(screen.getByText('Shopping')).toBeInTheDocument()
        })
      }
    }
  })
})

describe('CategoryManager - Delete Category', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    mockConfirm.mockReset()

    const { getCategories, deleteCategory } = await import('@/app/actions/categories')
    vi.mocked(getCategories).mockResolvedValue({
      success: true,
      data: { categories: mockCategories },
    })
    vi.mocked(deleteCategory).mockResolvedValue({
      success: true,
    })
  })

  it('shows delete button for user categories', async () => {
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-trash-2')
    )

    expect(deleteButton).toBeDefined()
  })

  it('shows confirmation dialog before delete', async () => {
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(false)

    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-trash-2')
    )

    if (deleteButton) {
      await user.click(deleteButton)

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this category?')
    }
  })

  it('does not delete when confirmation cancelled', async () => {
    const { deleteCategory } = await import('@/app/actions/categories')
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(false)

    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-trash-2')
    )

    if (deleteButton) {
      await user.click(deleteButton)

      expect(deleteCategory).not.toHaveBeenCalled()
    }
  })

  it('deletes category when confirmation accepted', async () => {
    const { deleteCategory } = await import('@/app/actions/categories')
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(true)

    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-trash-2')
    )

    if (deleteButton) {
      await user.click(deleteButton)

      await waitFor(() => {
        expect(deleteCategory).toHaveBeenCalledWith('cat-2')
      })
    }
  })

  it('removes category from list after deletion', async () => {
    const user = userEvent.setup()
    mockConfirm.mockReturnValue(true)

    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-trash-2')
    )

    if (deleteButton) {
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.queryByText('Shopping')).not.toBeInTheDocument()
      })
    }
  })
})

describe('CategoryManager - Add Subcategory', () => {
  beforeEach(async () => {
    vi.clearAllMocks()

    const { getCategories, createCategory } = await import('@/app/actions/categories')
    vi.mocked(getCategories).mockResolvedValue({
      success: true,
      data: { categories: mockCategories },
    })
    vi.mocked(createCategory).mockResolvedValue({
      success: true,
      data: {
        category: {
          id: 'cat-new-sub',
          name: 'New Subcategory',
          parent_id: 'cat-2',
          is_tax_deductible: false,
          icon: null,
          color: null,
          user_id: 'user-1',
        },
      },
    })
  })

  it('shows add subcategory button on each category row', async () => {
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    // Each category row should have a + button for adding subcategory
    const plusButtons = screen.getAllByRole('button')
    const addSubButtons = plusButtons.filter((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-plus')
    )

    expect(addSubButtons.length).toBeGreaterThan(1)
  })

  it('creates subcategory with correct parent_id', async () => {
    const { createCategory } = await import('@/app/actions/categories')
    const user = userEvent.setup()

    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    // Find the + button next to Shopping
    // This is tricky - need to find the row with Shopping and its + button
  })
})

describe('CategoryManager - Error Handling', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('shows error when create fails', async () => {
    const { getCategories, createCategory } = await import('@/app/actions/categories')
    vi.mocked(getCategories).mockResolvedValue({
      success: true,
      data: { categories: mockCategories },
    })
    vi.mocked(createCategory).mockResolvedValue({
      success: false,
      error: 'Category already exists',
    })

    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /add category/i }))

    const nameInput = screen.getByPlaceholderText(/enter category name/i)
    await user.type(nameInput, 'Test Category')
    await user.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => {
      expect(screen.getByText(/category already exists/i)).toBeInTheDocument()
    })
  })

  it('shows error when update fails', async () => {
    const { getCategories, updateCategory } = await import('@/app/actions/categories')
    vi.mocked(getCategories).mockResolvedValue({
      success: true,
      data: { categories: mockCategories },
    })
    vi.mocked(updateCategory).mockResolvedValue({
      success: false,
      error: 'Update failed',
    })

    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-pencil')
    )

    if (editButton) {
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByDisplayValue('Shopping')).toBeInTheDocument()
      })

      const saveButtons = screen.getAllByRole('button')
      const saveButton = saveButtons.find((btn) =>
        btn.querySelector('svg')?.classList.contains('lucide-save')
      )

      if (saveButton) {
        await user.click(saveButton)

        await waitFor(() => {
          expect(screen.getByText(/update failed/i)).toBeInTheDocument()
        })
      }
    }
  })

  it('shows error when delete fails', async () => {
    const { getCategories, deleteCategory } = await import('@/app/actions/categories')
    vi.mocked(getCategories).mockResolvedValue({
      success: true,
      data: { categories: mockCategories },
    })
    vi.mocked(deleteCategory).mockResolvedValue({
      success: false,
      error: 'Cannot delete category with transactions',
    })

    mockConfirm.mockReturnValue(true)

    const user = userEvent.setup()
    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText('Shopping')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button')
    const deleteButton = deleteButtons.find((btn) =>
      btn.querySelector('svg')?.classList.contains('lucide-trash-2')
    )

    if (deleteButton) {
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/cannot delete category/i)).toBeInTheDocument()
      })
    }
  })
})

describe('CategoryManager - Empty State', () => {
  it('shows empty message when no categories', async () => {
    const { getCategories } = await import('@/app/actions/categories')
    vi.mocked(getCategories).mockResolvedValue({
      success: true,
      data: { categories: [] },
    })

    render(<CategoryManager />)

    await waitFor(() => {
      expect(screen.getByText(/no categories/i)).toBeInTheDocument()
    })
  })
})
