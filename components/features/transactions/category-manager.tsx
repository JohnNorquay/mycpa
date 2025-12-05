'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Tag,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
} from '@/app/actions/categories'

interface CategoryFormData {
  name: string
  parent_category: string | null
  is_tax_deductible: boolean
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    parent_category: null,
    is_tax_deductible: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch categories on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const result = await getCategories()
      if (result.success && result.data) {
        setCategories(result.data.categories)
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  // Build category tree
  const categoryTree = categories.reduce(
    (acc, cat) => {
      if (!cat.parent_category) {
        acc.parents.push(cat)
      } else {
        if (!acc.children[cat.parent_category]) {
          acc.children[cat.parent_category] = []
        }
        acc.children[cat.parent_category]?.push(cat)
      }
      return acc
    },
    { parents: [] as Category[], children: {} as Record<string, Category[]> }
  )

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const startEditing = useCallback((category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      parent_category: category.parent_category,
      is_tax_deductible: category.is_tax_deductible,
    })
    setError(null)
    setIsCreating(false)
  }, [])

  const startCreating = useCallback((parentId: string | null = null) => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({
      name: '',
      parent_category: parentId,
      is_tax_deductible: false,
    })
    setError(null)
  }, [])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setIsCreating(false)
    setFormData({ name: '', parent_category: null, is_tax_deductible: false })
    setError(null)
  }, [])

  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      setError('Category name is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (isCreating) {
        const result = await createCategory(formData)
        if (result.success) {
          setCategories((prev) => [...prev, result.data.category])
          cancelEdit()
        } else {
          setError(result.error ?? 'Failed to create category')
        }
      } else if (editingId) {
        const result = await updateCategory(editingId, formData)
        if (result.success) {
          setCategories((prev) => prev.map((c) => (c.id === editingId ? result.data.category : c)))
          cancelEdit()
        } else {
          setError(result.error ?? 'Failed to update category')
        }
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }, [formData, isCreating, editingId, cancelEdit])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    setIsSaving(true)
    const result = await deleteCategory(id)

    if (result.success) {
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } else {
      setError(result.error || 'Failed to delete category')
    }
    setIsSaving(false)
  }, [])

  const renderCategoryRow = (category: Category, level: number = 0) => {
    const children = categoryTree.children[category.id] || []
    const hasChildren = children.length > 0
    const isExpanded = expandedIds.has(category.id)
    const isEditing = editingId === category.id
    const isSystemCategory = category.user_id === null

    return (
      <div key={category.id}>
        <div
          className={cn(
            'flex items-center gap-2 rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-800',
            isEditing && 'bg-blue-50 dark:bg-blue-900/20'
          )}
          style={{ paddingLeft: `${level * 24 + 8}px` }}
        >
          {/* Expand toggle */}
          <button
            onClick={() => toggleExpand(category.id)}
            className={cn('h-6 w-6 p-1', !hasChildren && 'invisible')}
          >
            {hasChildren &&
              (isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              ))}
          </button>

          {isEditing ? (
            // Edit form inline
            <div className="flex flex-1 items-center gap-2">
              <Input
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="Category name"
                className="h-8 flex-1"
                autoFocus
              />
              <div className="flex items-center gap-1">
                <Switch
                  checked={formData.is_tax_deductible}
                  onCheckedChange={(v) => setFormData((f) => ({ ...f, is_tax_deductible: v }))}
                />
                <span className="text-xs text-gray-500">Tax</span>
              </div>
              <Button size="sm" variant="ghost" onClick={cancelEdit} disabled={isSaving}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            // Display row
            <>
              <Tag className="h-4 w-4 text-gray-400" />
              <span className="flex-1 text-sm dark:text-white">{category.name}</span>
              {category.is_tax_deductible && (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Tax
                </span>
              )}
              {isSystemCategory && (
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  System
                </span>
              )}
              {!isSystemCategory && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(category)}
                    className="h-7 w-7 p-0"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(category.id)}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => startCreating(category.id)}
                className="h-7 w-7 p-0"
                title="Add subcategory"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>{children.map((child) => renderCategoryRow(child, level + 1))}</div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">Categories</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage transaction categories</p>
        </div>
        <Button onClick={() => startCreating(null)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* New category form */}
      {isCreating && (
        <div className="rounded-lg border p-4 dark:border-gray-800">
          <h4 className="mb-3 text-sm font-medium dark:text-white">
            New {formData.parent_category ? 'Subcategory' : 'Category'}
          </h4>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-xs">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="Enter category name"
                autoFocus
              />
            </div>
            {!formData.parent_category && (
              <div className="space-y-2">
                <Label className="text-xs">Parent Category (optional)</Label>
                <select
                  value={formData.parent_category || ''}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, parent_category: e.target.value || null }))
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
                >
                  <option value="">None (Top Level)</option>
                  {categoryTree.parents.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_tax_deductible}
                onCheckedChange={(v) => setFormData((f) => ({ ...f, is_tax_deductible: v }))}
              />
              <Label className="text-xs">Tax Deductible</Label>
            </div>
            <Button variant="ghost" onClick={cancelEdit} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </div>
        </div>
      )}

      {/* Category list */}
      <div className="rounded-lg border dark:border-gray-800">
        {categoryTree.parents.length === 0 ? (
          <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No categories yet. Create your first category above.
          </p>
        ) : (
          categoryTree.parents.map((cat) => renderCategoryRow(cat))
        )}
      </div>
    </div>
  )
}
