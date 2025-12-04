'use client'

import { useState, useCallback, useEffect } from 'react'
import { DollarSign, Download, Tag, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  TransactionList,
  TransactionFilters,
  TransactionDetail,
  SplitTransactionModal,
} from '@/components/features/transactions'
import type { TransactionFiltersType } from '@/components/features/transactions'
import {
  updateTransaction,
  splitTransaction,
  bulkUpdateCategory,
  bulkMarkTaxDeductible,
} from '@/app/actions/transactions'

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

interface Account {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  is_tax_deductible: boolean
}

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFiltersType>({})
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [splitModalTransaction, setSplitModalTransaction] = useState<Transaction | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)

  // Fetch accounts and categories
  useEffect(() => {
    const fetchFiltersData = async () => {
      try {
        // Fetch accounts
        const accountsRes = await fetch('/api/accounts')
        if (accountsRes.ok) {
          const accountsData = await accountsRes.json()
          setAccounts(accountsData.accounts || [])
        }

        // Fetch categories (using a simple list for now)
        // In a real app, this would come from a categories API
        setCategories([
          { id: '1', name: 'Food & Dining', is_tax_deductible: false },
          { id: '2', name: 'Transportation', is_tax_deductible: false },
          { id: '3', name: 'Shopping', is_tax_deductible: false },
          { id: '4', name: 'Entertainment', is_tax_deductible: false },
          { id: '5', name: 'Bills & Utilities', is_tax_deductible: false },
          { id: '6', name: 'Health & Medical', is_tax_deductible: true },
          { id: '7', name: 'Travel', is_tax_deductible: false },
          { id: '8', name: 'Business Expense', is_tax_deductible: true },
          { id: '9', name: 'Office Supplies', is_tax_deductible: true },
          { id: '10', name: 'Professional Services', is_tax_deductible: true },
          { id: '11', name: 'Education', is_tax_deductible: true },
          { id: '12', name: 'Charitable Donations', is_tax_deductible: true },
          { id: '13', name: 'Income', is_tax_deductible: false },
          { id: '14', name: 'Transfer', is_tax_deductible: false },
          { id: '15', name: 'Other', is_tax_deductible: false },
        ])
      } catch (error) {
        console.error('Error fetching filters data:', error)
      }
    }

    fetchFiltersData()
  }, [])

  const handleTransactionClick = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedTransaction(null)
  }, [])

  const handleSaveTransaction = useCallback(
    async (updates: Partial<Transaction>) => {
      if (!selectedTransaction) return

      const result = await updateTransaction(selectedTransaction.id, updates)
      if (!result.success) {
        throw new Error(result.error)
      }

      // Update local state
      setSelectedTransaction((prev) => (prev ? { ...prev, ...updates } : null))
    },
    [selectedTransaction]
  )

  const handleSplitTransaction = useCallback((transaction: Transaction) => {
    setSplitModalTransaction(transaction)
    setSelectedTransaction(null)
  }, [])

  const handleSaveSplit = useCallback(
    async (splits: Array<{ amount: number; category: string; description: string }>) => {
      if (!splitModalTransaction) return

      const result = await splitTransaction({
        transactionId: splitModalTransaction.id,
        splits,
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      setSplitModalTransaction(null)
    },
    [splitModalTransaction]
  )

  const handleCloseSplitModal = useCallback(() => {
    setSplitModalTransaction(null)
  }, [])

  const handleBulkCategoryUpdate = useCallback(
    async (category: string) => {
      const ids = Array.from(selectedIds)
      const result = await bulkUpdateCategory(ids, category)
      if (result.success) {
        setSelectedIds(new Set())
        setIsSelectionMode(false)
      }
    },
    [selectedIds]
  )

  const handleBulkTaxDeductible = useCallback(
    async (isTaxDeductible: boolean) => {
      const ids = Array.from(selectedIds)
      const result = await bulkMarkTaxDeductible(ids, isTaxDeductible)
      if (result.success) {
        setSelectedIds(new Set())
        setIsSelectionMode(false)
      }
    },
    [selectedIds]
  )

  const handleExport = useCallback(() => {
    // Build export URL with current filters
    const params = new URLSearchParams()
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)
    if (filters.category) params.append('category', filters.category)
    if (filters.accountId) params.append('accountId', filters.accountId)
    if (filters.search) params.append('search', filters.search)
    params.append('format', 'csv')

    window.open(`/api/transactions/export?${params}`, '_blank')
  }, [filters])

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold dark:text-white">Transactions</h1>
              <p className="text-gray-500 dark:text-gray-400">
                View and manage your financial transactions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isSelectionMode ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode)
                  setSelectedIds(new Set())
                }}
                className="gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                {isSelectionMode ? 'Cancel Selection' : 'Select'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {isSelectionMode && selectedIds.size > 0 && (
            <div className="mb-4 flex items-center gap-4 rounded-lg border bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-900/20">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) handleBulkCategoryUpdate(e.target.value)
                  }}
                  className="h-8 rounded-md border border-blue-300 bg-white px-2 text-sm dark:border-blue-800 dark:bg-gray-900"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Set Category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkTaxDeductible(true)}
                  className="gap-1 border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-400"
                >
                  <Tag className="h-3 w-3" />
                  Mark Tax Deductible
                </Button>
              </div>
            </div>
          )}

          {/* Filters */}
          <TransactionFilters
            filters={filters}
            onFiltersChange={setFilters}
            accounts={accounts}
            categories={categories}
            className="mb-6"
          />

          {/* Summary Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Income</span>
              </div>
              <p className="mt-1 text-xl font-semibold text-green-600 dark:text-green-400">
                — {/* Will be populated by actual data */}
              </p>
            </div>
            <div className="rounded-lg border p-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-red-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Expenses</span>
              </div>
              <p className="mt-1 text-xl font-semibold text-red-600 dark:text-red-400">
                — {/* Will be populated by actual data */}
              </p>
            </div>
            <div className="rounded-lg border p-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Tax Deductible</span>
              </div>
              <p className="mt-1 text-xl font-semibold text-blue-600 dark:text-blue-400">
                — {/* Will be populated by actual data */}
              </p>
            </div>
          </div>

          {/* Transaction List */}
          <TransactionList
            filters={filters}
            onTransactionClick={handleTransactionClick}
            pageSize={50}
          />
        </div>
      </div>

      {/* Detail Panel */}
      {selectedTransaction && (
        <div className="w-96 border-l dark:border-gray-800">
          <TransactionDetail
            transaction={selectedTransaction}
            categories={categories}
            onClose={handleCloseDetail}
            onSave={handleSaveTransaction}
            onSplit={handleSplitTransaction}
          />
        </div>
      )}

      {/* Split Modal */}
      {splitModalTransaction && (
        <SplitTransactionModal
          transaction={splitModalTransaction}
          categories={categories}
          isOpen={!!splitModalTransaction}
          onClose={handleCloseSplitModal}
          onSave={handleSaveSplit}
        />
      )}
    </div>
  )
}
