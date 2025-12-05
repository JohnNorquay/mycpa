'use client'

import { useState, useEffect, useMemo } from 'react'
import { Loader2, AlertTriangle, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getCashFlowProjection } from '@/app/actions/cash-flow'
import type { CashFlowProjection } from '@/lib/cash-flow/projection-engine'

interface BalanceTrajectoryProps {
  className?: string
  days?: number
  showLegend?: boolean
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

export function BalanceTrajectory({
  className,
  days = 30,
  showLegend = true,
}: BalanceTrajectoryProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projection, setProjection] = useState<CashFlowProjection | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        const today = new Date()
        const endDate = new Date()
        endDate.setDate(today.getDate() + days)

        const startStr = today.toISOString().split('T')[0] || ''
        const endStr = endDate.toISOString().split('T')[0] || ''

        const result = await getCashFlowProjection(startStr, endStr)

        if (result.success) {
          setProjection(result.data)
        } else {
          setError(result.error || 'Failed to load projection')
        }
      } catch {
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [days])

  // Calculate chart dimensions and data
  const chartData = useMemo(() => {
    if (!projection || projection.projections.length === 0) return null

    const balances = projection.projections.map((p) => p.runningBalance)
    const maxBalance = Math.max(...balances)
    const minBalance = Math.min(...balances, 0)
    const range = maxBalance - minBalance || 1

    // Chart dimensions
    const width = 100
    const height = 60
    const padding = { top: 5, bottom: 5, left: 0, right: 0 }
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    // Generate path points
    const points = projection.projections.map((p, i) => {
      const x = padding.left + (i / (projection.projections.length - 1)) * chartWidth
      const y = padding.top + chartHeight - ((p.runningBalance - minBalance) / range) * chartHeight
      return { x, y, data: p }
    })

    // Create SVG path
    const pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ')

    // Find low points and paydays
    const lowPointIdx = balances.indexOf(Math.min(...balances))
    const lowPoint = points[lowPointIdx]

    // Find paydays (income events)
    const paydays = projection.projections
      .map((p, i) => ({
        index: i,
        point: points[i],
        isPayday: p.expectedTransactions.some((t) => t.isIncome && t.expectedAmount > 500),
      }))
      .filter((p) => p.isPayday)

    // Zero line position
    const zeroLineY =
      minBalance < 0 ? padding.top + chartHeight - ((0 - minBalance) / range) * chartHeight : null

    return {
      points,
      pathD,
      lowPoint,
      paydays,
      zeroLineY,
      width,
      height,
      minBalance,
      maxBalance,
    }
  }, [projection])

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Balance Trajectory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !projection || !chartData) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Balance Trajectory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {error || 'No projection data available'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasNegativeBalance = chartData.minBalance < 0

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Balance Trajectory</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            Next {days} days
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${chartData.width} ${chartData.height}`}
            className="h-40 w-full"
            preserveAspectRatio="none"
          >
            {/* Zero line */}
            {chartData.zeroLineY !== null && (
              <line
                x1="0"
                y1={chartData.zeroLineY}
                x2={chartData.width}
                y2={chartData.zeroLineY}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2,2"
                className="text-red-300 dark:text-red-700"
              />
            )}

            {/* Gradient fill under line */}
            <defs>
              <linearGradient id="balanceGradient" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={hasNegativeBalance ? '#ef4444' : '#22c55e'}
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor={hasNegativeBalance ? '#ef4444' : '#22c55e'}
                  stopOpacity="0.05"
                />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path
              d={`${chartData.pathD} L ${chartData.width} ${chartData.height} L 0 ${chartData.height} Z`}
              fill="url(#balanceGradient)"
            />

            {/* Main line */}
            <path
              d={chartData.pathD}
              fill="none"
              stroke={hasNegativeBalance ? '#ef4444' : '#22c55e'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Low point marker */}
            {chartData.lowPoint && (
              <circle
                cx={chartData.lowPoint.x}
                cy={chartData.lowPoint.y}
                r="4"
                fill={hasNegativeBalance ? '#ef4444' : '#f59e0b'}
                stroke="white"
                strokeWidth="2"
              />
            )}

            {/* Payday markers */}
            {chartData.paydays.map((payday, i) => (
              <circle
                key={i}
                cx={payday.point?.x ?? 0}
                cy={payday.point?.y ?? 0}
                r="3"
                fill="#22c55e"
                stroke="white"
                strokeWidth="1.5"
              />
            ))}
          </svg>

          {/* X-axis labels */}
          <div className="mt-1 flex justify-between text-xs text-gray-400">
            <span>Today</span>
            <span>
              {formatDate(
                projection.projections[Math.floor(projection.projections.length / 2)]?.date || ''
              )}
            </span>
            <span>
              {formatDate(projection.projections[projection.projections.length - 1]?.date || '')}
            </span>
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Paydays
            </div>
            <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  hasNegativeBalance ? 'bg-red-500' : 'bg-amber-500'
                )}
              />
              Lowest Point
            </div>
          </div>
        )}

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
          <div>
            <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <TrendingDown className="h-3 w-3" />
              Lowest
            </p>
            <p
              className={cn(
                'text-sm font-semibold',
                chartData.minBalance < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-900 dark:text-white'
              )}
            >
              {formatCurrency(chartData.minBalance)}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="h-3 w-3" />
              Low Date
            </p>
            <p className="text-sm font-semibold dark:text-white">
              {projection.lowestBalanceDate ? formatDate(projection.lowestBalanceDate) : '-'}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <DollarSign className="h-3 w-3" />
              End Balance
            </p>
            <p className="text-sm font-semibold dark:text-white">
              {formatCurrency(
                projection.projections[projection.projections.length - 1]?.runningBalance || 0
              )}
            </p>
          </div>
        </div>

        {/* Warning if going negative */}
        {hasNegativeBalance && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Balance projected to go negative on{' '}
              {projection.lowestBalanceDate
                ? formatDate(projection.lowestBalanceDate)
                : 'unknown date'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Mini version for embedding in other widgets
 */
export function BalanceTrajectoryMini({ className }: { className?: string }) {
  return <BalanceTrajectory className={className} days={14} showLegend={false} />
}
