'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Building2,
  CreditCard,
  RefreshCw,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface Account {
  id: string
  name: string
  type: string | null
  subtype: string | null
  current_balance: number | null
  available_balance: number | null
  last_synced: string | null
}

interface PlaidItem {
  id: string
  institution_name: string | null
  created_at: string
  last_synced: string | null
  accounts: Account[]
}

interface AccountsListProps {
  items: PlaidItem[]
}

export function AccountsList({ items: initialItems }: AccountsListProps) {
  const [items, setItems] = useState(initialItems)
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null)
  const [disconnectingItemId, setDisconnectingItemId] = useState<string | null>(null)

  const handleSync = async (itemId: string) => {
    setSyncingItemId(itemId)
    try {
      const response = await fetch('/api/plaid/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plaid_item_id: itemId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Sync failed')
      }

      const data = await response.json()
      toast.success(`Synced ${data.synced} account(s) successfully`)

      // Refresh the page to get updated data
      window.location.reload()
    } catch (error) {
      console.error('Error syncing:', error)
      toast.error('Failed to sync transactions')
    } finally {
      setSyncingItemId(null)
    }
  }

  const handleDisconnect = async (itemId: string, institutionName: string | null) => {
    if (
      !confirm(
        `Are you sure you want to disconnect ${institutionName || 'this account'}? This will remove all associated transactions.`
      )
    ) {
      return
    }

    setDisconnectingItemId(itemId)
    try {
      const response = await fetch(`/api/plaid/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plaid_item_id: itemId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Disconnect failed')
      }

      toast.success(`${institutionName || 'Account'} disconnected successfully`)

      // Remove from local state
      setItems(items.filter((item) => item.id !== itemId))
    } catch (error) {
      console.error('Error disconnecting:', error)
      toast.error('Failed to disconnect account')
    } finally {
      setDisconnectingItemId(null)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatLastSynced = (date: string | null) => {
    if (!date) return 'Never'
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  const getAccountIcon = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'credit':
        return <CreditCard className="h-4 w-4" />
      default:
        return <Building2 className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg dark:text-white">
                  {item.institution_name || 'Unknown Institution'}
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Connected {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync(item.id)}
                disabled={syncingItemId === item.id}
              >
                {syncingItemId === item.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Sync
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => handleDisconnect(item.id, item.institution_name)}
                disabled={disconnectingItemId === item.id}
              >
                {disconnectingItemId === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {item.last_synced ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Last synced {formatLastSynced(item.last_synced)}
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Never synced
                </>
              )}
            </div>

            {item.accounts && item.accounts.length > 0 ? (
              <div className="divide-y dark:divide-gray-800">
                {item.accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        {getAccountIcon(account.type)}
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">{account.name}</p>
                        <p className="text-sm capitalize text-gray-500 dark:text-gray-400">
                          {account.subtype || account.type || 'Account'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium dark:text-white">
                        {formatCurrency(account.current_balance)}
                      </p>
                      {account.available_balance !== null &&
                        account.available_balance !== account.current_balance && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatCurrency(account.available_balance)} available
                          </p>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No accounts found. Try syncing to fetch account data.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
