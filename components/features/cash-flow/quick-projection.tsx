'use client'

import { useState, useEffect } from 'react'
import { Loader2, Calendar, Target, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getBalanceOnDate } from '@/app/actions/cash-flow'
import type { BalanceProjection } from '@/lib/cash-flow/projection-engine'

interface QuickProjectionProps {
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

function getBalanceColorClass(amount: number): string {
  if (amount < 0) return 'text-red-600 dark:text-red-400'
  if (amount < 500) return 'text-amber-600 dark:text-amber-400'
  return 'text-green-600 dark:text-green-400'
}

function getBgColorClass(amount: number): string {
  if (amount < 0) return 'bg-red-50 dark:bg-red-900/20'
  if (amount < 500) return 'bg-amber-50 dark:bg-amber-900/20'
  return 'bg-green-50 dark:bg-green-900/20'
}

export function QuickProjection({ className }: QuickProjectionProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [mid15Projection, setMid15Projection] = useState<BalanceProjection | null>(null)
  const [monthEndProjection, setMonthEndProjection] = useState<BalanceProjection | null>(null)

  useEffect(() => {
    async function loadProjections() {
      setIsLoading(true)

      try {
        const today = new Date()
        const currentYear = today.getFullYear()
        const currentMonth = today.getMonth()

        // Calculate the 15th of this month or next month
        let mid15Date: Date
        if (today.getDate() <= 15) {
          mid15Date = new Date(currentYear, currentMonth, 15)
        } else {
          mid15Date = new Date(currentYear, currentMonth + 1, 15)
        }

        // Calculate month end
        const monthEndDate = new Date(currentYear, currentMonth + 1, 0)

        // If we're past month end, use next month
        if (today >= monthEndDate) {
          monthEndDate.setMonth(monthEndDate.getMonth() + 1)
        }

        const mid15Str = mid15Date.toISOString().split('T')[0] || ''
        const monthEndStr = monthEndDate.toISOString().split('T')[0] || ''

        const [mid15Result, monthEndResult] = await Promise.all([
          getBalanceOnDate(mid15Str),
          getBalanceOnDate(monthEndStr),
        ])

        if (mid15Result.success) {
          setMid15Projection(mid15Result.data)
        }

        if (monthEndResult.success) {
          setMonthEndProjection(monthEndResult.data)
        }
      } catch {
        // Silently handle errors
      } finally {
        setIsLoading(false)
      }
    }

    loadProjections()
  }, [])

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-4', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* By the 15th */}
      {mid15Projection && (
        <div
          className={cn(
            'flex items-center justify-between rounded-lg p-3',
            getBgColorClass(mid15Projection.projectedBalance)
          )}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">By the 15th</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-lg font-bold',
                getBalanceColorClass(mid15Projection.projectedBalance)
              )}
            >
              {formatCurrency(mid15Projection.projectedBalance)}
            </span>
            {mid15Projection.projectedBalance !== mid15Projection.currentBalance &&
              (mid15Projection.projectedBalance > mid15Projection.currentBalance ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ))}
          </div>
        </div>
      )}

      {/* By month-end */}
      {monthEndProjection && (
        <div
          className={cn(
            'flex items-center justify-between rounded-lg p-3',
            getBgColorClass(monthEndProjection.projectedBalance)
          )}
        >
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">By month-end</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-lg font-bold',
                getBalanceColorClass(monthEndProjection.projectedBalance)
              )}
            >
              {formatCurrency(monthEndProjection.projectedBalance)}
            </span>
            {monthEndProjection.projectedBalance !== monthEndProjection.currentBalance &&
              (monthEndProjection.projectedBalance > monthEndProjection.currentBalance ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ))}
          </div>
        </div>
      )}

      {/* Confidence indicator */}
      {monthEndProjection && (
        <div className="flex items-center justify-end gap-1.5 text-xs text-gray-400">
          <span
            className={cn(
              'inline-block h-2 w-2 rounded-full',
              monthEndProjection.confidence === 'high'
                ? 'bg-green-500'
                : monthEndProjection.confidence === 'medium'
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            )}
          />
          <span className="capitalize">{monthEndProjection.confidence} confidence</span>
        </div>
      )}
    </div>
  )
}
