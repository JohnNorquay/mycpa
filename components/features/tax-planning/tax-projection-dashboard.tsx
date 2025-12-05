'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CombinedTaxResult } from '@/lib/tax/combined-tax-calculator'

interface TaxProjectionDashboardProps {
  taxResult: CombinedTaxResult
  withholding?: {
    federal: number
    state: number
  }
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

export function TaxProjectionDashboard({
  taxResult,
  withholding,
  className,
}: TaxProjectionDashboardProps) {
  const refundOrDue = useMemo(() => {
    if (!withholding) return null
    const totalWithholding = withholding.federal + withholding.state
    const difference = totalWithholding - taxResult.combined.totalTaxLiability
    return {
      isRefund: difference > 0,
      amount: Math.abs(difference),
      federalDifference: withholding.federal - taxResult.federal.totalTaxLiability,
      stateDifference: withholding.state - taxResult.wisconsin.totalTaxLiability,
    }
  }, [taxResult, withholding])

  return (
    <div className={cn('space-y-6', className)}>
      {/* Refund/Due Summary */}
      {refundOrDue && (
        <Card
          className={cn(
            refundOrDue.isRefund
              ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20'
              : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Estimated {refundOrDue.isRefund ? 'Refund' : 'Amount Due'}
                </p>
                <p
                  className={cn(
                    'text-4xl font-bold',
                    refundOrDue.isRefund
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-red-700 dark:text-red-400'
                  )}
                >
                  {formatCurrency(refundOrDue.amount)}
                </p>
              </div>
              <div
                className={cn(
                  'rounded-full p-4',
                  refundOrDue.isRefund
                    ? 'bg-green-100 dark:bg-green-900/50'
                    : 'bg-red-100 dark:bg-red-900/50'
                )}
              >
                {refundOrDue.isRefund ? (
                  <CheckCircle className={cn('h-10 w-10', 'text-green-600 dark:text-green-400')} />
                ) : (
                  <AlertTriangle className={cn('h-10 w-10', 'text-red-600 dark:text-red-400')} />
                )}
              </div>
            </div>
            {!refundOrDue.isRefund && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                Consider increasing withholding or making estimated payments
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tax Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Federal Tax Card */}
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Federal Tax</span>
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">IRS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(taxResult.federal.totalTaxLiability)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Effective rate: {formatPercent(taxResult.federal.effectiveRate)}
              </p>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Income Tax</span>
                <span className="dark:text-white">
                  {formatCurrency(taxResult.federal.ordinaryIncomeTax)}
                </span>
              </div>
              {taxResult.federal.selfEmploymentTax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">SE Tax</span>
                  <span className="dark:text-white">
                    {formatCurrency(taxResult.federal.selfEmploymentTax)}
                  </span>
                </div>
              )}
              {taxResult.federal.capitalGainsTax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Cap Gains</span>
                  <span className="dark:text-white">
                    {formatCurrency(taxResult.federal.capitalGainsTax)}
                  </span>
                </div>
              )}
              {taxResult.federal.credits.totalCredits > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Credits</span>
                  <span>-{formatCurrency(taxResult.federal.credits.totalCredits)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Wisconsin Tax Card */}
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Wisconsin Tax</span>
              <span className="text-xs font-normal text-gray-500 dark:text-gray-400">DOR</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(taxResult.wisconsin.totalTaxLiability)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Effective rate: {formatPercent(taxResult.wisconsin.effectiveRate)}
              </p>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Income Tax</span>
                <span className="dark:text-white">
                  {formatCurrency(taxResult.wisconsin.incomeTax)}
                </span>
              </div>
              {taxResult.wisconsin.credits.totalCredits > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Credits</span>
                  <span>-{formatCurrency(taxResult.wisconsin.credits.totalCredits)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Combined Total Card */}
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <span>Combined Total</span>
              <Percent className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(taxResult.combined.totalTaxLiability)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Effective rate: {formatPercent(taxResult.combined.effectiveRate)}
              </p>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Gross Income</span>
                <span className="dark:text-white">
                  {formatCurrency(taxResult.totalGrossIncome)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Federal AGI</span>
                <span className="dark:text-white">{formatCurrency(taxResult.federalAGI)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Marginal Rate</span>
                <span className="dark:text-white">
                  {formatPercent(taxResult.combined.combinedMarginalRate)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withholding Details (if available) */}
      {withholding && refundOrDue && (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Withholding Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Withheld</p>
                <p className="text-lg font-semibold dark:text-white">
                  {formatCurrency(withholding.federal + withholding.state)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Tax Due</p>
                <p className="text-lg font-semibold dark:text-white">
                  {formatCurrency(taxResult.combined.totalTaxLiability)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {refundOrDue.isRefund ? 'Refund' : 'Amount Due'}
                </p>
                <p
                  className={cn(
                    'text-lg font-semibold',
                    refundOrDue.isRefund
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {formatCurrency(refundOrDue.amount)}
                </p>
              </div>
            </div>

            {/* Federal/State Breakdown */}
            <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2 dark:border-gray-800">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                <div>
                  <p className="text-sm font-medium dark:text-white">Federal</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Withheld: {formatCurrency(withholding.federal)}
                  </p>
                </div>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    refundOrDue.federalDifference > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {refundOrDue.federalDifference > 0 ? '+' : ''}
                  {formatCurrency(refundOrDue.federalDifference)}
                </p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                <div>
                  <p className="text-sm font-medium dark:text-white">Wisconsin</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Withheld: {formatCurrency(withholding.state)}
                  </p>
                </div>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    refundOrDue.stateDifference > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {refundOrDue.stateDifference > 0 ? '+' : ''}
                  {formatCurrency(refundOrDue.stateDifference)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/tax-center/income" className="gap-1">
            <DollarSign className="h-3 w-3" />
            View Income
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/tax-center/deductions" className="gap-1">
            <TrendingDown className="h-3 w-3" />
            Deductions
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/tax-center/estimated-tax" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Estimated Tax
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
