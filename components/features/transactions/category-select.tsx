'use client'

import { useState, useCallback, useMemo } from 'react'
import { Check, ChevronDown, Search, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  parent_id?: string | null
  is_tax_deductible: boolean
}

interface CategorySelectProps {
  value: string
  categories: Category[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function CategorySelect({
  value,
  categories,
  onChange,
  placeholder = 'Select category',
  className,
  disabled = false,
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Build category tree for hierarchical display
  const categoryTree = useMemo(() => {
    const parentCategories = categories.filter((c) => !c.parent_id)
    const childCategories = categories.filter((c) => c.parent_id)

    const tree: Array<{
      category: Category
      children: Category[]
    }> = parentCategories.map((parent) => ({
      category: parent,
      children: childCategories.filter((c) => c.parent_id === parent.id),
    }))

    // Add orphan categories (children without valid parent)
    const orphanChildrenParentIds = new Set(childCategories.map((c) => c.parent_id))
    const validParentIds = new Set(parentCategories.map((c) => c.id))
    childCategories.forEach((child) => {
      if (child.parent_id && !validParentIds.has(child.parent_id)) {
        tree.push({ category: child, children: [] })
      }
    })

    return tree
  }, [categories])

  // Filter categories based on search
  const filteredTree = useMemo(() => {
    if (!search) return categoryTree

    const searchLower = search.toLowerCase()
    return categoryTree
      .map((item) => ({
        category: item.category,
        children: item.children.filter((c) => c.name.toLowerCase().includes(searchLower)),
      }))
      .filter(
        (item) => item.category.name.toLowerCase().includes(searchLower) || item.children.length > 0
      )
  }, [categoryTree, search])

  // Get selected category name
  const selectedCategory = categories.find((c) => c.name === value || c.id === value)

  const handleSelect = useCallback(
    (category: Category) => {
      onChange(category.name)
      setIsOpen(false)
      setSearch('')
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    onChange('')
    setIsOpen(false)
    setSearch('')
  }, [onChange])

  return (
    <div className={cn('relative', className)}>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full justify-between font-normal',
          !selectedCategory && 'text-muted-foreground'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedCategory ? (
            <>
              {selectedCategory.name}
              {selectedCategory.is_tax_deductible && (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Tax
                </span>
              )}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[200px] rounded-md border bg-white shadow-lg dark:border-gray-800 dark:bg-gray-950">
            {/* Search */}
            <div className="border-b p-2 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                  autoFocus
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-[300px] overflow-y-auto p-1">
              {/* Clear Option */}
              {value && (
                <button
                  onClick={handleClear}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="text-gray-500">Clear selection</span>
                </button>
              )}

              {filteredTree.length === 0 ? (
                <p className="p-2 text-center text-sm text-gray-500">No categories found</p>
              ) : (
                filteredTree.map((item) => (
                  <div key={item.category.id}>
                    {/* Parent Category */}
                    <button
                      onClick={() => handleSelect(item.category)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800',
                        (value === item.category.name || value === item.category.id) &&
                          'bg-gray-100 dark:bg-gray-800'
                      )}
                    >
                      <Tag className="h-4 w-4 text-gray-400" />
                      <span className="flex-1">{item.category.name}</span>
                      {item.category.is_tax_deductible && (
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Tax
                        </span>
                      )}
                      {(value === item.category.name || value === item.category.id) && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </button>

                    {/* Child Categories */}
                    {item.children.length > 0 && (
                      <div className="ml-4">
                        {item.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => handleSelect(child)}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800',
                              (value === child.name || value === child.id) &&
                                'bg-gray-100 dark:bg-gray-800'
                            )}
                          >
                            <span className="h-4 w-4 border-l border-b border-gray-300 dark:border-gray-700" />
                            <span className="flex-1">{child.name}</span>
                            {child.is_tax_deductible && (
                              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                Tax
                              </span>
                            )}
                            {(value === child.name || value === child.id) && (
                              <Check className="h-4 w-4 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
