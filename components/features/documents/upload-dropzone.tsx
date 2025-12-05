'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, File, X, AlertCircle, FileText, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { validateFile, ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE } from '@/lib/documents/upload'

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  disabled?: boolean
  className?: string
}

interface SelectedFile {
  file: File
  error?: string
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

export function UploadDropzone({
  onFilesSelected,
  maxFiles = 10,
  disabled = false,
  className,
}: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const processed: SelectedFile[] = []

      for (const file of fileArray) {
        if (processed.length + selectedFiles.length >= maxFiles) {
          break
        }

        const validation = validateFile(file)
        processed.push({
          file,
          error: validation.valid ? undefined : validation.error,
        })
      }

      setSelectedFiles((prev) => [...prev, ...processed])
    },
    [maxFiles, selectedFiles.length]
  )

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragActive(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragActive(true)
      }
    },
    [disabled]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)

      if (disabled) return

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files)
      }
    },
    [disabled, processFiles]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files)
      }
      // Reset input so same file can be selected again
      e.target.value = ''
    },
    [processFiles]
  )

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleUpload = useCallback(() => {
    const validFiles = selectedFiles.filter((f) => !f.error).map((f) => f.file)
    if (validFiles.length > 0) {
      onFilesSelected(validFiles)
      setSelectedFiles([])
    }
  }, [selectedFiles, onFilesSelected])

  const handleClearAll = useCallback(() => {
    setSelectedFiles([])
  }, [])

  const validFilesCount = selectedFiles.filter((f) => !f.error).length
  const hasErrors = selectedFiles.some((f) => f.error)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_DOCUMENT_TYPES.join(',')}
          multiple
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-full',
              isDragActive ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-gray-100 dark:bg-gray-800'
            )}
          >
            <Upload
              className={cn(
                'h-7 w-7',
                isDragActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
              )}
            />
          </div>

          <div className="mt-4">
            <p className="text-base font-medium dark:text-white">
              {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              or{' '}
              <button
                type="button"
                onClick={handleBrowseClick}
                disabled={disabled}
                className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                browse your computer
              </button>
            </p>
          </div>

          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            PDF, JPG, PNG, or HEIC up to {MAX_FILE_SIZE / 1024 / 1024}MB
          </p>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium dark:text-white">
              Selected Files ({selectedFiles.length})
            </p>
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Clear all
            </button>
          </div>

          <div className="divide-y rounded-lg border dark:divide-gray-800 dark:border-gray-800">
            {selectedFiles.map((item, index) => {
              const FileIcon = getFileIcon(item.file)
              return (
                <div
                  key={`${item.file.name}-${index}`}
                  className={cn(
                    'flex items-center gap-3 p-3',
                    item.error && 'bg-red-50 dark:bg-red-900/10'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                      item.error ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'
                    )}
                  >
                    {item.error ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <FileIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-sm font-medium',
                        item.error ? 'text-red-700 dark:text-red-400' : 'dark:text-white'
                      )}
                    >
                      {item.file.name}
                    </p>
                    {item.error ? (
                      <p className="text-xs text-red-600 dark:text-red-500">{item.error}</p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(item.file.size)}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>

          {hasErrors && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Some files cannot be uploaded. Remove invalid files to continue.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClearAll}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={validFilesCount === 0}>
              Upload {validFilesCount} file{validFilesCount !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
