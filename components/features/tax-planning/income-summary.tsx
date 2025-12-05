'use client'

import { useMemo } from 'react'
import {
  Briefcase,
  Building2,
  TrendingUp,
  DollarSign,
  PiggyBank,
  Wallet,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface IncomeSource {
  type: 'wages' | 'selfEmployment' | 'capitalGains' | 'dividends' | 'retirement' | 'other'
  label: string
  amount: number
  ytdAmount?: number
  projectedAmount?: number
}

interface IncomeSummaryProps {
  incomeSources: IncomeSource[]
  showProjection?: boolean
  className?: string
}

const INCOME_TYPE_CONFIG: Record<
  IncomeSource['type'],
  { icon: typeof Briefcase; color: string; bgColor: string }
> = {
  wages: {
    icon: Briefcase,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  selfEmployment: {
    icon: Building2,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  capitalGains: {
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  dividends: {
    icon: DollarSign,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  retirement: {
    icon: PiggyBank,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  other: {
    icon: Wallet,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function IncomeSummary({
  incomeSources,
  showProjection = false,
  className,
}: IncomeSummaryProps) {
  const totals = useMemo(() => {
    const ytd = incomeSources.reduce((sum, s) => sum + (s.ytdAmount ?? s.amount), 0)
    const projected = incomeSources.reduce(
      (sum, s) => sum + (s.projectedAmount ?? s.ytdAmount ?? s.amount),
      0
    )
    const current = incomeSources.reduce((sum, s) => sum + s.amount, 0)
    return { ytd, projected, current }
  }, [incomeSources])

  // Calculate progress through the year
  const currentMonth = new Date().getMonth() + 1
  const yearProgress = currentMonth / 12

  return (
    <Card className={cn('dark:border-gray-800 dark:bg-gray-900', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Income Summary</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {new Date().getFullYear()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Summary */}
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {showProjection ? 'Projected Total' : 'Total Income'}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(showProjection ? totals.projected : totals.current)}
              </p>
            </div>
            {showProjection && (
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">YTD</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  {formatCurrency(totals.ytd)}
                </p>
              </div>
            )}
          </div>

          {/* Year Progress Bar */}
          {showProjection && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Year Progress</span>
                <span>{Math.round(yearProgress * 100)}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${yearProgress * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Income Sources Breakdown */}
        <div className="space-y-2">
          {incomeSources
            .filter((source) => source.amount > 0)
            .sort((a, b) => b.amount - a.amount)
            .map((source, index) => {
              const config = INCOME_TYPE_CONFIG[source.type]
              const Icon = config.icon
              const percentage = (source.amount / totals.current) * 100

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                      config.bgColor
                    )}
                  >
                    <Icon className={cn('h-5 w-5', config.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium dark:text-white">{source.label}</p>
                      <p className="text-sm font-semibold dark:text-white">
                        {formatCurrency(source.amount)}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            config.bgColor.replace('bg-', 'bg-')
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Add Income Link */}
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-lg border border-dashed p-3 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
        >
          <span>Add Income Source</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  )
}

/**
 * Compact version for dashboard widgets
 */
export function IncomeSummaryCompact({
  totalIncome,
  incomeTypes,
  className,
}: {
  totalIncome: number
  incomeTypes: { label: string; amount: number }[]
  className?: string
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">Total Income</span>
        <span className="text-lg font-bold dark:text-white">{formatCurrency(totalIncome)}</span>
      </div>
      <div className="space-y-2">
        {incomeTypes.slice(0, 3).map((type, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">{type.label}</span>
            <span className="dark:text-white">{formatCurrency(type.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
