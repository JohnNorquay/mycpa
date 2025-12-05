'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CorrespondenceForm } from '@/components/features/tax-debt'
import { createCorrespondence } from '@/app/actions/correspondence'
import { getTaxDebts, type TaxDebt } from '@/app/actions/tax-debt'

export default function NewCorrespondencePage() {
  const router = useRouter()
  const [taxDebts, setTaxDebts] = useState<TaxDebt[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTaxDebts = useCallback(async () => {
    const result = await getTaxDebts()
    if (result.success) {
      setTaxDebts(result.data)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadTaxDebts()
  }, [loadTaxDebts])

  const handleSubmit = async (formData: {
    tax_debt_id: string | null
    notice_date: string
    notice_type: string
    notice_number: string | null
    response_deadline: string | null
    status: 'received' | 'in_review' | 'response_sent' | 'resolved' | 'escalated'
    notes: string | null
  }) => {
    const result = await createCorrespondence({
      ...formData,
      document_id: null,
    })
    if (result.success) {
      router.push(`/tax-debt/correspondence/${result.data.id}`)
    } else {
      throw new Error(result.error)
    }
  }

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/tax-debt/correspondence">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Add IRS Correspondence</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track a new notice or letter from the IRS
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>Correspondence Details</CardTitle>
          <CardDescription>
            Enter the details from your IRS notice or letter. Be sure to note any response
            deadlines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CorrespondenceForm
            taxDebts={taxDebts}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/tax-debt/correspondence')}
            submitLabel="Add Correspondence"
          />
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-base">Common IRS Notices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <strong className="text-gray-900 dark:text-white">CP14:</strong> Initial balance due
            notice. Usually gives 21 days to pay or respond.
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">CP501/CP503:</strong> Reminder notices
            for unpaid balance. CP503 is the second reminder.
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">CP504:</strong> Intent to Levy notice.
            This is serious - you typically have 30 days to respond.
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">CP523:</strong> Notice that your
            Installment Agreement is in default.
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">CP2000:</strong> Notice of unreported
            income. You usually have 30 days to respond.
          </div>
          <div>
            <strong className="text-gray-900 dark:text-white">Letter 1058/LT11:</strong> Final
            Notice of Intent to Levy. You have 30 days to appeal.
          </div>
          <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
            <p className="text-amber-700 dark:text-amber-400">
              <strong>Important:</strong> Response deadlines are critical. Missing a deadline can
              result in levies, liens, or loss of appeal rights.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
