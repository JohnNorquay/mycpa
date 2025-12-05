'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Play,
  Pause,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Edit2,
  Check,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  getRecurringItems,
  updateRecurringItem,
  pauseRecurringItem,
  resumeRecurringItem,
  deleteRecurringItem,
  runRecurringDetection,
  type RecurringTransaction,
} from '@/app/actions/recurring'

type Frequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'annual'

const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 Weeks',
  semimonthly: 'Twice Monthly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value))
}

function getDaysUntilNext(nextExpected: string | null): number | null {
  if (!nextExpected) return null
  const next = new Date(nextExpected)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default function RecurringManagementPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionResult, setDetectionResult] = useState<{
    detected: number
    updated: number
  } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await getRecurringItems()
    if (result.success) {
      setItems(result.data)
    } else {
      setError(result.error)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    loadItems().then(() => {
      if (!mounted) return
    })
    return () => {
      mounted = false
    }
  }, [loadItems])

  const handleRunDetection = async () => {
    setIsDetecting(true)
    setDetectionResult(null)
    const result = await runRecurringDetection()
    if (result.success) {
      setDetectionResult(result.data)
      await loadItems()
    } else {
      setError(result.error)
    }
    setIsDetecting(false)
  }

  const handleToggleActive = async (item: RecurringTransaction) => {
    setActionInProgress(item.id)
    const result = item.is_active
      ? await pauseRecurringItem(item.id)
      : await resumeRecurringItem(item.id)
    if (result.success) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? result.data : i)))
    } else {
      alert(result.error)
    }
    setActionInProgress(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring item?')) return
    setActionInProgress(id)
    const result = await deleteRecurringItem(id)
    if (result.success) {
      setItems((prev) => prev.filter((i) => i.id !== id))
    } else {
      alert(result.error)
    }
    setActionInProgress(null)
  }

  const handleStartEdit = (item: RecurringTransaction) => {
    setEditingId(item.id)
    setEditAmount((item.expected_amount ?? 0).toString())
  }

  const handleSaveEdit = async (id: string) => {
    const amount = parseFloat(editAmount)
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount')
      return
    }
    setActionInProgress(id)
    const result = await updateRecurringItem(id, { expected_amount: amount })
    if (result.success) {
      setItems((prev) => prev.map((i) => (i.id === id ? result.data : i)))
      setEditingId(null)
    } else {
      alert(result.error)
    }
    setActionInProgress(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditAmount('')
  }

  // Calculate stats
  const activeItems = items.filter((i) => i.is_active)
  const monthlyIncome = activeItems
    .filter((i) => i.is_income)
    .reduce((sum, i) => {
      const multiplier =
        i.frequency === 'weekly'
          ? 4.33
          : i.frequency === 'biweekly'
            ? 2.17
            : i.frequency === 'semimonthly'
              ? 2
              : 1
      return sum + (i.expected_amount ?? 0) * multiplier
    }, 0)
  const monthlyExpenses = activeItems
    .filter((i) => !i.is_income)
    .reduce((sum, i) => {
      const multiplier =
        i.frequency === 'weekly'
          ? 4.33
          : i.frequency === 'biweekly'
            ? 2.17
            : i.frequency === 'semimonthly'
              ? 2
              : 1
      return sum + Math.abs(i.expected_amount ?? 0) * multiplier
    }, 0)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/cash-flow">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">Recurring Transactions</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage detected recurring income and expenses
            </p>
          </div>
        </div>
        <Button onClick={handleRunDetection} disabled={isDetecting}>
          {isDetecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Detecting...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-detect Patterns
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {detectionResult && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
          <Check className="h-4 w-4" />
          Found {detectionResult.detected} new patterns, updated {detectionResult.updated} existing
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Monthly Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              +{formatCurrency(monthlyIncome)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              From {activeItems.filter((i) => i.is_income).length} sources
            </p>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Monthly Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              -{formatCurrency(monthlyExpenses)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              From {activeItems.filter((i) => !i.is_income).length} bills
            </p>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Net Monthly
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                'text-2xl font-bold',
                monthlyIncome - monthlyExpenses >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {monthlyIncome - monthlyExpenses >= 0 ? '+' : ''}
              {formatCurrency(monthlyIncome - monthlyExpenses)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Recurring cash flow</p>
          </CardContent>
        </Card>
      </div>

      {/* Recurring Items List */}
      {items.length === 0 ? (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-4 font-medium dark:text-white">No Recurring Transactions</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Connect your bank accounts and we&apos;ll detect recurring patterns automatically.
              </p>
              <Button onClick={handleRunDetection} className="mt-4" disabled={isDetecting}>
                {isDetecting ? 'Detecting...' : 'Detect Patterns'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Income Section */}
          {items.filter((i) => i.is_income).length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold dark:text-white">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Income
              </h2>
              <div className="divide-y rounded-lg border dark:divide-gray-800 dark:border-gray-800">
                {items
                  .filter((i) => i.is_income)
                  .map((item) => (
                    <RecurringItemRow
                      key={item.id}
                      item={item}
                      isEditing={editingId === item.id}
                      editAmount={editAmount}
                      onEditAmountChange={setEditAmount}
                      onStartEdit={() => handleStartEdit(item)}
                      onSaveEdit={() => handleSaveEdit(item.id)}
                      onCancelEdit={handleCancelEdit}
                      onToggleActive={() => handleToggleActive(item)}
                      onDelete={() => handleDelete(item.id)}
                      isLoading={actionInProgress === item.id}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Expenses Section */}
          {items.filter((i) => !i.is_income).length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold dark:text-white">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Expenses
              </h2>
              <div className="divide-y rounded-lg border dark:divide-gray-800 dark:border-gray-800">
                {items
                  .filter((i) => !i.is_income)
                  .map((item) => (
                    <RecurringItemRow
                      key={item.id}
                      item={item}
                      isEditing={editingId === item.id}
                      editAmount={editAmount}
                      onEditAmountChange={setEditAmount}
                      onStartEdit={() => handleStartEdit(item)}
                      onSaveEdit={() => handleSaveEdit(item.id)}
                      onCancelEdit={handleCancelEdit}
                      onToggleActive={() => handleToggleActive(item)}
                      onDelete={() => handleDelete(item.id)}
                      isLoading={actionInProgress === item.id}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface RecurringItemRowProps {
  item: RecurringTransaction
  isEditing: boolean
  editAmount: string
  onEditAmountChange: (value: string) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onToggleActive: () => void
  onDelete: () => void
  isLoading: boolean
}

function RecurringItemRow({
  item,
  isEditing,
  editAmount,
  onEditAmountChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleActive,
  onDelete,
  isLoading,
}: RecurringItemRowProps) {
  const daysUntil = getDaysUntilNext(item.next_expected)

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 transition-colors',
        !item.is_active && 'bg-gray-50 dark:bg-gray-800/50'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
          item.is_income ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
        )}
      >
        <DollarSign
          className={cn(
            'h-5 w-5',
            item.is_income ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}
        />
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              'font-medium',
              !item.is_active && 'text-gray-400 line-through dark:text-gray-500'
            )}
          >
            {item.merchant_name}
          </p>
          {!item.is_active && (
            <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              Paused
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {FREQUENCY_LABELS[item.frequency as Frequency] || item.frequency}
          {item.expected_day && ` on day ${item.expected_day}`}
          {item.category && ` • ${item.category}`}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <span className="text-gray-400">$</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={editAmount}
              onChange={(e) => onEditAmountChange(e.target.value)}
              className="h-8 w-24"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={onSaveEdit} disabled={isLoading}>
              <Check className="h-4 w-4 text-green-500" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEdit} disabled={isLoading}>
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        ) : (
          <>
            <p
              className={cn(
                'font-semibold',
                item.is_income
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {item.is_income ? '+' : '-'}
              {formatCurrency(item.expected_amount ?? 0)}
            </p>
            {daysUntil !== null && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {daysUntil === 0
                  ? 'Today'
                  : daysUntil === 1
                    ? 'Tomorrow'
                    : daysUntil < 0
                      ? `${Math.abs(daysUntil)} days ago`
                      : `In ${daysUntil} days`}
              </p>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onStartEdit}
            disabled={isLoading}
            title="Edit amount"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleActive}
            disabled={isLoading}
            title={item.is_active ? 'Pause' : 'Resume'}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : item.is_active ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={isLoading}
            className="text-red-500 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
