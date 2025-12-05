import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md text-center">
        {/* 404 Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <FileQuestion className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>

        {/* 404 Badge */}
        <div className="mt-6">
          <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            404 Error
          </span>
        </div>

        {/* Message */}
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or
          deleted.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Search className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Links</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Dashboard
            </Link>
            <Link
              href="/accounts"
              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Accounts
            </Link>
            <Link
              href="/tax-debt/debts"
              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Tax Debt
            </Link>
            <Link
              href="/documents"
              className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              Documents
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault()
            if (typeof window !== 'undefined') {
              window.history.back()
            }
          }}
          className="mt-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ArrowLeft className="h-3 w-3" />
          Go back to previous page
        </Link>
      </div>
    </div>
  )
}
