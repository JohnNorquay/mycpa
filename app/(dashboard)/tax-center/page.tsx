import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TaxCenterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Tax Center</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Tax planning, estimates, and deduction tracking
        </p>
      </div>

      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="dark:text-white">Coming Soon</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Tax planning tools are under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Soon you&apos;ll be able to estimate your tax liability, track deductions, and plan
            quarterly payments.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
