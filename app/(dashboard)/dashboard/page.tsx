import { DollarSign, TrendingUp, CreditCard, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const kpiCards = [
  {
    title: 'Cash Balance',
    value: '$0.00',
    description: 'Current total balance',
    icon: DollarSign,
    trend: null,
  },
  {
    title: 'Tax Debt',
    value: '$0.00',
    description: 'Total outstanding',
    icon: AlertCircle,
    trend: null,
  },
  {
    title: 'Monthly Income',
    value: '$0.00',
    description: 'This month',
    icon: TrendingUp,
    trend: null,
  },
  {
    title: 'Monthly Expenses',
    value: '$0.00',
    description: 'This month',
    icon: CreditCard,
    trend: null,
  },
]

const recentActivity = [
  {
    id: 1,
    type: 'welcome',
    message: 'Welcome to CPA Bot! Get started by connecting your bank account.',
    timestamp: new Date().toISOString(),
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Overview of your financial health</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Card key={card.title} className="dark:border-gray-800 dark:bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-400">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-gray-500 dark:text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{card.value}</div>
              <p className="text-xs text-gray-500 dark:text-gray-500">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Cash Flow Chart Placeholder */}
        <Card className="lg:col-span-4 dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Cash Flow</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Income vs expenses over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Connect your bank to view cash flow data
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3 dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="dark:text-white">Recent Activity</CardTitle>
            <CardDescription className="dark:text-gray-400">
              Latest updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 rounded-lg border p-4 dark:border-gray-800"
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-sm dark:text-gray-200">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Just now</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="dark:text-white">Quick Actions</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Get started with these common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <QuickActionCard
              title="Connect Bank"
              description="Link your bank accounts to automatically import transactions"
              href="/settings/accounts"
            />
            <QuickActionCard
              title="Add Tax Debt"
              description="Track your IRS or state tax obligations"
              href="/tax-debt/add"
            />
            <QuickActionCard
              title="Upload Document"
              description="Store important tax documents securely"
              href="/documents/upload"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="block rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
    >
      <h3 className="font-semibold dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </a>
  )
}
