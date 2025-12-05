'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  X,
  FileText,
  Image,
  File,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { uploadDocument } from '@/app/actions/documents'

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error'

interface FileUpload {
  id: string
  file: File
  taxYear: number
  status: UploadStatus
  progress: number
  error?: string
  documentId?: string
}

interface UploadProgressProps {
  files: File[]
  taxYear: number
  onComplete: () => void
  onCancel: () => void
  className?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(file: File) {
  if (file.type === 'application/pdf') {
    return FileText
  }
  if (file.type.startsWith('image/')) {
    return Image
  }
  return File
}

function getStatusIcon(status: UploadStatus) {
  switch (status) {
    case 'uploading':
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />
    default:
      return <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
  }
}

export function UploadProgress({
  files,
  taxYear,
  onComplete,
  onCancel,
  className,
}: UploadProgressProps) {
  const [uploads, setUploads] = useState<FileUpload[]>(() =>
    files.map((file, index) => ({
      id: `upload-${index}-${Date.now()}`,
      file,
      taxYear,
      status: 'pending',
      progress: 0,
    }))
  )
  const [isUploading, setIsUploading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const uploadFile = useCallback(async (upload: FileUpload) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === upload.id ? { ...u, status: 'uploading', progress: 20 } : u))
    )

    try {
      const formData = new FormData()
      formData.append('file', upload.file)
      formData.append('taxYear', upload.taxYear.toString())

      // Simulate progress updates
      setUploads((prev) => prev.map((u) => (u.id === upload.id ? { ...u, progress: 50 } : u)))

      const result = await uploadDocument(formData)

      setUploads((prev) => prev.map((u) => (u.id === upload.id ? { ...u, progress: 80 } : u)))

      if (result.success) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? { ...u, status: 'success', progress: 100, documentId: result.data.documentId }
              : u
          )
        )
      } else {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: 'error', progress: 100, error: result.error } : u
          )
        )
      }
    } catch {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === upload.id ? { ...u, status: 'error', progress: 100, error: 'Upload failed' } : u
        )
      )
    }
  }, [])

  // Start uploading files sequentially
  useEffect(() => {
    if (isUploading) return
    if (currentIndex >= uploads.length) return

    const currentUpload = uploads[currentIndex]
    if (!currentUpload || currentUpload.status !== 'pending') {
      // Use setTimeout to avoid setState in effect body
      const timer = setTimeout(() => setCurrentIndex((prev) => prev + 1), 0)
      return () => clearTimeout(timer)
    }

    let mounted = true
    setIsUploading(true)
    uploadFile(currentUpload).then(() => {
      if (!mounted) return
      setIsUploading(false)
      setCurrentIndex((prev) => prev + 1)
    })
    return () => {
      mounted = false
    }
  }, [currentIndex, uploads, isUploading, uploadFile])

  // Check if all uploads are complete
  const allComplete = uploads.every((u) => u.status === 'success' || u.status === 'error')
  const successCount = uploads.filter((u) => u.status === 'success').length
  const errorCount = uploads.filter((u) => u.status === 'error').length

  const handleRetry = useCallback((uploadId: string) => {
    setUploads((prev) =>
      prev.map((u) =>
        u.id === uploadId ? { ...u, status: 'pending', progress: 0, error: undefined } : u
      )
    )
  }, [])

  const handleCancelFile = useCallback((uploadId: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== uploadId))
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium dark:text-white">
            {allComplete
              ? `Upload Complete`
              : `Uploading ${currentIndex + 1} of ${uploads.length}...`}
          </h3>
          {allComplete && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {successCount} successful{errorCount > 0 && `, ${errorCount} failed`}
            </p>
          )}
        </div>
        {!allComplete && (
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="mr-1 h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>

      {/* Progress List */}
      <div className="divide-y rounded-lg border dark:divide-gray-800 dark:border-gray-800">
        {uploads.map((upload) => {
          const FileIcon = getFileIcon(upload.file)
          return (
            <div key={upload.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <FileIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium dark:text-white">
                      {upload.file.name}
                    </p>
                    {getStatusIcon(upload.status)}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(upload.file.size)}
                    {upload.status === 'uploading' && ' • Uploading...'}
                    {upload.status === 'success' && ' • Processing started'}
                    {upload.status === 'error' && (
                      <span className="text-red-500"> • {upload.error}</span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  {upload.status === 'error' && (
                    <Button variant="ghost" size="sm" onClick={() => handleRetry(upload.id)}>
                      Retry
                    </Button>
                  )}
                  {upload.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleCancelFile(upload.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {(upload.status === 'uploading' || upload.status === 'pending') && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary and Actions */}
      {allComplete && (
        <div className="space-y-3">
          {errorCount > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                {errorCount} file{errorCount !== 1 ? 's' : ''} failed to upload. You can retry or
                continue.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            {errorCount > 0 && (
              <Button
                variant="outline"
                onClick={() => {
                  uploads.forEach((u) => {
                    if (u.status === 'error') {
                      handleRetry(u.id)
                    }
                  })
                }}
              >
                Retry All Failed
              </Button>
            )}
            <Button onClick={onComplete}>{successCount > 0 ? 'Done' : 'Close'}</Button>
          </div>
        </div>
      )}
    </div>
  )
}
