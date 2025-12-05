'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Loader2,
  FileText,
  Image as ImageIcon,
  File as FileIcon,
  Search,
  Grid,
  List,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { UploadDropzone } from '@/components/features/documents/upload-dropzone'
import { UploadProgress } from '@/components/features/documents/upload-progress'
import { ProcessingStatusBadge } from '@/components/features/documents/processing-status'
import { getDocuments, type TaxDocument } from '@/app/actions/documents'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list'

const currentYear = new Date().getFullYear()
const TAX_YEARS = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3]

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  w2: 'W-2',
  '1099_misc': '1099-MISC',
  '1099_nec': '1099-NEC',
  '1099_int': '1099-INT',
  '1099_div': '1099-DIV',
  irs_notice: 'IRS Notice',
  unknown: 'Unknown',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getFileNameFromPath(filePath: string): string {
  return filePath.split('/').pop() || filePath
}

// Extended type to include the fields from the migration
interface ExtendedTaxDocument extends TaxDocument {
  file_name?: string
  file_size?: number
  mime_type?: string
  processing_status?: string
  extracted_text?: string
  extraction_confidence?: number
}

export default function DocumentsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState<ExtendedTaxDocument[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')
  const [selectedType, setSelectedType] = useState<string | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<string | 'all'>('all')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploadTaxYear, setUploadTaxYear] = useState(currentYear)

  const loadDocuments = useCallback(async () => {
    setIsLoading(true)
    const result = await getDocuments()
    if (result.success) {
      setDocuments(result.data as ExtendedTaxDocument[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    loadDocuments().then(() => {
      if (!mounted) return
    })
    return () => {
      mounted = false
    }
  }, [loadDocuments])

  // Compute filtered documents using useMemo instead of useEffect
  const computedFilteredDocuments = (() => {
    let filtered = [...documents]

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (doc) =>
          getFileNameFromPath(doc.file_path).toLowerCase().includes(query) ||
          (doc.document_type && doc.document_type.toLowerCase().includes(query))
      )
    }

    // Filter by year
    if (selectedYear !== 'all') {
      filtered = filtered.filter((doc) => doc.tax_year === selectedYear)
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((doc) => doc.document_type === selectedType)
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((doc) => doc.processing_status === selectedStatus)
    }

    // Sort by upload date descending
    filtered.sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime())

    return filtered
  })()

  const handleFilesSelected = (files: File[]) => {
    setUploadFiles(files)
    setShowUpload(false)
  }

  const handleUploadComplete = () => {
    setUploadFiles([])
    loadDocuments()
  }

  const handleUploadCancel = () => {
    setUploadFiles([])
  }

  // Get unique document types from documents
  const documentTypes = Array.from(new Set(documents.map((d) => d.document_type).filter(Boolean)))

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Documents</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Upload and manage your tax documents
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Documents
        </Button>
      </div>

      {/* Upload Zone */}
      {showUpload && uploadFiles.length === 0 && (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium dark:text-white">Upload Documents</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Drag and drop files or click to browse
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-500 dark:text-gray-400">Tax Year:</Label>
                <select
                  value={uploadTaxYear}
                  onChange={(e) => setUploadTaxYear(parseInt(e.target.value))}
                  className="rounded-md border px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {TAX_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <UploadDropzone onFilesSelected={handleFilesSelected} maxFiles={10} />
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => setShowUpload(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {uploadFiles.length > 0 && (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="p-6">
            <UploadProgress
              files={uploadFiles}
              taxYear={uploadTaxYear}
              onComplete={handleUploadComplete}
              onCancel={handleUploadCancel}
            />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Year Filter */}
        <select
          value={selectedYear}
          onChange={(e) =>
            setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))
          }
          className="rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All Years</option>
          {TAX_YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All Types</option>
          {documentTypes.map((type) => (
            <option key={type} value={type || ''}>
              {DOCUMENT_TYPE_LABELS[type || ''] || type}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-lg border p-1 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={cn(
              'rounded p-1.5',
              viewMode === 'grid'
                ? 'bg-gray-100 dark:bg-gray-800'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'rounded p-1.5',
              viewMode === 'list'
                ? 'bg-gray-100 dark:bg-gray-800'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Document Count */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {computedFilteredDocuments.length} document
        {computedFilteredDocuments.length !== 1 ? 's' : ''}
        {computedFilteredDocuments.length !== documents.length && ` (${documents.length} total)`}
      </p>

      {/* Documents */}
      {computedFilteredDocuments.length === 0 ? (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h3 className="mt-4 font-medium dark:text-white">No documents found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {documents.length === 0
                ? 'Upload your first document to get started'
                : 'Try adjusting your filters'}
            </p>
            {documents.length === 0 && (
              <Button className="mt-4" onClick={() => setShowUpload(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {computedFilteredDocuments.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      ) : (
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <div className="divide-y dark:divide-gray-800">
            {computedFilteredDocuments.map((doc) => (
              <DocumentRow key={doc.id} document={doc} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function renderFileIcon(filePath: string) {
  const ext = filePath.split('.').pop()?.toLowerCase()
  const className = 'h-5 w-5 text-gray-500 dark:text-gray-400'
  if (ext === 'pdf') return <FileText className={className} />
  if (['jpg', 'jpeg', 'png', 'heic'].includes(ext || '')) return <ImageIcon className={className} />
  return <FileIcon className={className} />
}

function DocumentCard({ document }: { document: ExtendedTaxDocument }) {
  const fileName = document.file_name || getFileNameFromPath(document.file_path)
  const status = (document.processing_status || (document.processed ? 'completed' : 'pending')) as
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'

  return (
    <Link href={`/documents/${document.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              {renderFileIcon(document.file_path)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium dark:text-white">{fileName}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {document.tax_year}
                </span>
                {document.document_type && (
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <ProcessingStatusBadge status={status} />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {formatDate(document.upload_date)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function DocumentRow({ document }: { document: ExtendedTaxDocument }) {
  const fileName = document.file_name || getFileNameFromPath(document.file_path)
  const status = (document.processing_status || (document.processed ? 'completed' : 'pending')) as
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'

  return (
    <Link
      href={`/documents/${document.id}`}
      className="flex items-center gap-4 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
        {renderFileIcon(document.file_path)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium dark:text-white">{fileName}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{document.tax_year}</span>
          {document.document_type && (
            <>
              <span>-</span>
              <span>{DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}</span>
            </>
          )}
        </div>
      </div>
      <ProcessingStatusBadge status={status} />
      <span className="flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
        {formatDate(document.upload_date)}
      </span>
    </Link>
  )
}
