import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Transactions</h1>
        <p className="text-gray-500 dark:text-gray-400">
          View and categorize your financial transactions
        </p>
      </div>

      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="dark:text-white">Coming Soon</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Transaction management is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Soon you&apos;ll be able to view all your bank transactions, auto-categorize them, and
            track spending patterns.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
