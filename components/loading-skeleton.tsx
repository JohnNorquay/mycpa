import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * Base skeleton component with animation
 */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-800', className)} />
}

/**
 * Text line skeleton
 */
export function TextSkeleton({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  )
}

/**
 * Card skeleton
 */
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border p-4 dark:border-gray-800', className)}>
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  )
}

/**
 * Table row skeleton
 */
export function TableRowSkeleton({
  columns = 4,
  className,
}: {
  columns?: number
  className?: string
}) {
  return (
    <div
      className={cn('flex items-center gap-4 border-b px-4 py-3 dark:border-gray-800', className)}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === 0 ? 'w-8' : i === 1 ? 'flex-1' : 'w-20')} />
      ))}
    </div>
  )
}

/**
 * Table skeleton
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn('rounded-lg border dark:border-gray-800', className)}>
      {/* Header */}
      <div className="flex items-center gap-4 border-b bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className={cn('h-3', i === 0 ? 'w-8' : i === 1 ? 'flex-1' : 'w-16')} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={columns} />
      ))}
    </div>
  )
}

/**
 * Stat card skeleton
 */
export function StatCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border p-4 dark:border-gray-800', className)}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-8 w-24" />
      <Skeleton className="mt-2 h-3 w-16" />
    </div>
  )
}

/**
 * Dashboard widget skeleton
 */
export function DashboardWidgetSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border p-4 dark:border-gray-800', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mt-4 space-y-3">
        <Skeleton className="h-24 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

/**
 * Transaction list skeleton
 */
export function TransactionListSkeleton({
  count = 5,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3 dark:border-gray-800">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}

/**
 * Calendar skeleton
 */
export function CalendarSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-lg border p-4 dark:border-gray-800', className)}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

/**
 * Profile form skeleton
 */
export function FormSkeleton({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton className="mb-1 h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="mt-4 h-10 w-24" />
    </div>
  )
}

/**
 * Document grid skeleton
 */
export function DocumentGridSkeleton({
  count = 8,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 dark:border-gray-800">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Full page loading skeleton
 */
export function PageSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardWidgetSkeleton />
        </div>
        <div>
          <DashboardWidgetSkeleton />
        </div>
      </div>
    </div>
  )
}
