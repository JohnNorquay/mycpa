import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CashFlowPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Cash Flow</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Monitor income, expenses, and cash flow trends
        </p>
      </div>

      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="dark:text-white">Coming Soon</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Cash Flow analytics are under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Soon you&apos;ll be able to view your income and expense trends, forecast future cash
            flow, and optimize your financial planning.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
