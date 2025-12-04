'use client'

import { useState, useCallback, useEffect } from 'react'
import { X, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  date: string
  amount: number
  merchant_name: string | null
  category: string | null
}

interface Category {
  id: string
  name: string
  is_tax_deductible: boolean
}

interface SplitItem {
  id: string
  amount: number
  category: string
  description: string
}

interface SplitTransactionModalProps {
  transaction: Transaction
  categories?: Category[]
  isOpen: boolean
  onClose: () => void
  onSave: (splits: SplitItem[]) => Promise<void>
}

function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export function SplitTransactionModal({
  transaction,
  categories = [],
  isOpen,
  onClose,
  onSave,
}: SplitTransactionModalProps) {
  const [splits, setSplits] = useState<SplitItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const originalAmount = Math.abs(transaction.amount)
  const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0)
  const remaining = originalAmount - totalSplit
  const isValid = Math.abs(remaining) < 0.01 && splits.length >= 2

  // Initialize with two default splits
  useEffect(() => {
    if (isOpen && splits.length === 0) {
      setSplits([
        {
          id: generateId(),
          amount: originalAmount / 2,
          category: transaction.category || '',
          description: '',
        },
        {
          id: generateId(),
          amount: originalAmount / 2,
          category: '',
          description: '',
        },
      ])
    }
  }, [isOpen, originalAmount, transaction.category, splits.length])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleAddSplit = useCallback(() => {
    setSplits((prev) => [
      ...prev,
      {
        id: generateId(),
        amount: remaining > 0 ? remaining : 0,
        category: '',
        description: '',
      },
    ])
    setError(null)
  }, [remaining])

  const handleRemoveSplit = useCallback((id: string) => {
    setSplits((prev) => prev.filter((s) => s.id !== id))
    setError(null)
  }, [])

  const handleUpdateSplit = useCallback(
    (id: string, field: keyof SplitItem, value: string | number) => {
      setSplits((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                [field]: field === 'amount' ? parseFloat(value as string) || 0 : value,
              }
            : s
        )
      )
      setError(null)
    },
    []
  )

  const handleDistributeEvenly = useCallback(() => {
    const evenAmount = originalAmount / splits.length
    setSplits((prev) => prev.map((s) => ({ ...s, amount: Math.round(evenAmount * 100) / 100 })))
    setError(null)
  }, [originalAmount, splits.length])

  const handleSave = async () => {
    if (!isValid) {
      setError('The sum of splits must equal the original amount')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSave(splits)
      onClose()
    } catch (err) {
      setError('Failed to save splits. Please try again.')
      console.error('Error saving splits:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = useCallback(() => {
    setSplits([])
    setError(null)
    onClose()
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-lg rounded-lg bg-white shadow-xl dark:bg-gray-950">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold dark:text-white">Split Transaction</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {transaction.merchant_name || 'Unknown Merchant'} - {formatCurrency(originalAmount)}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4">
          {/* Split Items */}
          {splits.map((split, index) => (
            <div key={split.id} className="rounded-lg border p-4 dark:border-gray-800">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Split {index + 1}
                </span>
                {splits.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveSplit(split.id)}
                    className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      $
                    </span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={split.amount || ''}
                      onChange={(e) => handleUpdateSplit(split.id, 'amount', e.target.value)}
                      className="pl-7"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Category</Label>
                  <select
                    value={split.category}
                    onChange={(e) => handleUpdateSplit(split.id, 'category', e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-gray-800"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <Label className="text-xs">Description (optional)</Label>
                <Input
                  type="text"
                  value={split.description}
                  onChange={(e) => handleUpdateSplit(split.id, 'description', e.target.value)}
                  placeholder="What was this part for?"
                />
              </div>
            </div>
          ))}

          {/* Add Split Button */}
          <Button variant="outline" onClick={handleAddSplit} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Another Split
          </Button>
        </div>

        {/* Summary */}
        <div className="border-t p-4 dark:border-gray-800">
          <div className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Original Amount</span>
              <span className="font-medium dark:text-white">{formatCurrency(originalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Split Total</span>
              <span className="font-medium dark:text-white">{formatCurrency(totalSplit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Remaining</span>
              <span
                className={cn(
                  'font-medium',
                  Math.abs(remaining) < 0.01
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>

          {/* Distribute Evenly Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDistributeEvenly}
            className="mb-4 w-full text-xs"
          >
            Distribute Evenly
          </Button>

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isValid || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Splits'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
