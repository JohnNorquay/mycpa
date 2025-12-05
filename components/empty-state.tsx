import { ReactNode } from 'react'
import { LucideIcon, FileX, Inbox, Search, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
  children?: ReactNode
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div className={cn('py-12 text-center', className)}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
        <Icon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Button asChild size="sm">
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

// Pre-configured empty states for common scenarios

export function NoDataEmptyState({
  entityName,
  onAdd,
  addHref,
}: {
  entityName: string
  onAdd?: () => void
  addHref?: string
}) {
  return (
    <EmptyState
      icon={Inbox}
      title={`No ${entityName} yet`}
      description={`Get started by adding your first ${entityName.toLowerCase()}.`}
      action={
        onAdd || addHref
          ? {
              label: `Add ${entityName}`,
              onClick: onAdd,
              href: addHref,
            }
          : undefined
      }
    />
  )
}

export function NoSearchResultsEmptyState({
  query,
  onClear,
}: {
  query: string
  onClear?: () => void
}) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find anything matching "${query}".`}
      action={
        onClear
          ? {
              label: 'Clear search',
              onClick: onClear,
            }
          : undefined
      }
    />
  )
}

export function NoFilterResultsEmptyState({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon={FileX}
      title="No matching items"
      description="Try adjusting your filters to see more results."
      action={
        onReset
          ? {
              label: 'Reset filters',
              onClick: onReset,
            }
          : undefined
      }
    />
  )
}

export function NewUserEmptyState({
  title,
  description,
  steps,
}: {
  title: string
  description: string
  steps?: Array<{ icon: LucideIcon; label: string; href?: string }>
}) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
        <PlusCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-gray-500 dark:text-gray-400">{description}</p>
      {steps && steps.length > 0 && (
        <div className="mx-auto mt-8 max-w-md">
          <div className="space-y-3">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const content = (
                <div className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <StepIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div>
                    <span className="mr-2 text-xs font-medium text-gray-400">Step {index + 1}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {step.label}
                    </span>
                  </div>
                </div>
              )
              return step.href ? (
                <a key={index} href={step.href}>
                  {content}
                </a>
              ) : (
                <div key={index}>{content}</div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
