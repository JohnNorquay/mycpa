'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  DollarSign,
  TrendingDown,
  Calculator,
  FileText,
  ChevronRight,
  Calendar,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  TaxProjectionDashboard,
  IncomeSummary,
  MarginalRateDisplay,
} from '@/components/features/tax-planning'
import { FEDERAL_TAX_BRACKETS_2024, type FilingStatus } from '@/lib/tax/federal-calculator'
import type { CombinedTaxResult } from '@/lib/tax/combined-tax-calculator'

// Demo data - in real app this would come from user's tax profile
const DEMO_INCOME_SOURCES = [
  { type: 'wages' as const, label: 'W-2 Wages', amount: 95000, ytdAmount: 71250 },
  { type: 'selfEmployment' as const, label: 'Freelance Income', amount: 25000, ytdAmount: 18750 },
  { type: 'dividends' as const, label: 'Qualified Dividends', amount: 2500, ytdAmount: 1875 },
  {
    type: 'capitalGains' as const,
    label: 'Long-term Capital Gains',
    amount: 5000,
    ytdAmount: 3750,
  },
]

const DEMO_WITHHOLDING = {
  federal: 15500,
  state: 4200,
}

// Generate demo tax result
function getDemoTaxResult(): CombinedTaxResult {
  const totalGrossIncome = 127500
  const federalAGI = 122500
  const wisconsinAGI = 122500

  return {
    totalGrossIncome,
    federalAGI,
    wisconsinAGI,
    federal: {
      taxableIncome: 108800,
      ordinaryIncomeTax: 16842,
      selfEmploymentTax: 3533,
      capitalGainsTax: 375,
      totalTaxBeforeCredits: 20750,
      credits: {
        childTaxCredit: 4000,
        eitc: 0,
        childCareCredit: 0,
        totalCredits: 4000,
      },
      totalTaxLiability: 16750,
      effectiveRate: 0.131,
      marginalRate: 0.22,
    },
    wisconsin: {
      taxableIncome: 108500,
      incomeTax: 6235,
      credits: {
        schoolPropertyTax: 0,
        marriedCouple: 480,
        workingFamilies: 0,
        totalCredits: 480,
      },
      totalTaxLiability: 5755,
      effectiveRate: 0.045,
      marginalRate: 0.0627,
    },
    combined: {
      totalTaxLiability: 22505,
      effectiveRate: 0.176,
      combinedMarginalRate: 0.2827,
    },
  }
}

function formatYear(year: number): string {
  return year.toString()
}

const QUICK_LINKS = [
  {
    title: 'Income',
    description: 'Add W-2, 1099, and other income',
    href: '/tax-center/income',
    icon: DollarSign,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    title: 'Deductions',
    description: 'Track tax-deductible expenses',
    href: '/tax-center/deductions',
    icon: TrendingDown,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  {
    title: 'Estimated Tax',
    description: 'Quarterly payment calculator',
    href: '/tax-center/estimated-tax',
    icon: Calculator,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    title: 'Documents',
    description: 'Upload tax documents',
    href: '/documents',
    icon: FileText,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
]

export default function TaxCenterPage() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const availableYears = [currentYear, currentYear - 1]

  const taxResult = useMemo(() => getDemoTaxResult(), [])

  // Convert federal brackets to the format expected by MarginalRateDisplay
  const federalBrackets = useMemo(() => {
    const filingStatus: FilingStatus = 'married_filing_jointly'
    return FEDERAL_TAX_BRACKETS_2024[filingStatus].map((bracket) => ({
      rate: bracket.rate,
      min: bracket.minIncome,
      max: bracket.maxIncome,
    }))
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Tax Center</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Tax planning, estimates, and deduction tracking
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <Label htmlFor="year-select" className="text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="mr-1 inline-block h-4 w-4" />
            Tax Year:
          </Label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {formatYear(year)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-900/20">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
        <p className="text-blue-700 dark:text-blue-400">
          This is a preview with sample data. Add your income and deductions to see accurate
          projections.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href}>
              <Card className="h-full transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/50">
                <CardContent className="flex items-center gap-3 p-4">
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${link.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${link.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium dark:text-white">{link.title}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {link.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Main Dashboard */}
      <TaxProjectionDashboard taxResult={taxResult} withholding={DEMO_WITHHOLDING} />

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Income Summary */}
        <IncomeSummary incomeSources={DEMO_INCOME_SOURCES} showProjection />

        {/* Marginal Rate Display */}
        <MarginalRateDisplay
          currentIncome={taxResult.totalGrossIncome}
          taxableIncome={taxResult.federal.taxableIncome}
          federalMarginalRate={taxResult.federal.marginalRate}
          stateMarginalRate={taxResult.wisconsin.marginalRate}
          federalBrackets={federalBrackets}
        />
      </div>

      {/* Tax Planning Tips */}
      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            Tax Planning Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-3 dark:border-gray-800">
              <p className="font-medium dark:text-white">Maximize Retirement Contributions</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                You can contribute up to $23,000 to a 401(k) in 2024 to reduce taxable income.
              </p>
            </div>
            <div className="rounded-lg border p-3 dark:border-gray-800">
              <p className="font-medium dark:text-white">Track Business Expenses</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Self-employment income can be offset by legitimate business expenses.
              </p>
            </div>
            <div className="rounded-lg border p-3 dark:border-gray-800">
              <p className="font-medium dark:text-white">Consider Estimated Payments</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                With 1099 income, quarterly estimated payments help avoid penalties.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
