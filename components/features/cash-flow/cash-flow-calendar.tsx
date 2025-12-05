'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getCashFlowProjection } from '@/app/actions/cash-flow'
import type { CashFlowProjection, DailyProjection } from '@/lib/cash-flow/projection-engine'
import { CalendarDayCell } from './calendar-day-cell'

interface CashFlowCalendarProps {
  className?: string
  onDayClick?: (date: string, projection: DailyProjection | null) => void
  selectedDate?: string | null
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getMonthName(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1)
}

function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0)
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function CashFlowCalendar({ className, onDayClick, selectedDate }: CashFlowCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [projection, setProjection] = useState<CashFlowProjection | null>(null)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Load projection data for the current month
  useEffect(() => {
    async function loadProjection() {
      setIsLoading(true)
      setError(null)

      try {
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
        const lastDay = getLastDayOfMonth(currentYear, currentMonth)

        const startStr = firstDay.toISOString().split('T')[0] || ''
        const endStr = lastDay.toISOString().split('T')[0] || ''

        const result = await getCashFlowProjection(startStr, endStr)

        if (result.success) {
          setProjection(result.data)
        } else {
          setError(result.error || 'Failed to load projection')
        }
      } catch {
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    loadProjection()
  }, [currentYear, currentMonth])

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
    const lastDay = getLastDayOfMonth(currentYear, currentMonth)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days: Array<{
      date: Date | null
      dateStr: string | null
      isToday: boolean
      isCurrentMonth: boolean
      projection: DailyProjection | null
    }> = []

    const today = new Date()

    // Create a map of projections by date for quick lookup
    const projectionMap = new Map<string, DailyProjection>()
    if (projection?.projections) {
      for (const p of projection.projections) {
        if (p.date) {
          projectionMap.set(p.date, p)
        }
      }
    }

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({
        date: null,
        dateStr: null,
        isToday: false,
        isCurrentMonth: false,
        projection: null,
      })
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day)
      const dateStr = date.toISOString().split('T')[0] || ''

      days.push({
        date,
        dateStr,
        isToday: isSameDay(date, today),
        isCurrentMonth: true,
        projection: projectionMap.get(dateStr) || null,
      })
    }

    // Fill remaining cells to complete the grid (6 rows x 7 columns = 42)
    while (days.length < 42) {
      days.push({
        date: null,
        dateStr: null,
        isToday: false,
        isCurrentMonth: false,
        projection: null,
      })
    }

    return days
  }, [currentYear, currentMonth, projection])

  const handlePreviousMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }, [])

  const handleToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  const handleDayClick = useCallback(
    (dateStr: string | null, dayProjection: DailyProjection | null) => {
      if (dateStr && onDayClick) {
        onDayClick(dateStr, dayProjection)
      }
    },
    [onDayClick]
  )

  return (
    <div
      className={cn('rounded-lg border bg-white dark:border-gray-800 dark:bg-gray-900', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
        <h2 className="text-lg font-semibold dark:text-white">{getMonthName(currentDate)}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="flex h-96 flex-col items-center justify-center gap-2">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      ) : (
        <div className="p-4">
          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <CalendarDayCell
                key={index}
                date={day.date}
                isToday={day.isToday}
                isCurrentMonth={day.isCurrentMonth}
                isSelected={selectedDate === day.dateStr}
                projection={day.projection}
                onClick={() => handleDayClick(day.dateStr, day.projection)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="border-t p-3 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-green-100 dark:bg-green-900/30" />
            <span>Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-red-100 dark:bg-red-900/30" />
            <span>Expenses</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full border-2 border-blue-500" />
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  )
}
