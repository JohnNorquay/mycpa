'use client'

import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import { X, Tag, Receipt, Calendar, Building2, Save, Loader2, Split } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  date: string
  amount: number
  merchant_name: string | null
  category: string | null
  is_tax_deductible: boolean
  is_recurring: boolean
  notes: string | null
  account?: {
    name: string
    type: string | null
  } | null
}

interface Category {
  id: string
  name: string
  is_tax_deductible: boolean
}

interface TransactionDetailProps {
  transaction: Transaction
  categories?: Category[]
  onClose: () => void
  onSave: (updates: Partial<Transaction>) => Promise<void>
  onSplit?: (transaction: Transaction) => void
  className?: string
}

export function TransactionDetail({
  transaction,
  categories = [],
  onClose,
  onSave,
  onSplit,
  className,
}: TransactionDetailProps) {
  const [category, setCategory] = useState(transaction.category || '')
  const [notes, setNotes] = useState(transaction.notes || '')
  const [isTaxDeductible, setIsTaxDeductible] = useState(transaction.is_tax_deductible)
  const [isRecurring, setIsRecurring] = useState(transaction.is_recurring)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const isIncome = transaction.amount > 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount))
  }

  const handleCategoryChange = useCallback(
    (value: string) => {
      setCategory(value)
      setHasChanges(true)

      // Auto-set tax deductible based on category
      const selectedCategory = categories.find((c) => c.name === value)
      if (selectedCategory) {
        setIsTaxDeductible(selectedCategory.is_tax_deductible)
      }
    },
    [categories]
  )

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value)
    setHasChanges(true)
  }, [])

  const handleTaxDeductibleChange = useCallback((value: boolean) => {
    setIsTaxDeductible(value)
    setHasChanges(true)
  }, [])

  const handleRecurringChange = useCallback((value: boolean) => {
    setIsRecurring(value)
    setHasChanges(true)
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        category: category || null,
        notes: notes || null,
        is_tax_deductible: isTaxDeductible,
        is_recurring: isRecurring,
      })
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to save transaction:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-950',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
        <h2 className="text-lg font-semibold dark:text-white">Transaction Details</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        {/* Transaction Summary */}
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold dark:text-white">
                {transaction.merchant_name || 'Unknown Merchant'}
              </p>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                {format(new Date(transaction.date), 'EEEE, MMMM d, yyyy')}
              </div>
              {transaction.account?.name && (
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Building2 className="h-4 w-4" />
                  {transaction.account.name}
                </div>
              )}
            </div>
            <div className="text-right">
              <p
                className={cn(
                  'text-2xl font-bold',
                  isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}
              >
                {isIncome ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {isIncome ? 'Income' : 'Expense'}
              </p>
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Tag className="h-4 w-4" />
            Category
          </Label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-gray-800"
          >
            <option value="">Uncategorized</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
                {cat.is_tax_deductible ? ' (Tax Deductible)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Receipt className="h-4 w-4" />
            Notes
          </Label>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add notes about this transaction..."
            rows={3}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-gray-800"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Tax Deductible</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mark this transaction as tax deductible
              </p>
            </div>
            <Switch checked={isTaxDeductible} onCheckedChange={handleTaxDeductibleChange} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Recurring</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                This is a recurring transaction
              </p>
            </div>
            <Switch checked={isRecurring} onCheckedChange={handleRecurringChange} />
          </div>
        </div>

        {/* Current Badges */}
        <div className="flex flex-wrap gap-2">
          {isTaxDeductible && (
            <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Tax Deductible
            </span>
          )}
          {isRecurring && (
            <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              Recurring
            </span>
          )}
          {category && (
            <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-400">
              {category}
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t p-4 dark:border-gray-800">
        <div>
          {onSplit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSplit(transaction)}
              className="gap-2"
            >
              <Split className="h-4 w-4" />
              Split Transaction
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
