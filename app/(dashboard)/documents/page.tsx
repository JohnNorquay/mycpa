import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight dark:text-white">Documents</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Store and manage your tax documents securely
        </p>
      </div>

      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle className="dark:text-white">Coming Soon</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Document storage is under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Soon you&apos;ll be able to upload and store tax documents, organize them by year and
            type, and access them securely.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
