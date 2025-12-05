'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  AlertTriangle,
  DollarSign,
  Calendar,
  Filter,
  ArrowUpDown,
  Search,
  Loader2,
  Edit,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getTaxDebts, deleteTaxDebt, type TaxDebt } from '@/app/actions/tax-debt'

type SortField = 'tax_year' | 'current_balance' | 'collection_status'
type SortDirection = 'asc' | 'desc'

const DEBT_TYPE_LABELS: Record<string, string> = {
  income_tax: 'Income Tax',
  penalty_failure_to_file: 'Failure to File Penalty',
  penalty_failure_to_pay: 'Failure to Pay Penalty',
  interest: 'Interest',
  other: 'Other',
}

const COLLECTION_STATUS_CONFIG: Record<string, { label: string; color: string; priority: number }> =
  {
    normal: {
      label: 'Normal',
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
      priority: 0,
    },
    notice_sent: {
      label: 'Notice Sent',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      priority: 1,
    },
    lien_filed: {
      label: 'Lien Filed',
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      priority: 2,
    },
    levy_pending: {
      label: 'Levy Pending',
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      priority: 3,
    },
    levy_active: {
      label: 'Levy Active',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      priority: 4,
    },
    garnishment: {
      label: 'Wage Garnishment',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      priority: 4,
    },
    currently_not_collectible: {
      label: 'Currently Not Collectible',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      priority: 5,
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

export default function TaxDebtListPage() {
  const [debts, setDebts] = useState<TaxDebt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('tax_year')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadDebts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await getTaxDebts()
    if (result.success) {
      setDebts(result.data)
    } else {
      setError(result.error)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    loadDebts().then(() => {
      if (!mounted) return
    })
    return () => {
      mounted = false
    }
  }, [loadDebts])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax debt? This action cannot be undone.')) {
      return
    }

    setDeletingId(id)
    const result = await deleteTaxDebt(id)
    if (result.success) {
      setDebts((prev) => prev.filter((d) => d.id !== id))
    } else {
      alert(result.error)
    }
    setDeletingId(null)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Filter and sort debts
  const filteredDebts = debts
    .filter((debt) => {
      if (filterStatus && debt.collection_status !== filterStatus) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const debtTypeLabel = DEBT_TYPE_LABELS[debt.debt_type || '']?.toLowerCase() || ''
        return (
          debt.tax_year.toString().includes(query) ||
          debtTypeLabel.includes(query) ||
          formatCurrency(debt.current_balance).toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'tax_year':
          comparison = a.tax_year - b.tax_year
          break
        case 'current_balance':
          comparison = a.current_balance - b.current_balance
          break
        case 'collection_status':
          const aPriority = COLLECTION_STATUS_CONFIG[a.collection_status]?.priority ?? 0
          const bPriority = COLLECTION_STATUS_CONFIG[b.collection_status]?.priority ?? 0
          comparison = aPriority - bPriority
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

  // Calculate totals
  const totalDebt = debts.reduce((sum, d) => sum + d.current_balance, 0)
  const totalOriginal = debts.reduce((sum, d) => sum + d.original_amount, 0)
  const totalInterestPenalties = totalDebt - totalOriginal

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">Tax Debts</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track and manage your IRS tax obligations
          </p>
        </div>
        <Button asChild>
          <Link href="/tax-debt/debts/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Tax Debt
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Debt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(totalDebt)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{debts.length} tax year(s)</p>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Original Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold dark:text-white">{formatCurrency(totalOriginal)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Before interest/penalties</p>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Interest & Penalties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {totalInterestPenalties > 0 ? `+${formatCurrency(totalInterestPenalties)}` : '$0'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Added to original debt</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search debts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterStatus || ''}
          onChange={(e) => setFilterStatus(e.target.value || null)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
        >
          <option value="">All Statuses</option>
          {Object.entries(COLLECTION_STATUS_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>
              {config.label}
            </option>
          ))}
        </select>
      </div>

      {/* Debt List */}
      {filteredDebts.length === 0 ? (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-4 font-medium dark:text-white">
                {debts.length === 0 ? 'No Tax Debts' : 'No Matching Debts'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {debts.length === 0
                  ? 'Start by adding your first tax debt to track.'
                  : 'Try adjusting your filters or search query.'}
              </p>
              {debts.length === 0 && (
                <Button asChild className="mt-4">
                  <Link href="/tax-debt/debts/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tax Debt
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border dark:border-gray-800">
          {/* Table Header */}
          <div className="hidden border-b bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900 md:block">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
              <button
                onClick={() => handleSort('tax_year')}
                className="flex items-center gap-1 text-left hover:text-gray-700 dark:hover:text-white"
              >
                Tax Year
                {sortField === 'tax_year' && <ArrowUpDown className="h-3 w-3" />}
              </button>
              <div>Type</div>
              <button
                onClick={() => handleSort('current_balance')}
                className="flex items-center gap-1 text-left hover:text-gray-700 dark:hover:text-white"
              >
                Balance
                {sortField === 'current_balance' && <ArrowUpDown className="h-3 w-3" />}
              </button>
              <div>Original</div>
              <button
                onClick={() => handleSort('collection_status')}
                className="flex items-center gap-1 text-left hover:text-gray-700 dark:hover:text-white"
              >
                Status
                {sortField === 'collection_status' && <ArrowUpDown className="h-3 w-3" />}
              </button>
              <div className="text-right">Actions</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y dark:divide-gray-800">
            {filteredDebts.map((debt) => {
              const statusConfig = COLLECTION_STATUS_CONFIG[debt.collection_status]

              return (
                <div
                  key={debt.id}
                  className="group bg-white transition-colors hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                >
                  {/* Desktop view */}
                  <div className="hidden grid-cols-6 items-center gap-4 px-4 py-4 md:grid">
                    <div className="font-medium dark:text-white">{debt.tax_year}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {DEBT_TYPE_LABELS[debt.debt_type || ''] || 'Tax Debt'}
                    </div>
                    <div className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(debt.current_balance)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(debt.original_amount)}
                    </div>
                    <div>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          statusConfig?.color
                        )}
                      >
                        {statusConfig?.label || debt.collection_status}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/tax-debt/debts/${debt.id}`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(debt.id)}
                        disabled={deletingId === debt.id}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        {deletingId === debt.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Mobile view */}
                  <Link href={`/tax-debt/debts/${debt.id}`} className="block p-4 md:hidden">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium dark:text-white">{debt.tax_year}</span>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-medium',
                              statusConfig?.color
                            )}
                          >
                            {statusConfig?.label}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {DEBT_TYPE_LABELS[debt.debt_type || ''] || 'Tax Debt'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(debt.current_balance)}
                        </div>
                        <ChevronRight className="ml-auto mt-1 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
