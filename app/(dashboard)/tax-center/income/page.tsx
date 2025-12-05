'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Briefcase,
  Building2,
  TrendingUp,
  DollarSign,
  PiggyBank,
  Wallet,
  FileText,
  Edit2,
  Trash2,
  Info,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type IncomeType = 'w2' | '1099' | 'investment' | 'retirement' | 'other'

interface IncomeEntry {
  id: string
  type: IncomeType
  source: string
  amount: number
  withholding?: {
    federal: number
    state: number
  }
  documentId?: string
  createdAt: Date
}

const INCOME_TYPE_CONFIG: Record<
  IncomeType,
  { label: string; description: string; icon: typeof Briefcase; color: string; bgColor: string }
> = {
  w2: {
    label: 'W-2 Wages',
    description: 'Employment income with tax withholding',
    icon: Briefcase,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  '1099': {
    label: '1099 Income',
    description: 'Self-employment, contractor, or freelance',
    icon: Building2,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  investment: {
    label: 'Investment Income',
    description: 'Dividends, capital gains, interest',
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  retirement: {
    label: 'Retirement Income',
    description: 'Pension, IRA distributions, Social Security',
    icon: PiggyBank,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  other: {
    label: 'Other Income',
    description: 'Rental, alimony, prizes, etc.',
    icon: Wallet,
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
}

// Demo income entries
const DEMO_INCOME_ENTRIES: IncomeEntry[] = [
  {
    id: '1',
    type: 'w2',
    source: 'Acme Corporation',
    amount: 95000,
    withholding: { federal: 14250, state: 3800 },
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    type: '1099',
    source: 'Freelance Web Development',
    amount: 25000,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    type: 'investment',
    source: 'Vanguard Brokerage',
    amount: 7500,
    withholding: { federal: 750, state: 200 },
    createdAt: new Date('2024-03-10'),
  },
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function IncomePage() {
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(DEMO_INCOME_ENTRIES)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedType, setSelectedType] = useState<IncomeType | null>(null)
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    federalWithholding: '',
    stateWithholding: '',
  })

  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0)
  const totalFederalWithholding = incomeEntries.reduce(
    (sum, entry) => sum + (entry.withholding?.federal ?? 0),
    0
  )
  const totalStateWithholding = incomeEntries.reduce(
    (sum, entry) => sum + (entry.withholding?.state ?? 0),
    0
  )

  const handleAddIncome = () => {
    if (!selectedType || !formData.source || !formData.amount) return

    const newEntry: IncomeEntry = {
      id: Date.now().toString(),
      type: selectedType,
      source: formData.source,
      amount: parseFloat(formData.amount),
      withholding:
        formData.federalWithholding || formData.stateWithholding
          ? {
              federal: parseFloat(formData.federalWithholding) || 0,
              state: parseFloat(formData.stateWithholding) || 0,
            }
          : undefined,
      createdAt: new Date(),
    }

    setIncomeEntries([...incomeEntries, newEntry])
    setShowAddForm(false)
    setSelectedType(null)
    setFormData({ source: '', amount: '', federalWithholding: '', stateWithholding: '' })
  }

  const handleDeleteIncome = (id: string) => {
    setIncomeEntries(incomeEntries.filter((entry) => entry.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tax-center">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Tax Center
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Income</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Add and manage your income sources for tax year 2024
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add Income
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Federal Withholding</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(totalFederalWithholding)}
            </p>
          </CardContent>
        </Card>
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">State Withholding</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(totalStateWithholding)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Income Form */}
      {showAddForm && (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle>Add Income</CardTitle>
            <CardDescription>Select the type of income you want to add</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type Selection */}
            {!selectedType ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(INCOME_TYPE_CONFIG).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type as IncomeType)}
                      className="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                          config.bgColor
                        )}
                      >
                        <Icon className={cn('h-5 w-5', config.color)} />
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">{config.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {config.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <>
                {/* Selected Type Header */}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                      INCOME_TYPE_CONFIG[selectedType].bgColor
                    )}
                  >
                    {(() => {
                      const Icon = INCOME_TYPE_CONFIG[selectedType].icon
                      return (
                        <Icon className={cn('h-5 w-5', INCOME_TYPE_CONFIG[selectedType].color)} />
                      )
                    })()}
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">
                      {INCOME_TYPE_CONFIG[selectedType].label}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedType(null)}
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Change type
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="source">
                      {selectedType === 'w2' ? 'Employer Name' : 'Income Source'}
                    </Label>
                    <Input
                      id="source"
                      placeholder={
                        selectedType === 'w2' ? 'e.g., Acme Corporation' : 'e.g., Freelance Work'
                      }
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">
                      {selectedType === 'w2' ? 'Gross Wages (Box 1)' : 'Amount'}
                    </Label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="pl-7"
                      />
                    </div>
                  </div>
                  {(selectedType === 'w2' || selectedType === 'investment') && (
                    <>
                      <div>
                        <Label htmlFor="federalWithholding">Federal Tax Withheld</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <Input
                            id="federalWithholding"
                            type="number"
                            placeholder="0"
                            value={formData.federalWithholding}
                            onChange={(e) =>
                              setFormData({ ...formData, federalWithholding: e.target.value })
                            }
                            className="pl-7"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="stateWithholding">State Tax Withheld</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <Input
                            id="stateWithholding"
                            type="number"
                            placeholder="0"
                            value={formData.stateWithholding}
                            onChange={(e) =>
                              setFormData({ ...formData, stateWithholding: e.target.value })
                            }
                            className="pl-7"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Self-employment notice */}
                {selectedType === '1099' && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-900/20">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                    <p className="text-amber-700 dark:text-amber-400">
                      Self-employment income is subject to additional SE tax (15.3%). Consider
                      making quarterly estimated payments.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={handleAddIncome}>Add Income</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setSelectedType(null)
                      setFormData({
                        source: '',
                        amount: '',
                        federalWithholding: '',
                        stateWithholding: '',
                      })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Income Entries */}
      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-base">Income Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {incomeEntries.length === 0 ? (
            <div className="py-12 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                No income added
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start by adding your W-2, 1099, or other income sources.
              </p>
              <Button className="mt-4" onClick={() => setShowAddForm(true)}>
                <Plus className="mr-1 h-4 w-4" />
                Add Income
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {incomeEntries.map((entry) => {
                const config = INCOME_TYPE_CONFIG[entry.type]
                const Icon = config.icon
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 rounded-lg border p-4 dark:border-gray-800"
                  >
                    <div
                      className={cn(
                        'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg',
                        config.bgColor
                      )}
                    >
                      <Icon className={cn('h-6 w-6', config.color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium dark:text-white">{entry.source}</p>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {config.label}
                        </span>
                      </div>
                      {entry.withholding && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Withholding: {formatCurrency(entry.withholding.federal)} federal,{' '}
                          {formatCurrency(entry.withholding.state)} state
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold dark:text-white">
                        {formatCurrency(entry.amount)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteIncome(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link to Documents */}
      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardContent className="p-4">
          <Link
            href="/documents"
            className="flex items-center gap-4 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium dark:text-white">Upload Tax Documents</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload W-2s, 1099s, and other tax forms to auto-fill income information
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
