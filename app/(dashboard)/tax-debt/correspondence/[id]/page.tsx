'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Trash2,
  Clock,
  Mail,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CorrespondenceForm } from '@/components/features/tax-debt'
import { cn } from '@/lib/utils'
import {
  getCorrespondenceById,
  updateCorrespondence,
  deleteCorrespondence,
  updateCorrespondenceStatus,
  type IRSCorrespondence,
} from '@/app/actions/correspondence'
import { getTaxDebts, type TaxDebt } from '@/app/actions/tax-debt'

type CorrespondenceStatus = 'received' | 'in_review' | 'response_sent' | 'resolved' | 'escalated'

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

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getDaysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null
  const deadlineDate = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffMs = deadlineDate.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export default function CorrespondenceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const correspondenceId = params.id as string

  const [correspondence, setCorrespondence] = useState<IRSCorrespondence | null>(null)
  const [taxDebts, setTaxDebts] = useState<TaxDebt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const [correspondenceResult, taxDebtsResult] = await Promise.all([
      getCorrespondenceById(correspondenceId),
      getTaxDebts(),
    ])

    if (!correspondenceResult.success) {
      setError(correspondenceResult.error)
      setIsLoading(false)
      return
    }

    if (!correspondenceResult.data) {
      setError('Correspondence not found')
      setIsLoading(false)
      return
    }

    setCorrespondence(correspondenceResult.data)
    if (taxDebtsResult.success) {
      setTaxDebts(taxDebtsResult.data)
    }
    setIsLoading(false)
  }, [correspondenceId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpdate = async (formData: {
    tax_debt_id: string | null
    notice_date: string
    notice_type: string
    notice_number: string | null
    response_deadline: string | null
    status: 'received' | 'in_review' | 'response_sent' | 'resolved' | 'escalated'
    notes: string | null
  }) => {
    const result = await updateCorrespondence(correspondenceId, formData)
    if (result.success) {
      setCorrespondence(result.data)
      setIsEditing(false)
    } else {
      throw new Error(result.error)
    }
  }

  const handleDelete = async () => {
    if (
      !confirm('Are you sure you want to delete this correspondence? This action cannot be undone.')
    ) {
      return
    }

    setIsDeleting(true)
    const result = await deleteCorrespondence(correspondenceId)
    if (result.success) {
      router.push('/tax-debt/correspondence')
    } else {
      alert(result.error)
      setIsDeleting(false)
    }
  }

  const handleStatusChange = async (newStatus: CorrespondenceStatus) => {
    setIsUpdatingStatus(true)
    const result = await updateCorrespondenceStatus(correspondenceId, newStatus)
    if (result.success) {
      setCorrespondence(result.data)
    } else {
      alert(result.error)
    }
    setIsUpdatingStatus(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !correspondence) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/tax-debt/correspondence">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Correspondence
          </Link>
        </Button>
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
              <h3 className="mt-4 font-medium dark:text-white">
                {error || 'Correspondence not found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The requested correspondence could not be loaded.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[correspondence.status]
  const StatusIcon = statusConfig.icon
  const daysUntil = getDaysUntilDeadline(correspondence.response_deadline)
  const isOverdue =
    daysUntil !== null &&
    daysUntil < 0 &&
    !['resolved', 'response_sent'].includes(correspondence.status)
  const isDueSoon =
    daysUntil !== null &&
    daysUntil >= 0 &&
    daysUntil <= 7 &&
    !['resolved', 'response_sent'].includes(correspondence.status)
  const linkedDebt = taxDebts.find((d) => d.id === correspondence.tax_debt_id)

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel Edit
          </Button>
          <h1 className="text-2xl font-bold dark:text-white">Edit Correspondence</h1>
        </div>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle>Edit Details</CardTitle>
            <CardDescription>Update the information for this correspondence</CardDescription>
          </CardHeader>
          <CardContent>
            <CorrespondenceForm
              taxDebts={taxDebts}
              initialData={{
                tax_debt_id: correspondence.tax_debt_id,
                notice_date: correspondence.notice_date,
                notice_type: correspondence.notice_type,
                notice_number: correspondence.notice_number,
                response_deadline: correspondence.response_deadline,
                status: correspondence.status,
                notes: correspondence.notes,
              }}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              submitLabel="Update"
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/tax-debt/correspondence">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">
              {NOTICE_LABELS[correspondence.notice_type] || correspondence.notice_type}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Notice dated {formatDate(correspondence.notice_date)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Deadline Alert */}
      {(isOverdue || isDueSoon) && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg p-4',
            isOverdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
          )}
        >
          {isOverdue ? (
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          ) : (
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          )}
          <div>
            <p
              className={cn(
                'font-medium',
                isOverdue ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'
              )}
            >
              {isOverdue
                ? `Response Overdue by ${Math.abs(daysUntil!)} day${Math.abs(daysUntil!) !== 1 ? 's' : ''}`
                : `Response Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
            </p>
            <p
              className={cn(
                'text-sm',
                isOverdue ? 'text-red-600 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'
              )}
            >
              Deadline: {formatDate(correspondence.response_deadline)}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details Card */}
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-base">Correspondence Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Notice Type</p>
                <p className="font-medium dark:text-white">
                  {NOTICE_LABELS[correspondence.notice_type] || correspondence.notice_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Notice Date</p>
                <p className="font-medium dark:text-white">
                  {formatDate(correspondence.notice_date)}
                </p>
              </div>
              {correspondence.notice_number && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Notice Number</p>
                  <p className="font-medium dark:text-white">{correspondence.notice_number}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Response Deadline</p>
                <p
                  className={cn(
                    'font-medium',
                    isOverdue
                      ? 'text-red-600 dark:text-red-400'
                      : isDueSoon
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'dark:text-white'
                  )}
                >
                  {formatDate(correspondence.response_deadline)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                <p className="font-medium dark:text-white">
                  {formatDate(correspondence.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="font-medium dark:text-white">
                  {formatDate(correspondence.updated_at)}
                </p>
              </div>
            </div>

            {/* Linked Tax Debt */}
            {linkedDebt && (
              <div className="rounded-lg border p-4 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-medium dark:text-white">Linked Tax Debt</p>
                </div>
                <Link
                  href={`/tax-debt/debts/${linkedDebt.id}`}
                  className="mt-2 block rounded-lg border p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <p className="font-medium dark:text-white">Tax Year {linkedDebt.tax_year}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Balance:{' '}
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(linkedDebt.current_balance)}
                  </p>
                </Link>
              </div>
            )}

            {/* Notes */}
            {correspondence.notes && (
              <div className="rounded-lg border p-4 dark:border-gray-800">
                <p className="text-sm font-medium dark:text-white">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-400">
                  {correspondence.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Status */}
            <div className="flex items-center gap-3 rounded-lg border p-4 dark:border-gray-800">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full',
                  correspondence.status === 'resolved'
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : correspondence.status === 'escalated'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-gray-100 dark:bg-gray-800'
                )}
              >
                <StatusIcon
                  className={cn(
                    'h-6 w-6',
                    correspondence.status === 'resolved'
                      ? 'text-green-600 dark:text-green-400'
                      : correspondence.status === 'escalated'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                  )}
                />
              </div>
              <div>
                <span
                  className={cn('rounded-full px-3 py-1 text-sm font-medium', statusConfig.color)}
                >
                  {statusConfig.label}
                </span>
              </div>
            </div>

            {/* Quick Status Actions */}
            <div className="space-y-2">
              <p className="text-sm font-medium dark:text-white">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {(['received', 'in_review', 'response_sent', 'resolved', 'escalated'] as const).map(
                  (status) => (
                    <Button
                      key={status}
                      variant={correspondence.status === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(status)}
                      disabled={isUpdatingStatus || correspondence.status === status}
                      className="w-full"
                    >
                      {STATUS_CONFIG[status].label}
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Status Description */}
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {correspondence.status === 'received' &&
                  "You've received this notice but haven't started reviewing it yet."}
                {correspondence.status === 'in_review' &&
                  "You're actively reviewing this notice and determining your response."}
                {correspondence.status === 'response_sent' &&
                  "You've sent a response to the IRS and are awaiting their reply."}
                {correspondence.status === 'resolved' &&
                  'This notice has been fully resolved and no further action is needed.'}
                {correspondence.status === 'escalated' &&
                  'This notice has been escalated to a tax professional or requires urgent attention.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
