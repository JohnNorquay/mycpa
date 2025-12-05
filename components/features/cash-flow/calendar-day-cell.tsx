'use client'

import { ArrowUp, ArrowDown, AlertTriangle, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DailyProjection } from '@/lib/cash-flow/projection-engine'

interface CalendarDayCellProps {
  date: Date | null
  isToday: boolean
  isCurrentMonth: boolean
  isSelected: boolean
  projection: DailyProjection | null
  onClick: () => void
}

export function CalendarDayCell({
  date,
  isToday,
  isCurrentMonth,
  isSelected,
  projection,
  onClick,
}: CalendarDayCellProps) {
  if (!date || !isCurrentMonth) {
    return <div className="h-20 rounded-lg bg-gray-50 dark:bg-gray-800/30" />
  }

  const dayNumber = date.getDate()

  // Calculate income and expenses for the day
  const income =
    projection?.expectedTransactions
      .filter((t) => t.isIncome)
      .reduce((sum, t) => sum + t.expectedAmount, 0) || 0

  const expenses =
    projection?.expectedTransactions
      .filter((t) => !t.isIncome)
      .reduce((sum, t) => sum + t.expectedAmount, 0) || 0

  const hasIncome = income > 0
  const hasExpenses = expenses > 0
  const hasLargeExpense = expenses > 500
  const isPayday = income > 500
  const runningBalance = projection?.runningBalance ?? 0
  const isNegativeBalance = runningBalance < 0
  const isLowBalance = runningBalance > 0 && runningBalance < 500

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative h-20 w-full rounded-lg border p-1.5 text-left transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-gray-800 dark:hover:border-blue-700 dark:hover:bg-blue-900/20',
        isToday && 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900',
        isSelected && 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/30',
        isNegativeBalance && 'bg-red-50 dark:bg-red-900/20',
        !isNegativeBalance && isLowBalance && 'bg-amber-50 dark:bg-amber-900/20'
      )}
    >
      {/* Day number */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium',
            isToday
              ? 'bg-blue-500 text-white'
              : isSelected
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300'
          )}
        >
          {dayNumber}
        </span>

        {/* Warning indicators */}
        <div className="flex items-center gap-0.5">
          {isNegativeBalance && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
          {!isNegativeBalance && isLowBalance && (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          )}
        </div>
      </div>

      {/* Transaction indicators */}
      <div className="mt-1 flex flex-col gap-0.5">
        {hasIncome && (
          <div
            className={cn(
              'flex items-center gap-0.5 rounded px-1 py-0.5 text-xs',
              isPayday
                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                : 'text-green-600 dark:text-green-400'
            )}
          >
            <ArrowUp className="h-2.5 w-2.5" />
            <span className="truncate">
              +${income >= 1000 ? `${(income / 1000).toFixed(1)}k` : income.toFixed(0)}
            </span>
            {isPayday && <DollarSign className="h-2.5 w-2.5" />}
          </div>
        )}

        {hasExpenses && (
          <div
            className={cn(
              'flex items-center gap-0.5 rounded px-1 py-0.5 text-xs',
              hasLargeExpense
                ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                : 'text-red-600 dark:text-red-400'
            )}
          >
            <ArrowDown className="h-2.5 w-2.5" />
            <span className="truncate">
              -${expenses >= 1000 ? `${(expenses / 1000).toFixed(1)}k` : expenses.toFixed(0)}
            </span>
            {hasLargeExpense && <AlertTriangle className="h-2.5 w-2.5" />}
          </div>
        )}
      </div>

      {/* Balance indicator (small, at bottom) */}
      {projection && (
        <div
          className={cn(
            'absolute bottom-1 right-1 text-[10px]',
            isNegativeBalance
              ? 'text-red-500'
              : isLowBalance
                ? 'text-amber-500'
                : 'text-gray-400 dark:text-gray-500'
          )}
        >
          $
          {runningBalance >= 1000 || runningBalance <= -1000
            ? `${(runningBalance / 1000).toFixed(1)}k`
            : runningBalance.toFixed(0)}
        </div>
      )}
    </button>
  )
}
