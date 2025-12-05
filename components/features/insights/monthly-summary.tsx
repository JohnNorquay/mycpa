'use client'

import { useMemo } from 'react'
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  Receipt,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Bot,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FinancialSnapshot {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  savingsRate: number
  topExpenseCategory: {
    name: string
    amount: number
  }
  largestTransaction: {
    description: string
    amount: number
    type: 'income' | 'expense'
  }
  transactionCount: number
}

interface ActionItem {
  id: string
  type: 'tax' | 'savings' | 'spending' | 'debt' | 'reminder'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  dueDate?: string
}

interface MonthlySummaryData {
  id: string
  month: string // Format: YYYY-MM
  generatedAt: string
  snapshot: FinancialSnapshot
  aiNarrative: string
  actionItems: ActionItem[]
  previousMonth?: {
    netCashFlow: number
    savingsRate: number
  }
}

interface MonthlySummaryProps {
  summary: MonthlySummaryData
  onPreviousMonth?: () => void
  onNextMonth?: () => void
  hasPreviousMonth?: boolean
  hasNextMonth?: boolean
  className?: string
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(value))
}

function formatMonth(monthString: string): string {
  const [year, month] = monthString.split('-')
  if (!year || !month) return monthString
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

const ACTION_TYPE_CONFIG = {
  tax: {
    icon: Receipt,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  savings: {
    icon: PiggyBank,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  spending: {
    icon: DollarSign,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  debt: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  reminder: {
    icon: Calendar,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
}

const PRIORITY_CONFIG = {
  high: {
    badge: 'High Priority',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  medium: {
    badge: 'Medium',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  low: {
    badge: 'Low',
    badgeClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  },
}

export function MonthlySummary({
  summary,
  onPreviousMonth,
  onNextMonth,
  hasPreviousMonth = false,
  hasNextMonth = false,
  className,
}: MonthlySummaryProps) {
  const { snapshot, aiNarrative, actionItems, previousMonth } = summary

  const cashFlowChange = useMemo(() => {
    if (!previousMonth) return null
    return (
      ((snapshot.netCashFlow - previousMonth.netCashFlow) /
        Math.abs(previousMonth.netCashFlow || 1)) *
      100
    )
  }, [snapshot.netCashFlow, previousMonth])

  const savingsRateChange = useMemo(() => {
    if (!previousMonth) return null
    return snapshot.savingsRate - previousMonth.savingsRate
  }, [snapshot.savingsRate, previousMonth])

  const sortedActionItems = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return [...actionItems].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }, [actionItems])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">{formatMonth(summary.month)}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Generated {new Date(summary.generatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousMonth}
            disabled={!hasPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onNextMonth} disabled={!hasNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Financial Snapshot Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(snapshot.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(snapshot.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">Net Cash Flow</CardTitle>
            {snapshot.netCashFlow >= 0 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                snapshot.netCashFlow >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {snapshot.netCashFlow >= 0 ? '+' : '-'}
              {formatCurrency(snapshot.netCashFlow)}
            </div>
            {cashFlowChange !== null && (
              <p
                className={cn(
                  'mt-1 text-xs',
                  cashFlowChange >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {formatPercent(cashFlowChange)} vs last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">Savings Rate</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                snapshot.savingsRate >= 20
                  ? 'text-green-600 dark:text-green-400'
                  : snapshot.savingsRate >= 10
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
              )}
            >
              {snapshot.savingsRate.toFixed(1)}%
            </div>
            {savingsRateChange !== null && (
              <p
                className={cn(
                  'mt-1 text-xs',
                  savingsRateChange >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                )}
              >
                {formatPercent(savingsRateChange)} vs last month
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Narrative */}
      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <CardTitle className="dark:text-white">Monthly Overview</CardTitle>
          </div>
          <CardDescription className="dark:text-gray-400">
            AI-generated summary of your financial activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {aiNarrative}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Highlights */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">
              Top Expense Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <BarChart3 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-medium dark:text-white">{snapshot.topExpenseCategory.name}</p>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {formatCurrency(snapshot.topExpenseCategory.amount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">
              Largest Transaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  snapshot.largestTransaction.type === 'income'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-red-100 dark:bg-red-900/30'
                )}
              >
                <DollarSign
                  className={cn(
                    'h-5 w-5',
                    snapshot.largestTransaction.type === 'income'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                />
              </div>
              <div>
                <p className="font-medium dark:text-white truncate max-w-[150px]">
                  {snapshot.largestTransaction.description}
                </p>
                <p
                  className={cn(
                    'text-sm',
                    snapshot.largestTransaction.type === 'income'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {snapshot.largestTransaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(snapshot.largestTransaction.amount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">
              Transaction Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold dark:text-white">{snapshot.transactionCount}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      {actionItems.length > 0 && (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Action Items</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Recommended actions based on this month&apos;s activity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedActionItems.map((item) => {
              const config = ACTION_TYPE_CONFIG[item.type]
              const priorityConfig = PRIORITY_CONFIG[item.priority]
              const Icon = config.icon

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-4',
                    item.priority === 'high'
                      ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20'
                      : 'dark:border-gray-800'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                      config.bgColor
                    )}
                  >
                    <Icon className={cn('h-5 w-5', config.color)} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium dark:text-white">{item.title}</h4>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-xs font-medium',
                          priorityConfig.badgeClass
                        )}
                      >
                        {priorityConfig.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                    {item.dueDate && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty State for Action Items */}
      {actionItems.length === 0 && (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mt-3 font-medium dark:text-white">All Caught Up!</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No action items for this month
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Compact version for dashboard widgets
export function MonthlySummaryCompact({
  summary,
  className,
}: {
  summary: MonthlySummaryData
  className?: string
}) {
  const { snapshot, aiNarrative } = summary

  // Truncate narrative for compact view
  const truncatedNarrative = useMemo(() => {
    if (aiNarrative.length <= 200) return aiNarrative
    return aiNarrative.substring(0, 197) + '...'
  }, [aiNarrative])

  return (
    <Card className={cn('dark:border-gray-800 dark:bg-gray-900', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base dark:text-white">{formatMonth(summary.month)}</CardTitle>
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              snapshot.netCashFlow >= 0
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}
          >
            {snapshot.netCashFlow >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {snapshot.netCashFlow >= 0 ? '+' : '-'}
            {formatCurrency(snapshot.netCashFlow)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400">{truncatedNarrative}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Income:</span>{' '}
            <span className="font-medium text-green-600 dark:text-green-400">
              {formatCurrency(snapshot.totalIncome)}
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Expenses:</span>{' '}
            <span className="font-medium text-red-600 dark:text-red-400">
              {formatCurrency(snapshot.totalExpenses)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
