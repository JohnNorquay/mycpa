'use client'

import { useState, useCallback } from 'react'
import { Loader2, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const CURRENT_YEAR = new Date().getFullYear()
const TAX_YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i)

const DEBT_TYPES = [
  { value: 'income_tax', label: 'Income Tax' },
  { value: 'penalty_failure_to_file', label: 'Failure to File Penalty' },
  { value: 'penalty_failure_to_pay', label: 'Failure to Pay Penalty' },
  { value: 'interest', label: 'Interest' },
  { value: 'other', label: 'Other' },
]

const SOURCES = [
  { value: 'w2_shortage', label: 'W-2 Withholding Shortage' },
  { value: '1099_unreported', label: '1099 Unreported Income' },
  { value: 'business', label: 'Business/Self-Employment' },
  { value: 'estimated_tax', label: 'Estimated Tax' },
  { value: 'other', label: 'Other' },
]

const COLLECTION_STATUSES = [
  { value: 'normal', label: 'Normal Collection' },
  { value: 'notice_sent', label: 'Notice Sent' },
  { value: 'lien_filed', label: 'Lien Filed' },
  { value: 'levy_pending', label: 'Levy Pending' },
  { value: 'levy_active', label: 'Levy Active' },
  { value: 'garnishment', label: 'Wage Garnishment' },
  { value: 'currently_not_collectible', label: 'Currently Not Collectible (CNC)' },
]

export type DebtType =
  | 'income_tax'
  | 'penalty_failure_to_file'
  | 'penalty_failure_to_pay'
  | 'interest'
  | 'other'
export type DebtSource = 'w2_shortage' | '1099_unreported' | 'business' | 'estimated_tax' | 'other'
export type CollectionStatus =
  | 'normal'
  | 'notice_sent'
  | 'lien_filed'
  | 'levy_pending'
  | 'levy_active'
  | 'garnishment'
  | 'currently_not_collectible'

export interface TaxDebtFormData {
  tax_year: number
  debt_type: DebtType | null
  original_amount: number
  current_balance: number
  interest_rate: number
  penalty_rate: number | null
  source: DebtSource | null
  collection_status: CollectionStatus
  statute_expiration_date: string | null
}

interface DebtFormProps {
  initialData?: Partial<TaxDebtFormData>
  onSubmit: (data: TaxDebtFormData) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
  className?: string
}

export function DebtForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  className,
}: DebtFormProps) {
  const [formData, setFormData] = useState<TaxDebtFormData>({
    tax_year: initialData?.tax_year || CURRENT_YEAR - 1,
    debt_type: initialData?.debt_type || 'income_tax',
    original_amount: initialData?.original_amount || 0,
    current_balance: initialData?.current_balance || 0,
    interest_rate: initialData?.interest_rate || 8.0, // Current IRS rate
    penalty_rate: initialData?.penalty_rate ?? null,
    source: initialData?.source || null,
    collection_status: initialData?.collection_status || 'normal',
    statute_expiration_date: initialData?.statute_expiration_date || null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = useCallback(
    (field: keyof TaxDebtFormData, value: string | number | null) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setError(null)
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      // Validation
      if (formData.original_amount <= 0) {
        setError('Original amount must be greater than 0')
        return
      }
      if (formData.current_balance < 0) {
        setError('Current balance cannot be negative')
        return
      }

      setIsSubmitting(true)
      try {
        await onSubmit(formData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save tax debt')
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, onSubmit]
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tax Year */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tax_year">Tax Year *</Label>
          <select
            id="tax_year"
            value={formData.tax_year}
            onChange={(e) => handleChange('tax_year', parseInt(e.target.value))}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
            required
          >
            {TAX_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="debt_type">Debt Type</Label>
          <select
            id="debt_type"
            value={formData.debt_type || ''}
            onChange={(e) => handleChange('debt_type', e.target.value || null)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
          >
            <option value="">Select type...</option>
            {DEBT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Amounts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="original_amount">Original Amount *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <Input
              id="original_amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.original_amount || ''}
              onChange={(e) => handleChange('original_amount', parseFloat(e.target.value) || 0)}
              className="pl-7"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_balance">Current Balance *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <Input
              id="current_balance"
              type="number"
              min="0"
              step="0.01"
              value={formData.current_balance || ''}
              onChange={(e) => handleChange('current_balance', parseFloat(e.target.value) || 0)}
              className="pl-7"
              required
            />
          </div>
          {formData.current_balance > formData.original_amount && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Balance exceeds original (interest/penalties accrued)
            </p>
          )}
        </div>
      </div>

      {/* Rates */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="interest_rate">Interest Rate (%)</Label>
          <Input
            id="interest_rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.interest_rate || ''}
            onChange={(e) => handleChange('interest_rate', parseFloat(e.target.value) || 0)}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Current IRS rate: ~8% (varies quarterly)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="penalty_rate">Penalty Rate (%)</Label>
          <Input
            id="penalty_rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.penalty_rate || ''}
            onChange={(e) =>
              handleChange('penalty_rate', e.target.value ? parseFloat(e.target.value) : null)
            }
          />
        </div>
      </div>

      {/* Source and Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="source">Source of Debt</Label>
          <select
            id="source"
            value={formData.source || ''}
            onChange={(e) => handleChange('source', e.target.value || null)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
          >
            <option value="">Select source...</option>
            {SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="collection_status">Collection Status</Label>
          <select
            id="collection_status"
            value={formData.collection_status}
            onChange={(e) => handleChange('collection_status', e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
          >
            {COLLECTION_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statute Expiration */}
      <div className="space-y-2">
        <Label htmlFor="statute_expiration_date">Collection Statute Expiration Date (CSED)</Label>
        <Input
          id="statute_expiration_date"
          type="date"
          value={formData.statute_expiration_date || ''}
          onChange={(e) => handleChange('statute_expiration_date', e.target.value || null)}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          IRS has 10 years from assessment to collect. After CSED, debt may become uncollectible.
        </p>
      </div>

      {/* Summary */}
      {formData.original_amount > 0 && (
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <h4 className="text-sm font-medium dark:text-white">Summary</h4>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Tax Year:</span>
              <span className="font-medium dark:text-white">{formData.tax_year}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Original Amount:</span>
              <span className="font-medium dark:text-white">
                {formatCurrency(formData.original_amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Current Balance:</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatCurrency(formData.current_balance)}
              </span>
            </div>
            {formData.current_balance > formData.original_amount && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Interest/Penalties:</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  +{formatCurrency(formData.current_balance - formData.original_amount)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
