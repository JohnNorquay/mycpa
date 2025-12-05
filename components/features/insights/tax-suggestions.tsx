'use client'

import { useMemo } from 'react'
import {
  DollarSign,
  PiggyBank,
  Receipt,
  FileText,
  AlertTriangle,
  ChevronRight,
  Lightbulb,
  Calendar,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RetirementOpportunity {
  type: 'traditional_ira' | 'roth_ira' | '401k' | 'sep_ira'
  maxContribution: number
  currentContribution: number
  remainingSpace: number
  taxSavings: number
  recommendation: string
}

interface DeductionBunchingAnalysis {
  currentYearItemized: number
  standardDeduction: number
  shouldItemize: boolean
  bunchingOpportunity: number
  bunchingRecommendation: string
}

interface WithholdingAdjustment {
  currentWithholding: number
  recommendedWithholding: number
  adjustmentNeeded: number
  w4Recommendation: string
}

interface TaxSuggestion {
  id: string
  type: 'retirement' | 'deduction' | 'withholding' | 'deadline' | 'debt_strategy'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  potentialSavings?: number
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

interface TaxSuggestionsProps {
  suggestions: TaxSuggestion[]
  retirementOpportunities?: RetirementOpportunity[]
  deductionBunching?: DeductionBunchingAnalysis
  withholdingAdjustment?: WithholdingAdjustment | null
  totalPotentialSavings?: number
  className?: string
}

const TYPE_CONFIG = {
  retirement: {
    icon: PiggyBank,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  deduction: {
    icon: Receipt,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  withholding: {
    icon: FileText,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  deadline: {
    icon: Calendar,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  debt_strategy: {
    icon: TrendingUp,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function getRetirementTypeLabel(type: string): string {
  switch (type) {
    case 'traditional_ira':
      return 'Traditional IRA'
    case 'roth_ira':
      return 'Roth IRA'
    case '401k':
      return '401(k)'
    case 'sep_ira':
      return 'SEP IRA'
    default:
      return type
  }
}

export function TaxSuggestions({
  suggestions,
  retirementOpportunities = [],
  deductionBunching,
  withholdingAdjustment,
  totalPotentialSavings = 0,
  className,
}: TaxSuggestionsProps) {
  const sortedSuggestions = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return [...suggestions].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }, [suggestions])

  const highPrioritySuggestions = useMemo(
    () => sortedSuggestions.filter((s) => s.priority === 'high'),
    [sortedSuggestions]
  )

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-900/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
              <Lightbulb className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold dark:text-white">Tax Optimization Summary</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Based on your financial data, we&apos;ve identified potential opportunities to
                reduce your tax liability.
              </p>
              {totalPotentialSavings > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totalPotentialSavings)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    potential tax savings
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* High Priority Alerts */}
      {highPrioritySuggestions.length > 0 && (
        <Card className="border-red-200 dark:border-red-900/50 dark:bg-gray-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle className="text-red-600 dark:text-red-400">Action Required</CardTitle>
            </div>
            <CardDescription className="dark:text-gray-400">
              These items need your attention soon
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {highPrioritySuggestions.map((suggestion) => {
              const config = TYPE_CONFIG[suggestion.type]
              const Icon = config.icon

              return (
                <div
                  key={suggestion.id}
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20"
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
                    <h4 className="font-medium dark:text-white">{suggestion.title}</h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {suggestion.description}
                    </p>
                    {suggestion.potentialSavings && suggestion.potentialSavings > 0 && (
                      <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                        Potential savings: {formatCurrency(suggestion.potentialSavings)}
                      </p>
                    )}
                    {suggestion.action && (
                      <Button size="sm" className="mt-3" asChild={!!suggestion.action.href}>
                        {suggestion.action.href ? (
                          <a href={suggestion.action.href}>
                            {suggestion.action.label}
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </a>
                        ) : (
                          <span onClick={suggestion.action.onClick}>
                            {suggestion.action.label}
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Retirement Opportunities */}
      {retirementOpportunities.length > 0 && (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-blue-500" />
              <CardTitle className="dark:text-white">
                Retirement Contribution Opportunities
              </CardTitle>
            </div>
            <CardDescription className="dark:text-gray-400">
              Maximize tax-advantaged retirement accounts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {retirementOpportunities.map((opportunity) => (
              <div key={opportunity.type} className="rounded-lg border p-4 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium dark:text-white">
                    {getRetirementTypeLabel(opportunity.type)}
                  </h4>
                  {opportunity.taxSavings > 0 && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Save {formatCurrency(opportunity.taxSavings)}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Contributed: {formatCurrency(opportunity.currentContribution)}</span>
                    <span>Limit: {formatCurrency(opportunity.maxContribution)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min(
                          (opportunity.currentContribution / opportunity.maxContribution) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(opportunity.remainingSpace)} remaining
                  </p>
                </div>

                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  {opportunity.recommendation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Deduction Analysis */}
      {deductionBunching && (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-500" />
              <CardTitle className="dark:text-white">Deduction Analysis</CardTitle>
            </div>
            <CardDescription className="dark:text-gray-400">
              Standard vs. itemized deduction comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Your Itemized Deductions
                    </span>
                    {!deductionBunching.shouldItemize && (
                      <span className="text-xs text-gray-400">Not recommended</span>
                    )}
                  </div>
                  <p className="mt-1 text-2xl font-bold dark:text-white">
                    {formatCurrency(deductionBunching.currentYearItemized)}
                  </p>
                </div>
                <div className="rounded-lg border p-4 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Standard Deduction
                    </span>
                    {deductionBunching.shouldItemize && (
                      <span className="text-xs text-gray-400">Not recommended</span>
                    )}
                  </div>
                  <p className="mt-1 text-2xl font-bold dark:text-white">
                    {formatCurrency(deductionBunching.standardDeduction)}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  'flex items-start gap-3 rounded-lg p-4',
                  deductionBunching.shouldItemize
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : deductionBunching.bunchingOpportunity > 0
                      ? 'bg-amber-50 dark:bg-amber-900/20'
                      : 'bg-gray-50 dark:bg-gray-800'
                )}
              >
                {deductionBunching.shouldItemize ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                ) : deductionBunching.bunchingOpportunity > 0 ? (
                  <Lightbulb className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-gray-400" />
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {deductionBunching.bunchingRecommendation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withholding Adjustment */}
      {withholdingAdjustment && (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              <CardTitle className="dark:text-white">W-4 Withholding Review</CardTitle>
            </div>
            <CardDescription className="dark:text-gray-400">
              Ensure you&apos;re withholding the right amount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4 dark:border-gray-800">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Year-to-Date Withholding
                  </span>
                  <p className="mt-1 text-2xl font-bold dark:text-white">
                    {formatCurrency(withholdingAdjustment.currentWithholding)}
                  </p>
                </div>
                <div className="rounded-lg border p-4 dark:border-gray-800">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Target Withholding
                  </span>
                  <p className="mt-1 text-2xl font-bold dark:text-white">
                    {formatCurrency(withholdingAdjustment.recommendedWithholding)}
                  </p>
                </div>
              </div>

              <div
                className={cn(
                  'flex items-start gap-3 rounded-lg p-4',
                  withholdingAdjustment.adjustmentNeeded > 100
                    ? 'bg-amber-50 dark:bg-amber-900/20'
                    : withholdingAdjustment.adjustmentNeeded < -100
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'bg-green-50 dark:bg-green-900/20'
                )}
              >
                {withholdingAdjustment.adjustmentNeeded > 100 ? (
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                ) : withholdingAdjustment.adjustmentNeeded < -100 ? (
                  <Lightbulb className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {withholdingAdjustment.w4Recommendation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Suggestions */}
      {sortedSuggestions.filter((s) => s.priority !== 'high').length > 0 && (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">All Recommendations</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Additional ways to optimize your taxes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedSuggestions
              .filter((s) => s.priority !== 'high')
              .map((suggestion) => {
                const config = TYPE_CONFIG[suggestion.type]
                const priorityConfig = PRIORITY_CONFIG[suggestion.priority]
                const Icon = config.icon

                return (
                  <div
                    key={suggestion.id}
                    className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
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
                        <h4 className="font-medium dark:text-white">{suggestion.title}</h4>
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
                        {suggestion.description}
                      </p>
                      {suggestion.potentialSavings && suggestion.potentialSavings > 0 && (
                        <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">
                          Potential savings: {formatCurrency(suggestion.potentialSavings)}
                        </p>
                      )}
                      {suggestion.action && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 -ml-2"
                          asChild={!!suggestion.action.href}
                        >
                          {suggestion.action.href ? (
                            <a href={suggestion.action.href}>
                              {suggestion.action.label}
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </a>
                          ) : (
                            <span onClick={suggestion.action.onClick}>
                              {suggestion.action.label}
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </span>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {suggestions.length === 0 &&
        retirementOpportunities.length === 0 &&
        !deductionBunching &&
        !withholdingAdjustment && (
          <Card className="dark:border-gray-800 dark:bg-gray-900">
            <CardContent className="py-12">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Lightbulb className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium dark:text-white">No Suggestions Yet</h3>
                <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                  Complete your profile and connect your bank accounts to receive personalized tax
                  optimization suggestions.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  )
}
