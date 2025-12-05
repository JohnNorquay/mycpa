'use client'

import { useMemo } from 'react'
import { DollarSign, Calendar, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TaxDebt {
  id: string
  tax_year: number
  original_amount: number
  current_balance: number
  daily_interest_rate: number
  collection_status: string
}

interface DebtSummaryProps {
  debts: TaxDebt[]
  className?: string
  debtsHref?: string
}

const COLLECTION_STATUS_CONFIG: Record<string, { label: string; color: string; priority: number }> =
  {
    normal: {
      label: 'Normal',
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      priority: 0,
    },
    notice_sent: {
      label: 'Notice Sent',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      priority: 1,
    },
    lien_filed: {
      label: 'Lien Filed',
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      priority: 2,
    },
    levy_pending: {
      label: 'Levy Pending',
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      priority: 3,
    },
    levy_active: {
      label: 'Levy Active',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      priority: 4,
    },
    garnishment: {
      label: 'Wage Garnishment',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      priority: 4,
    },
    currently_not_collectible: {
      label: 'Currently Not Collectible',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      priority: 5,
    },
  }

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function DebtSummary({ debts, className, debtsHref = '/tax-debt/debts' }: DebtSummaryProps) {
  const summary = useMemo(() => {
    if (debts.length === 0) {
      return null
    }

    // Calculate total debt
    const totalDebt = debts.reduce((sum, d) => sum + d.current_balance, 0)

    // Calculate total daily interest
    const dailyInterest = debts.reduce((sum, d) => {
      const rate = d.daily_interest_rate || 0.00022 // Default IRS rate ~8% annually
      return sum + d.current_balance * rate
    }, 0)

    // Find oldest debt year
    const oldestYear = Math.min(...debts.map((d) => d.tax_year))

    // Find most severe collection status
    let worstStatus = 'normal'
    let worstPriority = 0

    debts.forEach((debt) => {
      const config = COLLECTION_STATUS_CONFIG[debt.collection_status]
      if (config && config.priority > worstPriority) {
        worstPriority = config.priority
        worstStatus = debt.collection_status
      }
    })

    // Count debts by status severity
    const urgentDebts = debts.filter((d) => {
      const priority = COLLECTION_STATUS_CONFIG[d.collection_status]?.priority ?? 0
      return priority >= 3 // levy_pending or worse
    }).length

    return {
      totalDebt,
      dailyInterest,
      oldestYear,
      worstStatus,
      urgentDebts,
      debtCount: debts.length,
    }
  }, [debts])

  if (!summary) {
    return (
      <Card className={cn('dark:border-gray-800 dark:bg-gray-900', className)}>
        <CardHeader>
          <CardTitle className="text-base dark:text-white">Tax Debt Summary</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Track your IRS tax obligations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="mt-3 font-medium dark:text-white">No Tax Debts</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You have no tracked tax obligations
            </p>
            <Button asChild variant="outline" className="mt-4" size="sm">
              <Link href={`${debtsHref}/new`}>Add Tax Debt</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const statusConfig = COLLECTION_STATUS_CONFIG[summary.worstStatus]
  const isUrgent = summary.urgentDebts > 0

  return (
    <Card
      className={cn(
        'dark:border-gray-800 dark:bg-gray-900',
        isUrgent && 'border-red-200 dark:border-red-900/50',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base dark:text-white">Tax Debt Summary</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={debtsHref}>
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <CardDescription className="dark:text-gray-400">
          {summary.debtCount} tax year{summary.debtCount !== 1 ? 's' : ''} tracked
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Debt */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Debt</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.totalDebt)}
              </p>
            </div>
          </div>
        </div>

        {/* Daily Interest */}
        <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
          <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              +{formatCurrency(summary.dailyInterest)}/day
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Daily interest accruing</p>
          </div>
        </div>

        {/* Oldest Debt & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 dark:border-gray-800">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Oldest Debt</span>
            </div>
            <p className="mt-1 text-lg font-semibold dark:text-white">{summary.oldestYear}</p>
          </div>

          <div className="rounded-lg border p-3 dark:border-gray-800">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Status</span>
            </div>
            <div className="mt-1">
              <span
                className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusConfig?.color)}
              >
                {statusConfig?.label || summary.worstStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Urgent Alert */}
        {isUrgent && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {summary.urgentDebts} urgent debt{summary.urgentDebts !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-600 dark:text-red-500">Requires immediate attention</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact version for sidebar/smaller spaces
 */
export function DebtSummaryCompact({
  debts,
  debtsHref = '/tax-debt/debts',
}: {
  debts: TaxDebt[]
  debtsHref?: string
}) {
  const totalDebt = useMemo(() => {
    return debts.reduce((sum, d) => sum + d.current_balance, 0)
  }, [debts])

  const hasUrgent = useMemo(() => {
    return debts.some((d) => {
      const priority = COLLECTION_STATUS_CONFIG[d.collection_status]?.priority ?? 0
      return priority >= 3
    })
  }, [debts])

  if (debts.length === 0) return null

  return (
    <Link
      href={debtsHref}
      className={cn(
        'flex items-center gap-3 rounded-lg p-3 transition-colors',
        hasUrgent
          ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'
          : 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          hasUrgent ? 'bg-red-100 dark:bg-red-900/50' : 'bg-gray-200 dark:bg-gray-700'
        )}
      >
        <DollarSign
          className={cn(
            'h-5 w-5',
            hasUrgent ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
          )}
        />
      </div>
      <div className="flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            hasUrgent ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'
          )}
        >
          {formatCurrency(totalDebt)}
        </p>
        <p
          className={cn(
            'text-xs',
            hasUrgent ? 'text-red-600 dark:text-red-500' : 'text-gray-500 dark:text-gray-400'
          )}
        >
          {debts.length} tax year{debts.length !== 1 ? 's' : ''}
          {hasUrgent && ' • Urgent'}
        </p>
      </div>
      <ChevronRight className={cn('h-4 w-4', hasUrgent ? 'text-red-400' : 'text-gray-400')} />
    </Link>
  )
}
