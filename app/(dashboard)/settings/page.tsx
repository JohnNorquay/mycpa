import Link from 'next/link'
import { User, CreditCard, Building2, Bell, Shield, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SETTINGS_LINKS = [
  {
    title: 'Profile',
    description: 'Manage your personal information and tax details',
    href: '/settings/profile',
    icon: User,
  },
  {
    title: 'Connected Accounts',
    description: 'Manage bank and financial account connections',
    href: '/settings/accounts',
    icon: Building2,
  },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
      </div>

      <div className="grid gap-4">
        {SETTINGS_LINKS.map((link) => {
          const Icon = link.icon
          return (
            <Link key={link.href} href={link.href}>
              <Card className="transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium dark:text-white">{link.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{link.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Coming Soon Section */}
      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="text-base dark:text-white">Coming Soon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <Bell className="h-5 w-5" />
            <span className="text-sm">Notification preferences</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <Shield className="h-5 w-5" />
            <span className="text-sm">Security settings</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <CreditCard className="h-5 w-5" />
            <span className="text-sm">Billing and subscription</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
