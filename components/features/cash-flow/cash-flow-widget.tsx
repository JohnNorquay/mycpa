'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, ArrowRight, Wallet, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getCurrentBalance, getCurrentMonthCashFlow } from '@/app/actions/cash-flow'

interface CashFlowWidgetProps {
  className?: string
  compact?: boolean
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

export function CashFlowWidget({ className, compact = false }: CashFlowWidgetProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [balanceData, setBalanceData] = useState<{
    totalBalance: number
    availableBalance: number
  } | null>(null)
  const [cashFlowData, setCashFlowData] = useState<{
    income: number
    expenses: number
    netCashFlow: number
    projectedEndBalance: number
  } | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        const [balanceResult, cashFlowResult] = await Promise.all([
          getCurrentBalance(),
          getCurrentMonthCashFlow(),
        ])

        if (balanceResult.success) {
          setBalanceData({
            totalBalance: balanceResult.data.totalBalance,
            availableBalance: balanceResult.data.availableBalance,
          })
        }

        if (cashFlowResult.success) {
          setCashFlowData(cashFlowResult.data)
        }

        if (!balanceResult.success && !cashFlowResult.success) {
          setError('Failed to load cash flow data')
        }
      } catch {
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base">
            <Wallet className="mr-2 h-4 w-4" />
            Cash Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base">
            <Wallet className="mr-2 h-4 w-4" />
            Cash Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/accounts">Connect Accounts</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentBalance = balanceData?.totalBalance ?? 0
  const projectedEndBalance = cashFlowData?.projectedEndBalance ?? currentBalance
  const balanceChange = projectedEndBalance - currentBalance
  const isPositiveChange = balanceChange >= 0

  if (compact) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
              <p className="text-2xl font-bold dark:text-white">{formatCurrency(currentBalance)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Month End</p>
              <p
                className={cn(
                  'text-lg font-semibold',
                  isPositiveChange
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {formatCurrency(projectedEndBalance)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-base">
            <Wallet className="mr-2 h-4 w-4" />
            Cash Flow
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/cash-flow" className="flex items-center gap-1">
              View Details
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Balance */}
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
          <p className="text-3xl font-bold dark:text-white">{formatCurrency(currentBalance)}</p>
        </div>

        {/* Month-to-Date Flow */}
        {cashFlowData && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 dark:border-gray-800">
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                Income (MTD)
              </div>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(cashFlowData.income)}
              </p>
            </div>
            <div className="rounded-lg border p-3 dark:border-gray-800">
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                Expenses (MTD)
              </div>
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(cashFlowData.expenses)}
              </p>
            </div>
          </div>
        )}

        {/* Projected Month-End */}
        <div
          className={cn(
            'rounded-lg p-3',
            isPositiveChange ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
          )}
        >
          <p className="text-sm text-gray-600 dark:text-gray-300">Projected Month-End Balance</p>
          <div className="flex items-baseline gap-2">
            <p
              className={cn(
                'text-2xl font-bold',
                isPositiveChange
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              )}
            >
              {formatCurrency(projectedEndBalance)}
            </p>
            <span
              className={cn(
                'flex items-center text-sm',
                isPositiveChange
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {isPositiveChange ? (
                <TrendingUp className="mr-0.5 h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="mr-0.5 h-3.5 w-3.5" />
              )}
              {formatCurrency(Math.abs(balanceChange))}
            </span>
          </div>
        </div>

        {/* Warning for negative projection */}
        {projectedEndBalance < 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Your balance may go negative this month. Review your expenses.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact version for sidebar or smaller spaces
 */
export function CashFlowWidgetCompact({ className }: { className?: string }) {
  return <CashFlowWidget className={className} compact />
}
