'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2, AlertTriangle, Mail, Filter } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CorrespondenceList, DeadlineAlert } from '@/components/features/tax-debt'
import { cn } from '@/lib/utils'
import {
  getCorrespondence,
  getCorrespondenceRequiringAttention,
  type IRSCorrespondence,
} from '@/app/actions/correspondence'

type StatusFilter = 'all' | 'active' | 'resolved'

export default function CorrespondencePage() {
  const router = useRouter()
  const [items, setItems] = useState<IRSCorrespondence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [attention, setAttention] = useState<{ overdue: number; upcoming: number; total: number }>({
    overdue: 0,
    upcoming: 0,
    total: 0,
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const [itemsResult, attentionResult] = await Promise.all([
      getCorrespondence(),
      getCorrespondenceRequiringAttention(),
    ])

    if (itemsResult.success) {
      setItems(itemsResult.data)
    } else {
      setError(itemsResult.error)
    }

    if (attentionResult.success) {
      setAttention(attentionResult.data)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    loadData().then(() => {
      if (!mounted) return
    })
    return () => {
      mounted = false
    }
  }, [loadData])

  const handleItemClick = (id: string) => {
    router.push(`/tax-debt/correspondence/${id}`)
  }

  // Filter items based on status
  const filteredItems = items.filter((item) => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'active') {
      return ['received', 'in_review', 'escalated'].includes(item.status)
    }
    if (statusFilter === 'resolved') {
      return ['response_sent', 'resolved'].includes(item.status)
    }
    return true
  })

  // Stats
  const totalActive = items.filter((i) =>
    ['received', 'in_review', 'escalated'].includes(i.status)
  ).length
  const totalResolved = items.filter((i) => ['response_sent', 'resolved'].includes(i.status)).length

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
          <h1 className="text-2xl font-bold tracking-tight dark:text-white">IRS Correspondence</h1>
          <p className="text-gray-500 dark:text-gray-400">Track notices and letters from the IRS</p>
        </div>
        <Button asChild>
          <Link href="/tax-debt/correspondence/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Correspondence
          </Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Deadline Alert */}
      {items.length > 0 && (
        <DeadlineAlert
          items={items.map((item) => ({
            id: item.id,
            notice_type: item.notice_type,
            notice_date: item.notice_date,
            response_deadline: item.response_deadline || '',
            status: item.status,
          }))}
        />
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold dark:text-white">{items.length}</p>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalActive}</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'dark:border-gray-800 dark:bg-gray-900',
            attention.overdue > 0 && 'border-red-200 dark:border-red-900/50'
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                'text-2xl font-bold',
                attention.overdue > 0 ? 'text-red-600 dark:text-red-400' : 'dark:text-white'
              )}
            >
              {attention.overdue}
            </p>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalResolved}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1">
          {(['all', 'active', 'resolved'] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                statusFilter === filter
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Correspondence List */}
      {items.length === 0 ? (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Mail className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-4 font-medium dark:text-white">No IRS Correspondence</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Start tracking IRS notices and letters to stay on top of deadlines.
              </p>
              <Button asChild className="mt-4">
                <Link href="/tax-debt/correspondence/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Item
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Mail className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-4 font-medium dark:text-white">No {statusFilter} items</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                There are no correspondence items matching this filter.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <CorrespondenceList items={filteredItems} onItemClick={handleItemClick} showTimeline />
      )}
    </div>
  )
}
