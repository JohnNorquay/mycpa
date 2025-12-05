'use client'

import { Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface ProcessingStatusProps {
  status: ProcessingStatus
  documentType?: string | null
  confidence?: number | null
  error?: string | null
  onReprocess?: () => void
  isReprocessing?: boolean
  className?: string
  compact?: boolean
}

const STATUS_CONFIG: Record<
  ProcessingStatus,
  {
    label: string
    description: string
    icon: typeof CheckCircle2
    color: string
    bgColor: string
  }
> = {
  pending: {
    label: 'Pending',
    description: 'Waiting to be processed',
    icon: Clock,
    color: 'text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  processing: {
    label: 'Processing',
    description: 'Analyzing document...',
    icon: Loader2,
    color: 'text-blue-500 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  completed: {
    label: 'Completed',
    description: 'Document analyzed successfully',
    icon: CheckCircle2,
    color: 'text-green-500 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  failed: {
    label: 'Failed',
    description: 'Processing failed',
    icon: XCircle,
    color: 'text-red-500 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  w2: 'W-2 Wage Statement',
  '1099_misc': '1099-MISC',
  '1099_nec': '1099-NEC',
  '1099_int': '1099-INT',
  '1099_div': '1099-DIV',
  irs_notice: 'IRS Notice',
  unknown: 'Unknown Document',
}

export function ProcessingStatus({
  status,
  documentType,
  confidence,
  error,
  onReprocess,
  isReprocessing = false,
  className,
  compact = false,
}: ProcessingStatusProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className={cn('flex h-6 w-6 items-center justify-center rounded-full', config.bgColor)}
        >
          <Icon
            className={cn('h-3.5 w-3.5', config.color, status === 'processing' && 'animate-spin')}
          />
        </div>
        <span
          className={cn(
            'text-sm font-medium',
            status === 'completed'
              ? 'text-green-600 dark:text-green-400'
              : status === 'failed'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400'
          )}
        >
          {config.label}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('rounded-lg border p-4 dark:border-gray-800', className)}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full',
            config.bgColor
          )}
        >
          <Icon
            className={cn('h-6 w-6', config.color, status === 'processing' && 'animate-spin')}
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium dark:text-white">{config.label}</h4>
            {status === 'failed' && onReprocess && (
              <Button variant="outline" size="sm" onClick={onReprocess} disabled={isReprocessing}>
                {isReprocessing ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Reprocessing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Retry
                  </>
                )}
              </Button>
            )}
          </div>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{config.description}</p>

          {/* Document Type */}
          {status === 'completed' && documentType && (
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {DOCUMENT_TYPE_LABELS[documentType] || documentType}
              </span>
              {confidence !== null && confidence !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(confidence * 100)}% confidence
                </span>
              )}
            </div>
          )}

          {/* Error Message */}
          {status === 'failed' && error && (
            <div className="mt-3 flex items-start gap-2 rounded-md bg-red-50 p-2 dark:bg-red-900/20">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Processing Animation */}
          {status === 'processing' && (
            <div className="mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-500" />
              </div>
              <p className="mt-1 text-xs text-gray-400">This may take a few moments...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Badge version for use in lists/grids
 */
export function ProcessingStatusBadge({
  status,
  className,
}: {
  status: ProcessingStatus
  className?: string
}) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'pending' && 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        status === 'processing' &&
          'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        status === 'completed' &&
          'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        status === 'failed' && 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        className
      )}
    >
      <Icon className={cn('h-3 w-3', status === 'processing' && 'animate-spin')} />
      {config.label}
    </span>
  )
}
