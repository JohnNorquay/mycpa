'use client'

import { useMemo } from 'react'
import { Info, TrendingUp, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TaxBracket {
  rate: number
  min: number
  max: number | null
}

interface MarginalRateDisplayProps {
  taxableIncome: number
  federalMarginalRate: number
  stateMarginalRate: number
  federalBrackets: TaxBracket[]
  className?: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

export function MarginalRateDisplay({
  taxableIncome,
  federalMarginalRate,
  stateMarginalRate,
  federalBrackets,
  className,
}: MarginalRateDisplayProps) {
  const combinedRate = federalMarginalRate + stateMarginalRate

  // Find current bracket and distance to next
  const bracketInfo = useMemo(() => {
    const currentBracket = federalBrackets.find(
      (b) => taxableIncome >= b.min && (b.max === null || taxableIncome < b.max)
    )

    if (!currentBracket) return null

    const currentBracketIndex = federalBrackets.indexOf(currentBracket)
    const nextBracket = federalBrackets[currentBracketIndex + 1]

    const distanceToNextBracket = currentBracket.max ? currentBracket.max - taxableIncome : null

    const progressInBracket = currentBracket.max
      ? ((taxableIncome - currentBracket.min) / (currentBracket.max - currentBracket.min)) * 100
      : 0

    return {
      currentBracket,
      nextBracket,
      distanceToNextBracket,
      progressInBracket,
      isTopBracket: !nextBracket,
    }
  }, [taxableIncome, federalBrackets])

  return (
    <Card className={cn('dark:border-gray-800 dark:bg-gray-900', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          Marginal Tax Rate
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Combined Rate */}
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-4 dark:from-blue-900/20 dark:to-purple-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-300">Your next dollar is taxed at</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {formatPercent(combinedRate)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Combined federal + state</p>
        </div>

        {/* Rate Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">Federal</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatPercent(federalMarginalRate)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">Wisconsin</p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
              {formatPercent(stateMarginalRate)}
            </p>
          </div>
        </div>

        {/* Bracket Progress */}
        {bracketInfo && !bracketInfo.isTopBracket && bracketInfo.distanceToNextBracket && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Distance to {formatPercent(bracketInfo.nextBracket?.rate ?? 0)} bracket
              </span>
              <span className="font-medium dark:text-white">
                {formatCurrency(bracketInfo.distanceToNextBracket)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${bracketInfo.progressInBracket}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {bracketInfo.progressInBracket.toFixed(0)}% through current bracket
            </p>
          </div>
        )}

        {bracketInfo?.isTopBracket && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-900/20">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
            <p className="text-amber-700 dark:text-amber-400">
              You are in the highest federal tax bracket ({formatPercent(federalMarginalRate)})
            </p>
          </div>
        )}

        {/* Tax Planning Insight */}
        <div className="rounded-lg border p-3 dark:border-gray-800">
          <div className="flex items-start gap-2">
            <DollarSign className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
            <div>
              <p className="text-sm font-medium dark:text-white">Tax Planning Insight</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                For every additional $1,000 you earn, approximately{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {formatCurrency(1000 * combinedRate)}
                </span>{' '}
                goes to taxes. Consider tax-advantaged contributions to reduce your taxable income.
              </p>
            </div>
          </div>
        </div>

        {/* Federal Bracket Visualization */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Federal Tax Brackets
          </p>
          <div className="flex gap-1">
            {federalBrackets.map((bracket, i) => {
              const isCurrentBracket =
                taxableIncome >= bracket.min &&
                (bracket.max === null || taxableIncome < bracket.max)
              const isPastBracket = bracket.max !== null && taxableIncome >= bracket.max

              return (
                <div
                  key={i}
                  className={cn(
                    'flex-1 rounded py-1 text-center text-xs font-medium transition-colors',
                    isCurrentBracket
                      ? 'bg-blue-500 text-white'
                      : isPastBracket
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  )}
                  title={`${(bracket.rate * 100).toFixed(0)}% bracket: ${formatCurrency(bracket.min)}${bracket.max ? ` - ${formatCurrency(bracket.max)}` : '+'}`}
                >
                  {(bracket.rate * 100).toFixed(0)}%
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact badge version for quick display
 */
export function MarginalRateBadge({
  combinedRate,
  className,
}: {
  combinedRate: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        className
      )}
    >
      <TrendingUp className="h-3.5 w-3.5" />
      {formatPercent(combinedRate)} marginal rate
    </div>
  )
}
