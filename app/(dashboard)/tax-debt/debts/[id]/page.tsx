'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Trash2,
  DollarSign,
  Calendar,
  Plus,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DebtForm, type TaxDebtFormData } from '@/components/features/tax-debt'
import { cn } from '@/lib/utils'
import {
  getTaxDebt,
  updateTaxDebt,
  deleteTaxDebt,
  getPaymentsForDebt,
  recordPayment,
  type TaxDebt,
  type TaxDebtPayment,
} from '@/app/actions/tax-debt'

const DEBT_TYPE_LABELS: Record<string, string> = {
  income_tax: 'Income Tax',
  penalty_failure_to_file: 'Failure to File Penalty',
  penalty_failure_to_pay: 'Failure to Pay Penalty',
  interest: 'Interest',
  other: 'Other',
}

const COLLECTION_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  normal: {
    label: 'Normal',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  },
  notice_sent: {
    label: 'Notice Sent',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  lien_filed: {
    label: 'Lien Filed',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  levy_pending: {
    label: 'Levy Pending',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  levy_active: {
    label: 'Levy Active',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  garnishment: {
    label: 'Wage Garnishment',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  currently_not_collectible: {
    label: 'Currently Not Collectible',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
}

const PAYMENT_APPLIED_LABELS: Record<string, string> = {
  principal: 'Principal',
  interest: 'Interest',
  penalty: 'Penalty',
  mixed: 'Mixed',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function TaxDebtDetailPage() {
  const params = useParams()
  const router = useRouter()
  const debtId = params.id as string

  const [debt, setDebt] = useState<TaxDebt | null>(null)
  const [payments, setPayments] = useState<TaxDebtPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    payment_method: '',
    applied_to: 'mixed' as 'principal' | 'interest' | 'penalty' | 'mixed',
    confirmation_number: '',
  })
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const [debtResult, paymentsResult] = await Promise.all([
      getTaxDebt(debtId),
      getPaymentsForDebt(debtId),
    ])

    if (!debtResult.success) {
      setError(debtResult.error)
      setIsLoading(false)
      return
    }

    if (!debtResult.data) {
      setError('Tax debt not found')
      setIsLoading(false)
      return
    }

    setDebt(debtResult.data)
    if (paymentsResult.success) {
      setPayments(paymentsResult.data)
    }
    setIsLoading(false)
  }, [debtId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpdate = async (formData: TaxDebtFormData) => {
    const result = await updateTaxDebt(debtId, formData)
    if (result.success) {
      setDebt(result.data)
      setIsEditing(false)
    } else {
      throw new Error(result.error)
    }
  }

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this tax debt? This will also delete all payment history. This action cannot be undone.'
      )
    ) {
      return
    }

    setIsDeleting(true)
    const result = await deleteTaxDebt(debtId)
    if (result.success) {
      router.push('/tax-debt/debts')
    } else {
      alert(result.error)
      setIsDeleting(false)
    }
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentForm.payment_date) {
      alert('Please select a payment date')
      return
    }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    setIsSubmittingPayment(true)
    const result = await recordPayment({
      tax_debt_id: debtId,
      payment_date: paymentForm.payment_date,
      amount: parseFloat(paymentForm.amount),
      payment_method: paymentForm.payment_method || null,
      applied_to: paymentForm.applied_to || null,
      confirmation_number: paymentForm.confirmation_number || null,
    })

    if (result.success) {
      setPayments((prev) => [result.data, ...prev])
      // Refresh debt to get updated balance
      const debtResult = await getTaxDebt(debtId)
      if (debtResult.success && debtResult.data) {
        setDebt(debtResult.data)
      }
      setShowPaymentForm(false)
      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: '',
        applied_to: 'mixed',
        confirmation_number: '',
      })
    } else {
      alert(result.error)
    }
    setIsSubmittingPayment(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !debt) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/tax-debt/debts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Debts
          </Link>
        </Button>
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <h3 className="mt-4 font-medium dark:text-white">{error || 'Tax debt not found'}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The requested tax debt could not be loaded.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusConfig = COLLECTION_STATUS_CONFIG[debt.collection_status]
  const interestPenalties = debt.current_balance - debt.original_amount
  const daysUntilCSED = debt.statute_expiration_date
    ? Math.ceil(
        (new Date(debt.statute_expiration_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel Edit
          </Button>
          <h1 className="text-2xl font-bold dark:text-white">Edit Tax Debt - {debt.tax_year}</h1>
        </div>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle>Edit Details</CardTitle>
            <CardDescription>Update the information for this tax debt</CardDescription>
          </CardHeader>
          <CardContent>
            <DebtForm
              initialData={{
                tax_year: debt.tax_year,
                debt_type: debt.debt_type,
                original_amount: debt.original_amount,
                current_balance: debt.current_balance,
                interest_rate: debt.interest_rate ?? 8.0,
                penalty_rate: debt.penalty_rate,
                source: debt.source,
                collection_status: debt.collection_status,
                statute_expiration_date: debt.statute_expiration_date,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              submitLabel="Update"
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/tax-debt/debts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Tax Year {debt.tax_year}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {DEBT_TYPE_LABELS[debt.debt_type || ''] || 'Tax Debt'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(debt.current_balance)}
            </p>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Original Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold dark:text-white">
              {formatCurrency(debt.original_amount)}
            </p>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Interest & Penalties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                'text-2xl font-bold',
                interestPenalties > 0 ? 'text-amber-600 dark:text-amber-400' : 'dark:text-white'
              )}
            >
              {interestPenalties > 0 ? `+${formatCurrency(interestPenalties)}` : '$0.00'}
            </p>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Collection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className={cn('rounded-full px-3 py-1 text-sm font-medium', statusConfig?.color)}>
              {statusConfig?.label || debt.collection_status}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Details and Payments Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Debt Details */}
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-base">Debt Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tax Year</p>
                <p className="font-medium dark:text-white">{debt.tax_year}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Debt Type</p>
                <p className="font-medium dark:text-white">
                  {DEBT_TYPE_LABELS[debt.debt_type || ''] || 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Interest Rate</p>
                <p className="font-medium dark:text-white">{debt.interest_rate ?? 0}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Penalty Rate</p>
                <p className="font-medium dark:text-white">
                  {debt.penalty_rate !== null ? `${debt.penalty_rate}%` : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Source</p>
                <p className="font-medium dark:text-white">
                  {debt.source
                    ? debt.source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                    : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="font-medium dark:text-white">{formatDate(debt.created_at)}</p>
              </div>
            </div>

            {/* CSED Section */}
            <div className="rounded-lg border p-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-sm font-medium dark:text-white">
                  Collection Statute Expiration Date (CSED)
                </p>
              </div>
              <p className="mt-1 text-lg font-semibold dark:text-white">
                {formatDate(debt.statute_expiration_date)}
              </p>
              {daysUntilCSED !== null && (
                <p
                  className={cn(
                    'mt-1 text-sm',
                    daysUntilCSED < 365
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {daysUntilCSED > 0
                    ? `${daysUntilCSED} days until expiration`
                    : 'Statute has expired'}
                </p>
              )}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                The IRS has 10 years from assessment to collect. After CSED, the debt becomes
                uncollectible.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Payment History</CardTitle>
              <Button size="sm" onClick={() => setShowPaymentForm(!showPaymentForm)}>
                <Plus className="mr-1 h-4 w-4" />
                Record Payment
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Payment Form */}
            {showPaymentForm && (
              <form
                onSubmit={handleRecordPayment}
                className="mb-4 space-y-4 rounded-lg border p-4 dark:border-gray-800"
              >
                <h4 className="font-medium dark:text-white">Record New Payment</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="payment_date">Payment Date</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({ ...prev, payment_date: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        $
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                        }
                        className="pl-7"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Input
                      id="payment_method"
                      placeholder="e.g., Check, Direct Pay"
                      value={paymentForm.payment_method}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({ ...prev, payment_method: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applied_to">Applied To</Label>
                    <select
                      id="applied_to"
                      value={paymentForm.applied_to}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          applied_to: e.target.value as
                            | 'principal'
                            | 'interest'
                            | 'penalty'
                            | 'mixed',
                        }))
                      }
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
                    >
                      <option value="mixed">Mixed</option>
                      <option value="principal">Principal</option>
                      <option value="interest">Interest</option>
                      <option value="penalty">Penalty</option>
                    </select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="confirmation_number">Confirmation Number</Label>
                    <Input
                      id="confirmation_number"
                      placeholder="Optional"
                      value={paymentForm.confirmation_number}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({ ...prev, confirmation_number: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowPaymentForm(false)}
                    disabled={isSubmittingPayment}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingPayment}>
                    {isSubmittingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recording...
                      </>
                    ) : (
                      'Record Payment'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Payment List */}
            {payments.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <DollarSign className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  No payments recorded yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-green-600 dark:text-green-400">
                          -{formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(payment.payment_date)}
                          {payment.applied_to && (
                            <> &middot; {PAYMENT_APPLIED_LABELS[payment.applied_to]}</>
                          )}
                        </p>
                      </div>
                    </div>
                    {payment.confirmation_number && (
                      <p className="text-xs text-gray-400">#{payment.confirmation_number}</p>
                    )}
                  </div>
                ))}

                {/* Total Paid */}
                <div className="border-t pt-3 dark:border-gray-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Total Paid</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
