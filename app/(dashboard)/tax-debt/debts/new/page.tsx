'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DebtForm, type TaxDebtFormData } from '@/components/features/tax-debt'
import { createTaxDebt } from '@/app/actions/tax-debt'

export default function NewTaxDebtPage() {
  const router = useRouter()

  const handleSubmit = async (formData: TaxDebtFormData) => {
    const result = await createTaxDebt(formData)
    if (result.success) {
      router.push(`/tax-debt/debts/${result.data.id}`)
    } else {
      throw new Error(result.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/tax-debt/debts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Add Tax Debt</h1>
          <p className="text-gray-500 dark:text-gray-400">Track a new IRS tax obligation</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>Tax Debt Details</CardTitle>
          <CardDescription>
            Enter the details of your tax debt. You can find this information on IRS notices or your
            tax transcripts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DebtForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/tax-debt/debts')}
            submitLabel="Add Tax Debt"
          />
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-base">Where to Find This Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong className="text-gray-900 dark:text-white">IRS Notices:</strong> CP14, CP501,
            CP503, and CP504 notices contain your tax year, amount owed, and payment due dates.
          </p>
          <p>
            <strong className="text-gray-900 dark:text-white">Tax Transcripts:</strong> Request an
            Account Transcript from the IRS to see your exact balance, penalties, and interest.
          </p>
          <p>
            <strong className="text-gray-900 dark:text-white">IRS Online Account:</strong> Create an
            account at irs.gov to view your balance and payment history online.
          </p>
          <p>
            <strong className="text-gray-900 dark:text-white">Collection Statute (CSED):</strong>{' '}
            The IRS generally has 10 years from the assessment date to collect. This date is on your
            Account Transcript.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
