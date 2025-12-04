import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlaidLinkButton } from '@/components/features/transactions'
import { AccountsList } from './accounts-list'

export default async function AccountsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch connected plaid items with their accounts
  const { data: plaidItems } = await supabase
    .from('plaid_items')
    .select(
      `
      id,
      institution_name,
      created_at,
      last_synced,
      accounts (
        id,
        name,
        type,
        subtype,
        current_balance,
        available_balance,
        last_synced
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Connected Accounts</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your connected bank accounts and financial institutions
        </p>
      </div>

      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="dark:text-white">Add Bank Account</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Securely connect your bank accounts to import transactions automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlaidLinkButton />
        </CardContent>
      </Card>

      {plaidItems && plaidItems.length > 0 ? (
        <AccountsList items={plaidItems} />
      ) : (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No bank accounts connected yet. Connect your first account to start tracking
                transactions.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
