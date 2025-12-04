'use client'

import { useState, useCallback, useEffect } from 'react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, X, Calendar, Tag, Building2, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Account {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

export interface TransactionFilters {
  dateFrom?: string
  dateTo?: string
  category?: string
  accountId?: string
  search?: string
}

interface TransactionFiltersProps {
  filters: TransactionFilters
  onFiltersChange: (filters: TransactionFilters) => void
  accounts?: Account[]
  categories?: Category[]
  className?: string
}

const QUICK_DATE_RANGES = [
  { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  {
    label: 'Last Month',
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: 'Last 3 Months',
    getValue: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
  },
  {
    label: 'Last 6 Months',
    getValue: () => ({ from: subMonths(new Date(), 6), to: new Date() }),
  },
  {
    label: 'This Year',
    getValue: () => ({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() }),
  },
]

export function TransactionFilters({
  filters,
  onFiltersChange,
  accounts = [],
  categories = [],
  className,
}: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localSearch, setLocalSearch] = useState(filters.search || '')
  const [prevFilterSearch, setPrevFilterSearch] = useState(filters.search)

  // Sync local search with filters (using pattern that avoids setState in effect)
  if (filters.search !== prevFilterSearch) {
    setPrevFilterSearch(filters.search)
    setLocalSearch(filters.search || '')
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ ...filters, search: localSearch || undefined })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, filters, onFiltersChange])

  const handleDateRangeClick = useCallback(
    (getValue: () => { from: Date; to: Date }) => {
      const { from, to } = getValue()
      onFiltersChange({
        ...filters,
        dateFrom: format(from, 'yyyy-MM-dd'),
        dateTo: format(to, 'yyyy-MM-dd'),
      })
    },
    [filters, onFiltersChange]
  )

  const handleClearFilters = useCallback(() => {
    onFiltersChange({})
    setLocalSearch('')
  }, [onFiltersChange])

  const hasActiveFilters =
    filters.dateFrom || filters.dateTo || filters.category || filters.accountId || filters.search

  const activeFilterCount = [
    filters.dateFrom || filters.dateTo,
    filters.category,
    filters.accountId,
    filters.search,
  ].filter(Boolean).length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search transactions..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant={isExpanded ? 'secondary' : 'outline'}
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear all
          </Button>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="rounded-lg border p-4 dark:border-gray-800">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Date Range
              </Label>
              <div className="flex flex-wrap gap-2">
                {QUICK_DATE_RANGES.map((range) => (
                  <Button
                    key={range.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDateRangeClick(range.getValue)}
                    className="text-xs"
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">From</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })
                    }
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">To</Label>
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, dateTo: e.target.value || undefined })
                    }
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Tag className="h-4 w-4" />
                Category
              </Label>
              <select
                value={filters.category || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, category: e.target.value || undefined })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-gray-800"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                Account
              </Label>
              <select
                value={filters.accountId || ''}
                onChange={(e) =>
                  onFiltersChange({ ...filters, accountId: e.target.value || undefined })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-gray-800"
              >
                <option value="">All Accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4 dark:border-gray-800">
              {(filters.dateFrom || filters.dateTo) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  <Calendar className="h-3 w-3" />
                  {filters.dateFrom && format(new Date(filters.dateFrom), 'MMM d')}
                  {filters.dateFrom && filters.dateTo && ' - '}
                  {filters.dateTo && format(new Date(filters.dateTo), 'MMM d, yyyy')}
                  <button
                    onClick={() =>
                      onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined })
                    }
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.category && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <Tag className="h-3 w-3" />
                  {filters.category}
                  <button
                    onClick={() => onFiltersChange({ ...filters, category: undefined })}
                    className="ml-1 hover:text-green-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.accountId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                  <Building2 className="h-3 w-3" />
                  {accounts.find((a) => a.id === filters.accountId)?.name || 'Account'}
                  <button
                    onClick={() => onFiltersChange({ ...filters, accountId: undefined })}
                    className="ml-1 hover:text-purple-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.search && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                  <Search className="h-3 w-3" />
                  &quot;{filters.search}&quot;
                  <button
                    onClick={() => {
                      onFiltersChange({ ...filters, search: undefined })
                      setLocalSearch('')
                    }}
                    className="ml-1 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
