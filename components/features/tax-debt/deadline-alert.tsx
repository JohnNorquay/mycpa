'use client'

import { useMemo } from 'react'
import { AlertTriangle, Clock, Calendar, ChevronRight, Bell } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CorrespondenceDeadline {
  id: string
  notice_type: string
  notice_date: string
  response_deadline: string
  status: string
}

interface DeadlineAlertProps {
  items: CorrespondenceDeadline[]
  correspondenceHref?: string
  maxItems?: number
  className?: string
}

const NOTICE_LABELS: Record<string, string> = {
  cp14: 'CP14',
  cp501: 'CP501',
  cp503: 'CP503',
  cp504: 'CP504',
  cp523: 'CP523',
  lien_notice: 'Lien Notice',
  levy_notice: 'Levy Notice',
  wage_levy: 'Wage Levy',
  audit: 'Audit',
  cp2000: 'CP2000',
  letter_668a: 'Letter 668-A',
  letter_1058: 'Letter 1058',
  other: 'Notice',
}

function getNoticeLabel(type: string): string {
  return NOTICE_LABELS[type] || type
}

function getDaysUntilDeadline(deadline: string): number {
  const deadlineDate = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffMs = deadlineDate.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function DeadlineAlert({
  items,
  correspondenceHref = '/tax-debt/correspondence',
  maxItems = 5,
  className,
}: DeadlineAlertProps) {
  const activeDeadlines = useMemo(() => {
    // Filter to only unresolved items with deadlines
    const withDeadlines = items.filter(
      (item) =>
        item.response_deadline && item.status !== 'resolved' && item.status !== 'response_sent'
    )

    // Sort by deadline (most urgent first)
    const sorted = withDeadlines.sort((a, b) => {
      const aDate = new Date(a.response_deadline).getTime()
      const bDate = new Date(b.response_deadline).getTime()
      return aDate - bDate
    })

    // Categorize by urgency
    const overdue: (CorrespondenceDeadline & { daysUntil: number })[] = []
    const urgent: (CorrespondenceDeadline & { daysUntil: number })[] = []
    const upcoming: (CorrespondenceDeadline & { daysUntil: number })[] = []

    sorted.forEach((item) => {
      const days = getDaysUntilDeadline(item.response_deadline)
      const enriched = { ...item, daysUntil: days }

      if (days < 0) {
        overdue.push(enriched)
      } else if (days <= 7) {
        urgent.push(enriched)
      } else if (days <= 30) {
        upcoming.push(enriched)
      }
    })

    return { overdue, urgent, upcoming }
  }, [items])

  const totalAlerts =
    activeDeadlines.overdue.length + activeDeadlines.urgent.length + activeDeadlines.upcoming.length

  if (totalAlerts === 0) {
    return null // Don't render if no alerts
  }

  const hasOverdue = activeDeadlines.overdue.length > 0
  const hasUrgent = activeDeadlines.urgent.length > 0

  return (
    <Card
      className={cn(
        'dark:border-gray-800 dark:bg-gray-900',
        hasOverdue
          ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10'
          : hasUrgent
            ? 'border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-900/10'
            : '',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base dark:text-white">
            {hasOverdue ? (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-red-700 dark:text-red-400">Deadlines Alert</span>
              </>
            ) : hasUrgent ? (
              <>
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="text-amber-700 dark:text-amber-400">Upcoming Deadlines</span>
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5 text-blue-500" />
                <span>Response Deadlines</span>
              </>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={correspondenceHref}>
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <CardDescription className="dark:text-gray-400">
          {totalAlerts} pending response{totalAlerts !== 1 ? 's' : ''} requiring attention
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Overdue Items */}
        {activeDeadlines.overdue.slice(0, maxItems).map((item) => (
          <Link
            key={item.id}
            href={`${correspondenceHref}/${item.id}`}
            className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:hover:bg-red-900/30"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {getNoticeLabel(item.notice_type)}
              </p>
              <p className="text-xs text-red-600 dark:text-red-500">
                Overdue by {Math.abs(item.daysUntil)} day{Math.abs(item.daysUntil) !== 1 ? 's' : ''}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-red-400" />
          </Link>
        ))}

        {/* Urgent Items (within 7 days) */}
        {activeDeadlines.urgent.slice(0, maxItems - activeDeadlines.overdue.length).map((item) => (
          <Link
            key={item.id}
            href={`${correspondenceHref}/${item.id}`}
            className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 transition-colors hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {getNoticeLabel(item.notice_type)}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500">
                Due in {item.daysUntil} day{item.daysUntil !== 1 ? 's' : ''} -{' '}
                {new Date(item.response_deadline).toLocaleDateString()}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-amber-400" />
          </Link>
        ))}

        {/* Upcoming Items (within 30 days) */}
        {activeDeadlines.upcoming
          .slice(0, maxItems - activeDeadlines.overdue.length - activeDeadlines.urgent.length)
          .map((item) => (
            <Link
              key={item.id}
              href={`${correspondenceHref}/${item.id}`}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium dark:text-white">
                  {getNoticeLabel(item.notice_type)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Due in {item.daysUntil} days -{' '}
                  {new Date(item.response_deadline).toLocaleDateString()}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          ))}

        {/* Show more indicator */}
        {totalAlerts > maxItems && (
          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            +{totalAlerts - maxItems} more deadline{totalAlerts - maxItems !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact version for dashboard sidebar
 */
export function DeadlineAlertCompact({
  items,
  correspondenceHref = '/tax-debt/correspondence',
}: {
  items: CorrespondenceDeadline[]
  correspondenceHref?: string
}) {
  const activeDeadlines = useMemo(() => {
    return items.filter(
      (item) =>
        item.response_deadline &&
        item.status !== 'resolved' &&
        item.status !== 'response_sent' &&
        getDaysUntilDeadline(item.response_deadline) <= 7
    )
  }, [items])

  if (activeDeadlines.length === 0) return null

  const hasOverdue = activeDeadlines.some(
    (item) => getDaysUntilDeadline(item.response_deadline) < 0
  )

  return (
    <Link
      href={correspondenceHref}
      className={cn(
        'flex items-center gap-2 rounded-lg p-3 transition-colors',
        hasOverdue
          ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'
          : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full',
          hasOverdue ? 'bg-red-100 dark:bg-red-900/50' : 'bg-amber-100 dark:bg-amber-900/50'
        )}
      >
        {hasOverdue ? (
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        ) : (
          <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        )}
      </div>
      <div className="flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            hasOverdue ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
          )}
        >
          {activeDeadlines.length} Deadline{activeDeadlines.length !== 1 ? 's' : ''}
        </p>
        <p
          className={cn(
            'text-xs',
            hasOverdue ? 'text-red-600 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'
          )}
        >
          {hasOverdue ? 'Overdue - Action Required' : 'Due within 7 days'}
        </p>
      </div>
      <ChevronRight className={cn('h-4 w-4', hasOverdue ? 'text-red-400' : 'text-amber-400')} />
    </Link>
  )
}
