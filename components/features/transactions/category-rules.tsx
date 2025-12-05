'use client'

import { useState, useCallback, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Save, Loader2, Sparkles, ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  getCategoryRules,
  createCategoryRule,
  updateCategoryRule,
  deleteCategoryRule,
  applyCategorizationRules,
  getCategories,
} from '@/app/actions/categories'

interface CategoryRule {
  id: string
  category_name: string
  merchant_pattern: string
  match_type: string
  priority: number
  is_active: boolean
}

interface Category {
  id: string
  name: string
}

interface RuleFormData {
  category_name: string
  merchant_pattern: string
  match_type: 'contains' | 'starts_with' | 'ends_with' | 'exact'
  priority: number
  is_active: boolean
}

const MATCH_TYPE_LABELS = {
  contains: 'Contains',
  starts_with: 'Starts with',
  ends_with: 'Ends with',
  exact: 'Exact match',
}

export function CategoryRules() {
  const [rules, setRules] = useState<CategoryRule[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<RuleFormData>({
    category_name: '',
    merchant_pattern: '',
    match_type: 'contains',
    priority: 0,
    is_active: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applyResult, setApplyResult] = useState<string | null>(null)

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const [rulesResult, categoriesResult] = await Promise.all([
        getCategoryRules(),
        getCategories(),
      ])

      if (rulesResult.success && rulesResult.data) {
        setRules(rulesResult.data.rules)
      }
      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data.categories)
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const startEditing = useCallback((rule: CategoryRule) => {
    setEditingId(rule.id)
    setFormData({
      category_name: rule.category_name,
      merchant_pattern: rule.merchant_pattern,
      match_type: rule.match_type as RuleFormData['match_type'],
      priority: rule.priority,
      is_active: rule.is_active,
    })
    setError(null)
    setIsCreating(false)
  }, [])

  const startCreating = useCallback(() => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({
      category_name: categories[0]?.name || '',
      merchant_pattern: '',
      match_type: 'contains',
      priority: rules.length,
      is_active: true,
    })
    setError(null)
  }, [categories, rules.length])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setIsCreating(false)
    setFormData({
      category_name: '',
      merchant_pattern: '',
      match_type: 'contains',
      priority: 0,
      is_active: true,
    })
    setError(null)
  }, [])

  const handleSave = useCallback(async () => {
    if (!formData.category_name || !formData.merchant_pattern.trim()) {
      setError('Category and merchant pattern are required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (isCreating) {
        const result = await createCategoryRule(formData)
        if (result.success) {
          setRules((prev) => [...prev, result.data.rule])
          cancelEdit()
        } else {
          setError(result.error ?? 'Failed to create rule')
        }
      } else if (editingId) {
        const result = await updateCategoryRule(editingId, formData)
        if (result.success) {
          setRules((prev) => prev.map((r) => (r.id === editingId ? result.data.rule : r)))
          cancelEdit()
        } else {
          setError(result.error ?? 'Failed to update rule')
        }
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsSaving(false)
    }
  }, [formData, isCreating, editingId, cancelEdit])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    setIsSaving(true)
    const result = await deleteCategoryRule(id)

    if (result.success) {
      setRules((prev) => prev.filter((r) => r.id !== id))
    } else {
      setError(result.error ?? 'Failed to delete rule')
    }
    setIsSaving(false)
  }, [])

  const handleToggleActive = useCallback(async (rule: CategoryRule) => {
    const result = await updateCategoryRule(rule.id, { is_active: !rule.is_active })
    if (result.success && result.data) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? result.data.rule : r)))
    }
  }, [])

  const handleApplyRules = useCallback(async () => {
    setIsApplying(true)
    setApplyResult(null)
    setError(null)

    const result = await applyCategorizationRules()

    if (result.success) {
      setApplyResult(`Applied rules to ${result.data.updated} transactions`)
    } else {
      setError(result.error ?? 'Failed to apply rules')
    }

    setIsApplying(false)
  }, [])

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
          <h3 className="text-lg font-semibold dark:text-white">Category Rules</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Automatically categorize transactions based on merchant names
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleApplyRules}
            disabled={isApplying}
            className="gap-2"
          >
            {isApplying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Apply Rules
          </Button>
          <Button onClick={startCreating} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {applyResult && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
          {applyResult}
        </div>
      )}

      {/* New rule form */}
      {isCreating && (
        <div className="rounded-lg border p-4 dark:border-gray-800">
          <h4 className="mb-3 text-sm font-medium dark:text-white">New Rule</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">If merchant name</Label>
              <select
                value={formData.match_type}
                onChange={(e) =>
                  setFormData((f) => ({
                    ...f,
                    match_type: e.target.value as RuleFormData['match_type'],
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
              >
                {Object.entries(MATCH_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Pattern</Label>
              <Input
                value={formData.merchant_pattern}
                onChange={(e) => setFormData((f) => ({ ...f, merchant_pattern: e.target.value }))}
                placeholder="e.g., Amazon, Starbucks"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Then set category to</Label>
              <select
                value={formData.category_name}
                onChange={(e) => setFormData((f) => ({ ...f, category_name: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Priority (higher = checked first)</Label>
              <Input
                type="number"
                min="0"
                value={formData.priority}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, priority: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(v) => setFormData((f) => ({ ...f, is_active: v }))}
              />
              <Label className="text-xs">Active</Label>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={cancelEdit} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Rule
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rules list */}
      <div className="space-y-2">
        {rules.length === 0 ? (
          <div className="rounded-lg border p-8 text-center dark:border-gray-800">
            <Sparkles className="mx-auto h-8 w-8 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium dark:text-white">No rules yet</h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create rules to automatically categorize your transactions
            </p>
          </div>
        ) : (
          rules.map((rule) =>
            editingId === rule.id ? (
              // Edit form
              <div
                key={rule.id}
                className="rounded-lg border bg-blue-50 p-4 dark:border-gray-800 dark:bg-blue-900/20"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Match Type</Label>
                    <select
                      value={formData.match_type}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          match_type: e.target.value as RuleFormData['match_type'],
                        }))
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
                    >
                      {Object.entries(MATCH_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Pattern</Label>
                    <Input
                      value={formData.merchant_pattern}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, merchant_pattern: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Category</Label>
                    <select
                      value={formData.category_name}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, category_name: e.target.value }))
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Priority</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, priority: parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-end gap-2">
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
              </div>
            ) : (
              // Display row
              <div
                key={rule.id}
                className={cn(
                  'flex items-center gap-4 rounded-lg border p-4 dark:border-gray-800',
                  !rule.is_active && 'opacity-50'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      If merchant{' '}
                      {MATCH_TYPE_LABELS[
                        rule.match_type as keyof typeof MATCH_TYPE_LABELS
                      ].toLowerCase()}
                    </span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      &quot;{rule.merchant_pattern}&quot;
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-sm font-medium dark:bg-gray-800">
                      {rule.category_name}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Priority: {rule.priority}
                  </p>
                </div>
                <Switch checked={rule.is_active} onCheckedChange={() => handleToggleActive(rule)} />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEditing(rule)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(rule.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          )
        )}
      </div>
    </div>
  )
}
