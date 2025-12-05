'use client'

import { useMemo } from 'react'
import {
  Mail,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type CorrespondenceStatus = 'received' | 'in_review' | 'response_sent' | 'resolved' | 'escalated'

interface Correspondence {
  id: string
  notice_date: string
  notice_type: string
  notice_number: string | null
  response_deadline: string | null
  status: CorrespondenceStatus
  tax_debt_id: string | null
  notes: string | null
}

interface CorrespondenceListProps {
  items: Correspondence[]
  onItemClick?: (id: string) => void
  showTimeline?: boolean
  className?: string
}

const STATUS_CONFIG: Record<
  CorrespondenceStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  received: {
    label: 'Received',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: Mail,
  },
  in_review: {
    label: 'In Review',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: Clock,
  },
  response_sent: {
    label: 'Response Sent',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: Mail,
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle2,
  },
  escalated: {
    label: 'Escalated',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: AlertCircle,
  },
}

const NOTICE_LABELS: Record<string, string> = {
  cp14: 'CP14 - Balance Due',
  cp501: 'CP501 - Reminder',
  cp503: 'CP503 - Second Reminder',
  cp504: 'CP504 - Intent to Levy',
  cp523: 'CP523 - IA Default',
  lien_notice: 'Tax Lien Notice',
  levy_notice: 'Intent to Levy',
  wage_levy: 'Wage Levy',
  audit: 'Audit Notice',
  cp2000: 'CP2000 - Underreported',
  letter_668a: 'Letter 668-A - Levy',
  letter_1058: 'Letter 1058 - Final',
  other: 'Other Notice',
}

function getNoticeLabel(type: string): string {
  return NOTICE_LABELS[type] || type
}

function getDeadlineStatus(deadline: string | null): 'overdue' | 'soon' | 'ok' | null {
  if (!deadline) return null
  const deadlineDate = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (deadlineDate < today) return 'overdue'
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  if (deadlineDate <= sevenDaysFromNow) return 'soon'
  return 'ok'
}

function getDaysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null
  const deadlineDate = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffMs = deadlineDate.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function CorrespondenceList({
  items,
  onItemClick,
  showTimeline = true,
  className,
}: CorrespondenceListProps) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      // Sort by deadline urgency first, then by notice date
      const aDeadline = getDeadlineStatus(a.response_deadline)
      const bDeadline = getDeadlineStatus(b.response_deadline)

      const deadlinePriority = { overdue: 0, soon: 1, ok: 2, null: 3 }
      const aPriority = deadlinePriority[aDeadline || 'null'] ?? 3
      const bPriority = deadlinePriority[bDeadline || 'null'] ?? 3

      if (aPriority !== bPriority) return aPriority - bPriority

      // Then by notice date (newest first)
      return new Date(b.notice_date).getTime() - new Date(a.notice_date).getTime()
    })
  }, [items])

  if (items.length === 0) {
    return (
      <Card className={cn('dark:border-gray-800 dark:bg-gray-900', className)}>
        <CardContent className="py-12">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Mail className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-4 font-medium dark:text-white">No Correspondence</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              No IRS correspondence has been logged yet.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {showTimeline ? (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          {/* Timeline items */}
          <div className="space-y-6">
            {sortedItems.map((item) => {
              const statusConfig = STATUS_CONFIG[item.status]
              const StatusIcon = statusConfig.icon
              const deadlineStatus = getDeadlineStatus(item.response_deadline)
              const daysUntil = getDaysUntilDeadline(item.response_deadline)

              return (
                <div key={item.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-white dark:border-gray-900',
                      item.status === 'resolved'
                        ? 'bg-green-100 dark:bg-green-900/50'
                        : item.status === 'escalated' || deadlineStatus === 'overdue'
                          ? 'bg-red-100 dark:bg-red-900/50'
                          : deadlineStatus === 'soon'
                            ? 'bg-amber-100 dark:bg-amber-900/50'
                            : 'bg-gray-100 dark:bg-gray-800'
                    )}
                  >
                    <StatusIcon
                      className={cn(
                        'h-5 w-5',
                        item.status === 'resolved'
                          ? 'text-green-600 dark:text-green-400'
                          : item.status === 'escalated' || deadlineStatus === 'overdue'
                            ? 'text-red-600 dark:text-red-400'
                            : deadlineStatus === 'soon'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-gray-500 dark:text-gray-400'
                      )}
                    />
                  </div>

                  {/* Content card */}
                  <Card
                    className={cn(
                      'flex-1 cursor-pointer transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800',
                      deadlineStatus === 'overdue' &&
                        item.status !== 'resolved' &&
                        'border-red-200 dark:border-red-900/50'
                    )}
                    onClick={() => onItemClick?.(item.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium dark:text-white">
                              {getNoticeLabel(item.notice_type)}
                            </h4>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                statusConfig.color
                              )}
                            >
                              {statusConfig.label}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(item.notice_date).toLocaleDateString()}
                            </span>
                            {item.notice_number && <span>#{item.notice_number}</span>}
                          </div>

                          {item.response_deadline && item.status !== 'resolved' && (
                            <div
                              className={cn(
                                'mt-2 flex items-center gap-1 text-sm',
                                deadlineStatus === 'overdue'
                                  ? 'text-red-600 dark:text-red-400'
                                  : deadlineStatus === 'soon'
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-gray-500 dark:text-gray-400'
                              )}
                            >
                              {deadlineStatus === 'overdue' ? (
                                <>
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="font-medium">
                                    Overdue by {Math.abs(daysUntil || 0)} day(s)
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    Due in {daysUntil} day(s) -{' '}
                                    {new Date(item.response_deadline).toLocaleDateString()}
                                  </span>
                                </>
                              )}
                            </div>
                          )}

                          {item.notes && (
                            <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                              {item.notes}
                            </p>
                          )}
                        </div>

                        <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedItems.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status]
            const deadlineStatus = getDeadlineStatus(item.response_deadline)
            const daysUntil = getDaysUntilDeadline(item.response_deadline)

            return (
              <Card
                key={item.id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800',
                  deadlineStatus === 'overdue' &&
                    item.status !== 'resolved' &&
                    'border-red-200 dark:border-red-900/50'
                )}
                onClick={() => onItemClick?.(item.id)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium dark:text-white">
                        {getNoticeLabel(item.notice_type)}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          statusConfig.color
                        )}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.notice_date).toLocaleDateString()}
                      {deadlineStatus === 'overdue' && item.status !== 'resolved' && (
                        <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                          Overdue
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
