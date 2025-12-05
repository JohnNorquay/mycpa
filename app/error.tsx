'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to console in development
    console.error('Application Error:', error)

    // Report to Sentry if available
    if (
      typeof window !== 'undefined' &&
      (window as unknown as { Sentry?: { captureException: (e: Error) => void } }).Sentry
    ) {
      ;(
        window as unknown as { Sentry: { captureException: (e: Error) => void } }
      ).Sentry.captureException(error)
    }
  }, [error])

  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md text-center">
        {/* Error Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        {/* Error Message */}
        <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
          Something went wrong
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>

        {/* Error Details (Development Only) */}
        {isDevelopment && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-left dark:bg-red-900/20">
            <div className="flex items-center gap-2 text-sm font-medium text-red-800 dark:text-red-300">
              <Bug className="h-4 w-4" />
              Error Details (Development)
            </div>
            <p className="mt-2 break-all text-xs text-red-700 dark:text-red-400">{error.message}</p>
            {error.digest && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-500">Digest: {error.digest}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Back Link */}
        <button
          onClick={() => window.history.back()}
          className="mt-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-3 w-3" />
          Go back to previous page
        </button>

        {/* Support Info */}
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          If this problem persists, please contact support with the error details.
          {error.digest && (
            <>
              <br />
              Reference ID: {error.digest}
            </>
          )}
        </p>
      </div>
    </div>
  )
}
