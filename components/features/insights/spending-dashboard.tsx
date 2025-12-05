'use client'

import { useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  DollarSign,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CategoryBreakdown {
  category: string
  total: number
  count: number
  percentage: number
  averageTransaction: number
}

interface MonthlyComparison {
  category: string
  currentMonth: number
  previousMonth: number
  change: number
  percentageChange: number
}

interface Trend {
  category: string
  trend: 'increasing' | 'decreasing' | 'stable'
  percentageChange: number
  description: string
}

interface Anomaly {
  id: string
  type: 'unusual_amount' | 'new_merchant_large' | 'new_subscription' | 'missing_recurring'
  severity: 'high' | 'medium' | 'low'
  description: string
  amount?: number
  date?: string
}

interface SpendingDashboardProps {
  totalSpending: number
  totalIncome: number
  savingsRate: number
  categoryBreakdown: CategoryBreakdown[]
  monthlyComparison: MonthlyComparison[]
  trends: Trend[]
  anomalies: Anomaly[]
  className?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': 'bg-orange-500',
  Transportation: 'bg-blue-500',
  Shopping: 'bg-pink-500',
  Entertainment: 'bg-purple-500',
  'Bills & Utilities': 'bg-yellow-500',
  Healthcare: 'bg-red-500',
  Travel: 'bg-teal-500',
  Education: 'bg-indigo-500',
  Personal: 'bg-cyan-500',
  Uncategorized: 'bg-gray-500',
}

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || 'bg-gray-500'
}

export function SpendingDashboard({
  totalSpending,
  totalIncome,
  savingsRate,
  categoryBreakdown,
  monthlyComparison,
  trends,
  anomalies,
  className,
}: SpendingDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const topCategories = useMemo(() => categoryBreakdown.slice(0, 6), [categoryBreakdown])

  const highPriorityAnomalies = useMemo(
    () => anomalies.filter((a) => a.severity === 'high' || a.severity === 'medium').slice(0, 5),
    [anomalies]
  )

  const significantTrends = useMemo(() => trends.slice(0, 4), [trends])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">
              Monthly Spending
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalSpending)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">This month</p>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">Monthly Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">This month</p>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">Savings Rate</CardTitle>
            <PiggyBank className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                savingsRate >= 20
                  ? 'text-green-600 dark:text-green-400'
                  : savingsRate >= 10
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
              )}
            >
              {savingsRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {savingsRate >= 20 ? 'Great!' : savingsRate >= 10 ? 'Good' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-gray-400">Net Cash Flow</CardTitle>
            {totalIncome - totalSpending >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-2xl font-bold',
                totalIncome - totalSpending >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              )}
            >
              {formatCurrency(totalIncome - totalSpending)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">Income - Expenses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category Breakdown */}
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Spending by Category</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Top categories this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topCategories.length > 0 ? (
              <div className="space-y-4">
                {topCategories.map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn('h-3 w-3 rounded-full', getCategoryColor(cat.category))}
                        />
                        <span className="dark:text-white">{cat.category}</span>
                      </div>
                      <span className="font-medium dark:text-white">
                        {formatCurrency(cat.total)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={cn('h-full rounded-full', getCategoryColor(cat.category))}
                        style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{cat.count} transactions</span>
                      <span>{cat.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-gray-500 dark:text-gray-400">
                No spending data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Comparison */}
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Month-over-Month</CardTitle>
            <CardDescription className="dark:text-gray-400">Compared to last month</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyComparison.length > 0 ? (
              <div className="space-y-3">
                {monthlyComparison.slice(0, 6).map((comp) => (
                  <div
                    key={comp.category}
                    className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn('h-2 w-2 rounded-full', getCategoryColor(comp.category))}
                      />
                      <span className="text-sm dark:text-white">{comp.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatCurrency(comp.currentMonth)}
                      </span>
                      <div
                        className={cn(
                          'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                          comp.change > 0
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : comp.change < 0
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        )}
                      >
                        {comp.change > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : comp.change < 0 ? (
                          <TrendingDown className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {formatPercent(comp.percentageChange)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-gray-500 dark:text-gray-400">
                Not enough data for comparison
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trends */}
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Spending Trends</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Significant changes in spending
            </CardDescription>
          </CardHeader>
          <CardContent>
            {significantTrends.length > 0 ? (
              <div className="space-y-3">
                {significantTrends.map((trend, index) => (
                  <div
                    key={`${trend.category}-${index}`}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3',
                      trend.trend === 'increasing'
                        ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20'
                        : 'border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                        trend.trend === 'increasing'
                          ? 'bg-red-100 dark:bg-red-900/50'
                          : 'bg-green-100 dark:bg-green-900/50'
                      )}
                    >
                      {trend.trend === 'increasing' ? (
                        <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium dark:text-white">{trend.category}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {trend.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-gray-500 dark:text-gray-400">
                No significant trends detected
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anomalies */}
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Alerts
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              Unusual activity detected
            </CardDescription>
          </CardHeader>
          <CardContent>
            {highPriorityAnomalies.length > 0 ? (
              <div className="space-y-3">
                {highPriorityAnomalies.map((anomaly) => (
                  <div
                    key={anomaly.id}
                    className={cn(
                      'rounded-lg border p-3',
                      anomaly.severity === 'high'
                        ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20'
                        : 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
                          anomaly.severity === 'high'
                            ? 'bg-red-100 dark:bg-red-900/50'
                            : 'bg-amber-100 dark:bg-amber-900/50'
                        )}
                      >
                        <AlertCircle
                          className={cn(
                            'h-3 w-3',
                            anomaly.severity === 'high'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm dark:text-white">{anomaly.description}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={cn(
                              'rounded px-1.5 py-0.5 text-xs font-medium',
                              anomaly.severity === 'high'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                            )}
                          >
                            {anomaly.severity}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {anomaly.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-gray-500 dark:text-gray-400">
                No alerts at this time
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
