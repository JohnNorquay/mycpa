'use client'

import {
  X,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DailyProjection, ExpectedTransaction } from '@/lib/cash-flow/projection-engine'

interface DayDetailPanelProps {
  date: string | null
  projection: DailyProjection | null
  onClose: () => void
  className?: string
}

function formatCurrency(amount: number): string {
  const isNegative = amount < 0
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
  return isNegative ? `-${formatted}` : formatted
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getConfidenceBadge(confidence: 'high' | 'medium' | 'low') {
  const colors = {
    high: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <span className={cn('rounded px-1.5 py-0.5 text-xs capitalize', colors[confidence])}>
      {confidence}
    </span>
  )
}

export function DayDetailPanel({ date, projection, onClose, className }: DayDetailPanelProps) {
  if (!date) return null

  const income =
    projection?.expectedTransactions
      .filter((t) => t.isIncome)
      .reduce((sum, t) => sum + t.expectedAmount, 0) || 0

  const expenses =
    projection?.expectedTransactions
      .filter((t) => !t.isIncome)
      .reduce((sum, t) => sum + t.expectedAmount, 0) || 0

  const netChange = income - expenses
  const runningBalance = projection?.runningBalance ?? 0
  const isNegativeBalance = runningBalance < 0
  const hasTransactions = projection && projection.expectedTransactions.length > 0

  const incomeTransactions = projection?.expectedTransactions.filter((t) => t.isIncome) || []
  const expenseTransactions = projection?.expectedTransactions.filter((t) => !t.isIncome) || []

  return (
    <div
      className={cn(
        'rounded-lg border bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div>
            <h3 className="font-semibold dark:text-white">{formatDate(date)}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hasTransactions
                ? `${projection.expectedTransactions.length} expected transaction${projection.expectedTransactions.length !== 1 ? 's' : ''}`
                : 'No expected transactions'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <ArrowUpCircle className="h-3.5 w-3.5" />
              Income
            </div>
            <p className="mt-1 text-lg font-bold text-green-700 dark:text-green-300">
              {formatCurrency(income)}
            </p>
          </div>

          <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <ArrowDownCircle className="h-3.5 w-3.5" />
              Expenses
            </div>
            <p className="mt-1 text-lg font-bold text-red-700 dark:text-red-300">
              {formatCurrency(expenses)}
            </p>
          </div>

          <div
            className={cn(
              'rounded-lg p-3',
              netChange >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-1.5 text-xs',
                netChange >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {netChange >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              Net Change
            </div>
            <p
              className={cn(
                'mt-1 text-lg font-bold',
                netChange >= 0
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              )}
            >
              {netChange >= 0 ? '+' : ''}
              {formatCurrency(netChange)}
            </p>
          </div>
        </div>

        {/* Running Balance */}
        <div
          className={cn(
            'flex items-center justify-between rounded-lg p-3',
            isNegativeBalance ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800/50'
          )}
        >
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">End of Day Balance</span>
          </div>
          <span
            className={cn(
              'text-lg font-bold',
              isNegativeBalance ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
            )}
          >
            {formatCurrency(runningBalance)}
          </span>
        </div>

        {/* Warning */}
        {isNegativeBalance && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Balance is projected to be negative on this day</span>
          </div>
        )}

        {/* Transaction Lists */}
        {hasTransactions && (
          <div className="space-y-4">
            {/* Income */}
            {incomeTransactions.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                  <ArrowUpCircle className="h-4 w-4 text-green-500" />
                  Expected Income
                </h4>
                <div className="space-y-2">
                  {incomeTransactions.map((transaction) => (
                    <TransactionRow key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              </div>
            )}

            {/* Expenses */}
            {expenseTransactions.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-white">
                  <ArrowDownCircle className="h-4 w-4 text-red-500" />
                  Expected Expenses
                </h4>
                <div className="space-y-2">
                  {expenseTransactions.map((transaction) => (
                    <TransactionRow key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No transactions message */}
        {!hasTransactions && (
          <div className="py-6 text-center">
            <Calendar className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              No expected transactions on this day
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function TransactionRow({ transaction }: { transaction: ExpectedTransaction }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full',
            transaction.isIncome
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
          )}
        >
          {transaction.isIncome ? (
            <ArrowUpCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <ArrowDownCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium dark:text-white">{transaction.merchantName}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {transaction.category && <span>{transaction.category}</span>}
            {getConfidenceBadge(transaction.confidence)}
          </div>
        </div>
      </div>
      <span
        className={cn(
          'text-sm font-semibold',
          transaction.isIncome
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        )}
      >
        {transaction.isIncome ? '+' : '-'}
        {formatCurrency(transaction.expectedAmount)}
      </span>
    </div>
  )
}
