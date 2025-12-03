export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
}
