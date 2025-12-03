import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TaxDebtPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Tax Debt</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Track and manage your IRS and state tax obligations
        </p>
      </div>

      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="dark:text-white">Coming Soon</CardTitle>
          <CardDescription className="dark:text-gray-400">
            The Tax Debt tracker is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Soon you&apos;ll be able to track your tax debts, view payment schedules, calculate
            relief options, and monitor IRS correspondence.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
