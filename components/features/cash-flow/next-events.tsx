'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Loader2,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getUpcomingRecurringTransactions } from '@/app/actions/cash-flow'

interface NextEventsProps {
  className?: string
  limit?: number
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDaysUntilLabel(days: number): string {
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days <= 7) return `${days} days`
  return formatDate(new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString())
}

export function NextEvents({ className, limit = 5 }: NextEventsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [events, setEvents] = useState<
    Array<{
      id: string
      merchantName: string
      expectedAmount: number
      nextExpected: string
      isIncome: boolean
      daysUntil: number
    }>
  >([])

  useEffect(() => {
    async function loadEvents() {
      setIsLoading(true)

      try {
        const result = await getUpcomingRecurringTransactions()

        if (result.success) {
          setEvents(result.data.slice(0, limit))
        }
      } catch {
        // Silently handle errors
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [limit])

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className={cn('py-6 text-center', className)}>
        <Calendar className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No upcoming events detected</p>
        <Link href="/cash-flow/recurring" className="mt-1 text-sm text-blue-500 hover:underline">
          Set up recurring transactions
        </Link>
      </div>
    )
  }

  // Find next paycheck (income > $500)
  const nextPaycheck = events.find((e) => e.isIncome && e.expectedAmount > 500)

  // Find next large bill (expense > $500)
  const nextLargeBill = events.find((e) => !e.isIncome && e.expectedAmount > 500)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Key highlights */}
      <div className="grid grid-cols-2 gap-3">
        {/* Next Paycheck */}
        {nextPaycheck && (
          <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
              <ArrowUpCircle className="h-3.5 w-3.5" />
              Next Paycheck
            </div>
            <p className="mt-1 text-lg font-bold text-green-700 dark:text-green-300">
              {formatCurrency(nextPaycheck.expectedAmount)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              {getDaysUntilLabel(nextPaycheck.daysUntil)}
            </p>
          </div>
        )}

        {/* Next Large Bill */}
        {nextLargeBill && (
          <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <ArrowDownCircle className="h-3.5 w-3.5" />
              Next Large Bill
            </div>
            <p className="mt-1 text-lg font-bold text-red-700 dark:text-red-300">
              {formatCurrency(nextLargeBill.expectedAmount)}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              {getDaysUntilLabel(nextLargeBill.daysUntil)}
            </p>
          </div>
        )}
      </div>

      {/* Days until next paycheck */}
      {nextPaycheck && nextPaycheck.daysUntil > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">{nextPaycheck.daysUntil} days</span> until next paycheck
          </span>
        </div>
      )}

      {/* Upcoming events list */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Upcoming
        </h4>
        <div className="divide-y dark:divide-gray-800">
          {events.map((event) => (
            <div key={event.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                {event.isIncome ? (
                  <ArrowUpCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium dark:text-white">{event.merchantName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {getDaysUntilLabel(event.daysUntil)}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'text-sm font-semibold',
                  event.isIncome
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {event.isIncome ? '+' : '-'}
                {formatCurrency(event.expectedAmount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Warning for upcoming large expenses */}
      {nextLargeBill && nextLargeBill.daysUntil <= 7 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            Large bill ({formatCurrency(nextLargeBill.expectedAmount)}) due in{' '}
            {nextLargeBill.daysUntil} days
          </span>
        </div>
      )}

      {/* Link to full recurring view */}
      <Link
        href="/cash-flow/recurring"
        className="block text-center text-sm text-blue-500 hover:underline"
      >
        Manage recurring transactions
      </Link>
    </div>
  )
}

/**
 * Compact version showing only the key highlights
 */
export function NextEventsCompact({ className }: { className?: string }) {
  return <NextEvents className={className} limit={3} />
}
