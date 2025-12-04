'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import { Loader2, ArrowUpCircle, ArrowDownCircle, Receipt, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  date: string
  amount: number
  merchant_name: string | null
  category: string | null
  is_tax_deductible: boolean
  is_recurring: boolean
  notes: string | null
  account?: {
    name: string
    type: string | null
  } | null
}

interface TransactionListProps {
  initialTransactions?: Transaction[]
  filters?: {
    dateFrom?: string
    dateTo?: string
    category?: string
    accountId?: string
    search?: string
  }
  onTransactionClick?: (transaction: Transaction) => void
  pageSize?: number
}

export function TransactionList({
  initialTransactions = [],
  filters,
  onTransactionClick,
  pageSize = 50,
}: TransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Fetch transactions
  const fetchTransactions = useCallback(
    async (pageNum: number, append = false) => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: pageSize.toString(),
        })

        if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
        if (filters?.dateTo) params.append('dateTo', filters.dateTo)
        if (filters?.category) params.append('category', filters.category)
        if (filters?.accountId) params.append('accountId', filters.accountId)
        if (filters?.search) params.append('search', filters.search)

        const response = await fetch(`/api/transactions?${params}`)
        if (!response.ok) throw new Error('Failed to fetch transactions')

        const data = await response.json()

        if (append) {
          setTransactions((prev) => [...prev, ...data.transactions])
        } else {
          setTransactions(data.transactions)
        }

        setHasMore(data.hasMore)
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [filters, pageSize]
  )

  // Reset and refetch when filters change
  useEffect(() => {
    setPage(1)
    setHasMore(true)
    fetchTransactions(1, false)
  }, [filters, fetchTransactions])

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1)
          fetchTransactions(page + 1, true)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoading, page, fetchTransactions])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount))
  }

  const isIncome = (amount: number) => amount > 0

  const groupTransactionsByDate = (txns: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {}
    txns.forEach((tx) => {
      const dateKey = format(new Date(tx.date), 'yyyy-MM-dd')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(tx)
    })
    return groups
  }

  const groupedTransactions = groupTransactionsByDate(transactions)
  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  if (transactions.length === 0 && !isLoading) {
    return (
      <div className="py-12 text-center">
        <Receipt className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No transactions</h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {filters && Object.keys(filters).some((k) => filters[k as keyof typeof filters])
            ? 'No transactions match your filters'
            : 'Connect a bank account to start seeing transactions'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="sticky top-0 z-10 mb-2 bg-white py-2 text-sm font-medium text-gray-500 dark:bg-gray-950 dark:text-gray-400">
            {format(new Date(date), 'EEEE, MMMM d, yyyy')}
          </h3>
          <div className="divide-y rounded-lg border dark:divide-gray-800 dark:border-gray-800">
            {groupedTransactions[date]?.map((transaction) => (
              <div
                key={transaction.id}
                className={cn(
                  'flex items-center justify-between p-4 transition-colors',
                  onTransactionClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900'
                )}
                onClick={() => onTransactionClick?.(transaction)}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      isIncome(transaction.amount)
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    )}
                  >
                    {isIncome(transaction.amount) ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">
                      {transaction.merchant_name || 'Unknown Merchant'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      {transaction.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {transaction.category}
                        </span>
                      )}
                      {transaction.account?.name && <span>{transaction.account.name}</span>}
                      {transaction.is_tax_deductible && (
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Tax Deductible
                        </span>
                      )}
                      {transaction.is_recurring && (
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          Recurring
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'font-semibold',
                      isIncome(transaction.amount)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {isIncome(transaction.amount) ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Loading indicator / infinite scroll trigger */}
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading more transactions...
          </div>
        )}
        {!hasMore && transactions.length > 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No more transactions to load</p>
        )}
      </div>
    </div>
  )
}
