'use client'

import { useState, useCallback } from 'react'
import { usePlaidLink, PlaidLinkOnSuccess, PlaidLinkOnExit } from 'react-plaid-link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Building2 } from 'lucide-react'

interface PlaidLinkButtonProps {
  onSuccess?: (itemId: string, institutionName: string | null) => void
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  children?: React.ReactNode
}

export function PlaidLinkButton({
  onSuccess,
  variant = 'default',
  size = 'default',
  className,
  children,
}: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExchanging, setIsExchanging] = useState(false)

  // Fetch link token from API
  const fetchLinkToken = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create link token')
      }

      const data = await response.json()
      setLinkToken(data.link_token)
    } catch (error) {
      console.error('Error fetching link token:', error)
      toast.error('Failed to initialize bank connection')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle successful Plaid Link
  const handleSuccess: PlaidLinkOnSuccess = useCallback(
    async (publicToken) => {
      setIsExchanging(true)
      try {
        // Exchange public token for access token
        const response = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ public_token: publicToken }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to exchange token')
        }

        const data = await response.json()

        // Trigger initial sync
        const syncResponse = await fetch('/api/plaid/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plaid_item_id: data.item_id }),
        })

        if (!syncResponse.ok) {
          console.warn('Initial sync failed, transactions will sync later')
        }

        toast.success(
          data.institution_name
            ? `${data.institution_name} connected successfully`
            : 'Bank account connected successfully'
        )

        // Reset link token to allow reconnecting another account
        setLinkToken(null)

        // Call parent callback
        onSuccess?.(data.item_id, data.institution_name)
      } catch (error) {
        console.error('Error exchanging token:', error)
        toast.error('Failed to connect bank account')
      } finally {
        setIsExchanging(false)
      }
    },
    [onSuccess]
  )

  // Handle Plaid Link exit
  const handleExit: PlaidLinkOnExit = useCallback((error) => {
    if (error) {
      console.error('Plaid Link error:', error)
      toast.error('Bank connection was interrupted')
    }
    // Reset link token on exit so user can try again
    setLinkToken(null)
  }, [])

  // Plaid Link hook
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleSuccess,
    onExit: handleExit,
  })

  // Handle button click
  const handleClick = useCallback(async () => {
    if (linkToken && ready) {
      open()
    } else {
      await fetchLinkToken()
    }
  }, [linkToken, ready, open, fetchLinkToken])

  // Open Plaid Link when token becomes available
  const handleOpenLink = useCallback(() => {
    if (linkToken && ready && !isExchanging) {
      open()
    }
  }, [linkToken, ready, isExchanging, open])

  // Auto-open when link token is ready
  if (linkToken && ready && !isExchanging) {
    // Use setTimeout to avoid calling open during render
    setTimeout(handleOpenLink, 0)
  }

  const isDisabled = isLoading || isExchanging

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isDisabled}
    >
      {isDisabled ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {isExchanging ? 'Connecting...' : 'Loading...'}
        </>
      ) : (
        children || (
          <>
            <Building2 className="h-4 w-4" />
            Connect Bank Account
          </>
        )
      )}
    </Button>
  )
}
