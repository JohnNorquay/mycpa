'use client'

import { useState, useCallback } from 'react'
import { Loader2, Save, AlertCircle, Mail, Calendar, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const NOTICE_TYPES = [
  { value: 'cp14', label: 'CP14 - Balance Due Notice' },
  { value: 'cp501', label: 'CP501 - Reminder Notice' },
  { value: 'cp503', label: 'CP503 - Second Reminder' },
  { value: 'cp504', label: 'CP504 - Final Notice of Intent to Levy' },
  { value: 'cp523', label: 'CP523 - Default on Installment Agreement' },
  { value: 'lien_notice', label: 'Notice of Federal Tax Lien' },
  { value: 'levy_notice', label: 'Notice of Intent to Levy' },
  { value: 'wage_levy', label: 'Wage Levy/Garnishment Notice' },
  { value: 'audit', label: 'Audit/Examination Notice' },
  { value: 'cp2000', label: 'CP2000 - Underreported Income' },
  { value: 'letter_668a', label: 'Letter 668-A - Notice of Levy' },
  { value: 'letter_1058', label: 'Letter 1058 - Final Notice' },
  { value: 'other', label: 'Other Notice' },
]

const STATUS_OPTIONS = [
  { value: 'received', label: 'Received' },
  { value: 'in_review', label: 'In Review' },
  { value: 'response_sent', label: 'Response Sent' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'escalated', label: 'Escalated' },
]

type CorrespondenceStatus = 'received' | 'in_review' | 'response_sent' | 'resolved' | 'escalated'

interface CorrespondenceFormData {
  notice_date: string
  notice_type: string
  notice_number: string | null
  response_deadline: string | null
  status: CorrespondenceStatus
  tax_debt_id: string | null
  notes: string | null
}

interface TaxDebt {
  id: string
  tax_year: number
  debt_type: string | null
  current_balance: number
}

interface CorrespondenceFormProps {
  initialData?: Partial<CorrespondenceFormData>
  taxDebts?: TaxDebt[]
  onSubmit: (data: CorrespondenceFormData) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
  className?: string
}

export function CorrespondenceForm({
  initialData,
  taxDebts = [],
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  className,
}: CorrespondenceFormProps) {
  const today = new Date().toISOString().split('T')[0] ?? ''

  const [formData, setFormData] = useState<CorrespondenceFormData>({
    notice_date: initialData?.notice_date || today,
    notice_type: initialData?.notice_type || '',
    notice_number: initialData?.notice_number || null,
    response_deadline: initialData?.response_deadline || null,
    status: initialData?.status || 'received',
    tax_debt_id: initialData?.tax_debt_id || null,
    notes: initialData?.notes || null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = useCallback((field: keyof CorrespondenceFormData, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      // Validation
      if (!formData.notice_type) {
        setError('Please select a notice type')
        return
      }
      if (!formData.notice_date) {
        setError('Please enter the notice date')
        return
      }

      setIsSubmitting(true)
      try {
        await onSubmit(formData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save correspondence')
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, onSubmit]
  )

  const isDeadlineOverdue =
    formData.response_deadline && new Date(formData.response_deadline) < new Date()
  const isDeadlineSoon =
    formData.response_deadline &&
    !isDeadlineOverdue &&
    new Date(formData.response_deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
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

      {/* Notice Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2 dark:border-gray-800">
          <Mail className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold dark:text-white">Notice Information</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="notice_type">Notice Type *</Label>
            <select
              id="notice_type"
              value={formData.notice_type}
              onChange={(e) => handleChange('notice_type', e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
              required
            >
              <option value="">Select notice type...</option>
              {NOTICE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notice_number">Notice/Letter Number</Label>
            <Input
              id="notice_number"
              value={formData.notice_number || ''}
              onChange={(e) => handleChange('notice_number', e.target.value || null)}
              placeholder="e.g., CP14, Letter 1058"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Found in the upper right corner of the notice
            </p>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2 dark:border-gray-800">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold dark:text-white">Dates</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="notice_date">Notice Date *</Label>
            <Input
              id="notice_date"
              type="date"
              value={formData.notice_date}
              onChange={(e) => handleChange('notice_date', e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Date printed on the notice</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response_deadline">Response Deadline</Label>
            <Input
              id="response_deadline"
              type="date"
              value={formData.response_deadline || ''}
              onChange={(e) => handleChange('response_deadline', e.target.value || null)}
            />
            {isDeadlineOverdue && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                Deadline has passed! Respond immediately.
              </p>
            )}
            {isDeadlineSoon && !isDeadlineOverdue && (
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Deadline approaching within 7 days!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status & Association */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2 dark:border-gray-800">
          <FileText className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold dark:text-white">Status & Association</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as CorrespondenceStatus)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {taxDebts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="tax_debt_id">Related Tax Debt</Label>
              <select
                id="tax_debt_id"
                value={formData.tax_debt_id || ''}
                onChange={(e) => handleChange('tax_debt_id', e.target.value || null)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
              >
                <option value="">Not linked to specific debt</option>
                {taxDebts.map((debt) => (
                  <option key={debt.id} value={debt.id}>
                    {debt.tax_year} - {debt.debt_type || 'Tax Debt'} (
                    {formatCurrency(debt.current_balance)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value || null)}
          placeholder="Add any relevant notes or details about this correspondence..."
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:border-gray-800"
        />
      </div>

      {/* Summary */}
      {formData.notice_type && (
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
          <h4 className="text-sm font-medium dark:text-white">Summary</h4>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Notice Type:</span>
              <span className="font-medium dark:text-white">
                {NOTICE_TYPES.find((t) => t.value === formData.notice_type)?.label ||
                  formData.notice_type}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Notice Date:</span>
              <span className="font-medium dark:text-white">
                {formData.notice_date
                  ? new Date(formData.notice_date).toLocaleDateString()
                  : 'Not set'}
              </span>
            </div>
            {formData.response_deadline && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Response Due:</span>
                <span
                  className={cn(
                    'font-medium',
                    isDeadlineOverdue
                      ? 'text-red-600 dark:text-red-400'
                      : isDeadlineSoon
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'dark:text-white'
                  )}
                >
                  {new Date(formData.response_deadline).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Status:</span>
              <span
                className={cn(
                  'font-medium',
                  formData.status === 'resolved'
                    ? 'text-green-600 dark:text-green-400'
                    : formData.status === 'escalated'
                      ? 'text-red-600 dark:text-red-400'
                      : 'dark:text-white'
                )}
              >
                {STATUS_OPTIONS.find((s) => s.value === formData.status)?.label}
              </span>
            </div>
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
