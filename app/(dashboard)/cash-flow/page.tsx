'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Settings, Calendar, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CashFlowCalendar } from '@/components/features/cash-flow/cash-flow-calendar'
import { DayDetailPanel } from '@/components/features/cash-flow/day-detail-panel'
import { QuickProjection } from '@/components/features/cash-flow/quick-projection'
import { NextEvents } from '@/components/features/cash-flow/next-events'
import { CashFlowWidget } from '@/components/features/cash-flow/cash-flow-widget'
import type { DailyProjection } from '@/lib/cash-flow/projection-engine'

export default function CashFlowPage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedProjection, setSelectedProjection] = useState<DailyProjection | null>(null)

  const handleDayClick = useCallback((date: string, projection: DailyProjection | null) => {
    setSelectedDate(date)
    setSelectedProjection(projection)
  }, [])

  const handleClosePanel = useCallback(() => {
    setSelectedDate(null)
    setSelectedProjection(null)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Cash Flow</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Track and forecast your income and expenses
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/cash-flow/recurring">
            <Settings className="mr-2 h-4 w-4" />
            Manage Recurring
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Calendar */}
        <div className="lg:col-span-2">
          <CashFlowCalendar selectedDate={selectedDate} onDayClick={handleDayClick} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Day Detail Panel (shown when a day is selected) */}
          {selectedDate ? (
            <DayDetailPanel
              date={selectedDate}
              projection={selectedProjection}
              onClose={handleClosePanel}
            />
          ) : (
            <>
              {/* Cash Flow Summary Widget */}
              <CashFlowWidget />

              {/* Quick Projections */}
              <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-3 flex items-center gap-2 font-semibold dark:text-white">
                  <Calendar className="h-4 w-4" />
                  Quick Projections
                </h3>
                <QuickProjection />
              </div>

              {/* Upcoming Events */}
              <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-3 font-semibold dark:text-white">Upcoming Events</h3>
                <NextEvents limit={5} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 rounded-lg border bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-800/50">
        <h2 className="font-semibold dark:text-white">Understanding Your Cash Flow</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Calendar View</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Green arrows indicate expected income, red arrows show expected expenses. Click any
              day to see details.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Projections</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Projections are based on your detected recurring transactions. The confidence level
              indicates how reliable the estimate is.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Low Balance Warnings
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Days highlighted in red or amber indicate projected low or negative balances. Plan
              ahead to avoid overdrafts.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Link
            href="/cash-flow/recurring"
            className="inline-flex items-center text-sm text-blue-500 hover:underline"
          >
            Review your recurring transactions
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
