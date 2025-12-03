# Technical Specification: Documents

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Document Module                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │    Upload       │  │   Processing    │  │  Document   │  │
│  │    Handler      │──▶   Pipeline      │──▶  Library    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│           │                    │                   │        │
│           ▼                    ▼                   ▼        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Supabase      │  │  Claude Vision  │  │   Search    │  │
│  │   Storage       │  │     OCR         │  │   Index     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
app/(dashboard)/
├── documents/
│   ├── page.tsx                   # Document library
│   └── [id]/page.tsx              # Document detail

components/features/documents/
├── upload-dropzone.tsx
├── upload-progress.tsx
├── document-library.tsx
├── document-grid.tsx
├── document-list.tsx
├── document-card.tsx
├── document-preview.tsx
├── document-detail-panel.tsx
├── extracted-data-display.tsx
├── extracted-data-editor.tsx
├── document-filters.tsx
├── document-search.tsx
└── processing-status.tsx

lib/
├── documents/
│   ├── upload.ts
│   ├── ocr-processor.ts
│   ├── classifier.ts
│   └── extractor.ts

actions/
├── documents.ts

inngest/functions/
├── process-document.ts
```

## Upload System

```typescript
// lib/documents/upload.ts

interface UploadOptions {
  taxYear: number
  documentType?: DocumentType
  notes?: string
}

interface UploadResult {
  id: string
  path: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function uploadDocument(
  file: File,
  userId: string,
  options: UploadOptions
): Promise<UploadResult> {
  // Validate file
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} not supported`)
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit')
  }

  // Generate unique filename
  const ext = file.name.split('.').pop()
  const filename = `${generateId()}.${ext}`
  const path = `${userId}/${options.taxYear}/${options.documentType ?? 'unclassified'}/${filename}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, file)

  if (uploadError) throw uploadError

  // Create database record
  const { data, error: dbError } = await supabase
    .from('tax_documents')
    .insert({
      user_id: userId,
      original_filename: file.name,
      storage_path: path,
      file_type: file.type,
      file_size: file.size,
      tax_year: options.taxYear,
      document_type: options.documentType,
      notes: options.notes,
      processing_status: 'pending'
    })
    .select()
    .single()

  if (dbError) throw dbError

  // Trigger processing
  await inngest.send({
    name: 'document/uploaded',
    data: { documentId: data.id }
  })

  return {
    id: data.id,
    path,
    status: 'pending'
  }
}

export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, 3600) // 1 hour

  if (error) throw error
  return data.signedUrl
}
```

## OCR Processing Pipeline

```typescript
// lib/documents/ocr-processor.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

interface OCRResult {
  rawText: string
  documentType: DocumentType
  confidence: number
  extractedData: Record<string, any>
}

export async function processDocument(documentId: string): Promise<OCRResult> {
  const document = await getDocument(documentId)
  const signedUrl = await getSignedUrl(document.storage_path)

  // Fetch document content
  const response = await fetch(signedUrl)
  const buffer = await response.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')

  // Determine media type
  const mediaType = document.file_type === 'application/pdf'
    ? 'application/pdf'
    : document.file_type as 'image/jpeg' | 'image/png' | 'image/webp'

  // Process with Claude Vision
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64
          }
        },
        {
          type: 'text',
          text: `Analyze this document and extract information.

1. First, identify the document type from this list:
   - W2 (Wage and Tax Statement)
   - 1099-MISC (Miscellaneous Income)
   - 1099-NEC (Nonemployee Compensation)
   - 1099-INT (Interest Income)
   - 1099-DIV (Dividends)
   - 1099-B (Broker Transactions)
   - 1099-R (Retirement Distributions)
   - 1098 (Mortgage Interest)
   - Property Tax Bill
   - Charitable Donation Receipt
   - Medical Bill/Statement
   - IRS Notice/Letter
   - Other

2. Extract all text from the document.

3. For tax forms (W2, 1099, 1098), extract the specific box values.

Respond with JSON in this format:
{
  "documentType": "string",
  "confidence": 0.0-1.0,
  "rawText": "full extracted text",
  "extractedData": {
    // Document-specific fields
  }
}`
        }
      ]
    }]
  })

  const result = JSON.parse(message.content[0].type === 'text' ? message.content[0].text : '{}')

  return {
    rawText: result.rawText,
    documentType: result.documentType,
    confidence: result.confidence,
    extractedData: result.extractedData
  }
}
```

## Document Classifier

```typescript
// lib/documents/classifier.ts

type DocumentType =
  | 'w2'
  | '1099_misc'
  | '1099_nec'
  | '1099_int'
  | '1099_div'
  | '1099_b'
  | '1099_r'
  | '1098'
  | 'property_tax'
  | 'charitable_receipt'
  | 'medical_bill'
  | 'irs_notice'
  | 'other'

interface ClassificationResult {
  type: DocumentType
  confidence: number
  alternativeTypes: { type: DocumentType; confidence: number }[]
}

const CLASSIFICATION_PROMPT = `Classify this document into one of these categories:
- w2: Wage and Tax Statement (Form W-2)
- 1099_misc: Miscellaneous Income (Form 1099-MISC)
- 1099_nec: Nonemployee Compensation (Form 1099-NEC)
- 1099_int: Interest Income (Form 1099-INT)
- 1099_div: Dividends (Form 1099-DIV)
- 1099_b: Broker Transactions (Form 1099-B)
- 1099_r: Retirement Distributions (Form 1099-R)
- 1098: Mortgage Interest Statement (Form 1098)
- property_tax: Property Tax Bill
- charitable_receipt: Charitable Donation Receipt
- medical_bill: Medical Bill or Statement
- irs_notice: IRS Notice or Letter
- other: Unclassified document

Respond with JSON: {"type": "...", "confidence": 0.0-1.0, "alternativeTypes": [...]}`
```

## Data Extractors

```typescript
// lib/documents/extractor.ts

interface W2Data {
  employerName: string
  employerEIN: string
  employerAddress: string
  employeeName: string
  employeeSSN: string // Last 4 only for display
  employeeAddress: string
  box1_wages: number
  box2_federalWithheld: number
  box3_socialSecurityWages: number
  box4_socialSecurityTax: number
  box5_medicareWages: number
  box6_medicareTax: number
  box16_stateWages: number
  box17_stateWithheld: number
  state: string
}

interface Form1099Data {
  payerName: string
  payerTIN: string
  recipientName: string
  recipientTIN: string
  box1_amount: number
  box4_federalWithheld?: number
}

interface Form1098Data {
  lenderName: string
  box1_mortgageInterest: number
  box2_outstandingPrincipal: number
  box5_mortgageInsurance?: number
  propertyAddress?: string
}

interface IRSNoticeData {
  noticeType: string
  noticeNumber: string
  taxYear: number
  amountDue?: number
  responseDeadline?: Date
  keyActions: string[]
}

const W2_EXTRACTION_PROMPT = `Extract the following fields from this W-2 form.
Return JSON with these exact field names:
{
  "employerName": "",
  "employerEIN": "",
  "employerAddress": "",
  "employeeName": "",
  "employeeSSN": "XXX-XX-1234",  // Last 4 digits only
  "employeeAddress": "",
  "box1_wages": 0,
  "box2_federalWithheld": 0,
  "box3_socialSecurityWages": 0,
  "box4_socialSecurityTax": 0,
  "box5_medicareWages": 0,
  "box6_medicareTax": 0,
  "box16_stateWages": 0,
  "box17_stateWithheld": 0,
  "state": ""
}

For each field, also include a confidence score (0.0-1.0) in a separate "confidence" object.`

export async function extractW2Data(base64Image: string): Promise<{
  data: W2Data
  confidence: Record<keyof W2Data, number>
}> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: base64Image }
        },
        { type: 'text', text: W2_EXTRACTION_PROMPT }
      ]
    }]
  })

  return JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '{}')
}
```

## Inngest Processing Function

```typescript
// inngest/functions/process-document.ts
import { inngest } from '../client'

export const processDocumentFunction = inngest.createFunction(
  {
    id: 'process-document',
    retries: 3,
    throttle: {
      limit: 10,
      period: '1m'
    }
  },
  { event: 'document/uploaded' },
  async ({ event, step }) => {
    const { documentId } = event.data

    // Update status to processing
    await step.run('update-status-processing', async () => {
      await updateDocumentStatus(documentId, 'processing')
    })

    // Process document with OCR
    const result = await step.run('process-ocr', async () => {
      return await processDocument(documentId)
    })

    // Save results
    await step.run('save-results', async () => {
      await supabase
        .from('tax_documents')
        .update({
          processing_status: 'completed',
          document_type: result.documentType,
          extracted_text: result.rawText,
          extracted_data: result.extractedData,
          classification_confidence: result.confidence,
          processed_at: new Date().toISOString()
        })
        .eq('id', documentId)
    })

    // If W2 or 1099, create income entry
    if (['w2', '1099_nec', '1099_misc'].includes(result.documentType)) {
      await step.run('create-income-entry', async () => {
        await createIncomeEntryFromDocument(documentId, result)
      })
    }

    return { success: true, documentType: result.documentType }
  }
)

// Handle processing errors
export const handleProcessingError = inngest.createFunction(
  { id: 'handle-document-error' },
  { event: 'inngest/function.failed' },
  async ({ event }) => {
    if (event.data.function_id !== 'process-document') return

    const { documentId } = event.data.event.data
    await updateDocumentStatus(documentId, 'failed', event.data.error)
  }
)
```

## Server Actions

```typescript
// actions/documents.ts
'use server'

export async function uploadDocument(formData: FormData): Promise<UploadResult> {
  const session = await getSession()
  if (!session) throw new AuthError()

  const file = formData.get('file') as File
  const taxYear = parseInt(formData.get('taxYear') as string)
  const documentType = formData.get('documentType') as DocumentType | undefined
  const notes = formData.get('notes') as string | undefined

  return await uploadDocumentToStorage(file, session.user.id, {
    taxYear,
    documentType,
    notes
  })
}

export async function getDocuments(filters?: DocumentFilters): Promise<Document[]> {
  const session = await getSession()
  if (!session) throw new AuthError()

  let query = supabase
    .from('tax_documents')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (filters?.taxYear) {
    query = query.eq('tax_year', filters.taxYear)
  }

  if (filters?.documentType) {
    query = query.eq('document_type', filters.documentType)
  }

  if (filters?.status) {
    query = query.eq('processing_status', filters.status)
  }

  if (filters?.search) {
    query = query.textSearch('extracted_text', filters.search)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  const session = await getSession()
  if (!session) throw new AuthError()

  const { data, error } = await supabase
    .from('tax_documents')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single()

  if (error) throw error

  // Get signed URL for preview
  const signedUrl = await getSignedUrl(data.storage_path)

  return {
    ...data,
    previewUrl: signedUrl
  }
}

export async function updateExtractedData(
  id: string,
  extractedData: Record<string, any>
): Promise<void> {
  const session = await getSession()
  if (!session) throw new AuthError()

  await supabase
    .from('tax_documents')
    .update({
      extracted_data: extractedData,
      manually_edited: true
    })
    .eq('id', id)
    .eq('user_id', session.user.id)

  revalidatePath(`/documents/${id}`)
}

export async function deleteDocument(id: string): Promise<void> {
  const session = await getSession()
  if (!session) throw new AuthError()

  // Get document to find storage path
  const doc = await getDocument(id)

  // Delete from storage
  await supabase.storage
    .from('documents')
    .remove([doc.storage_path])

  // Delete database record
  await supabase
    .from('tax_documents')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  revalidatePath('/documents')
}

export async function reprocessDocument(id: string): Promise<void> {
  const session = await getSession()
  if (!session) throw new AuthError()

  await supabase
    .from('tax_documents')
    .update({
      processing_status: 'pending',
      extracted_text: null,
      extracted_data: null
    })
    .eq('id', id)
    .eq('user_id', session.user.id)

  await inngest.send({
    name: 'document/uploaded',
    data: { documentId: id }
  })
}
```

## UI Components

```typescript
// components/features/documents/upload-dropzone.tsx

interface UploadDropzoneProps {
  taxYear: number
  onUpload: (results: UploadResult[]) => void
}

export function UploadDropzone({ taxYear, onUpload }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    await uploadFiles(files)
  }

  const uploadFiles = async (files: File[]) => {
    const results: UploadResult[] = []

    for (const file of files) {
      // Add to progress list
      const progressId = generateId()
      setUploads(prev => [...prev, {
        id: progressId,
        filename: file.name,
        progress: 0,
        status: 'uploading'
      }])

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('taxYear', taxYear.toString())

        const result = await uploadDocument(formData)
        results.push(result)

        setUploads(prev => prev.map(u =>
          u.id === progressId
            ? { ...u, progress: 100, status: 'complete' }
            : u
        ))
      } catch (error) {
        setUploads(prev => prev.map(u =>
          u.id === progressId
            ? { ...u, status: 'error', error: error.message }
            : u
        ))
      }
    }

    onUpload(results)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      )}
    >
      <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">
        Drag and drop files here, or click to browse
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        PDF, JPG, PNG up to 10MB
      </p>

      <input
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,.heic"
        onChange={(e) => uploadFiles(Array.from(e.target.files ?? []))}
        className="hidden"
        id="file-upload"
      />
      <label htmlFor="file-upload">
        <Button variant="outline" className="mt-4" asChild>
          <span>Browse Files</span>
        </Button>
      </label>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploads.map(upload => (
            <UploadProgressItem key={upload.id} upload={upload} />
          ))}
        </div>
      )}
    </div>
  )
}

// components/features/documents/document-library.tsx

export function DocumentLibrary() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<DocumentFilters>({})
  const [documents, setDocuments] = useState<Document[]>([])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <DocumentFilters filters={filters} onChange={setFilters} />

        <div className="flex items-center gap-2">
          <DocumentSearch onSearch={(q) => setFilters(f => ({ ...f, search: q }))} />

          <div className="flex border rounded-lg">
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('grid')}
            >
              <GridIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Documents */}
      {view === 'grid' ? (
        <DocumentGrid documents={documents} />
      ) : (
        <DocumentList documents={documents} />
      )}
    </div>
  )
}

// components/features/documents/extracted-data-display.tsx

interface ExtractedDataDisplayProps {
  documentType: DocumentType
  data: Record<string, any>
  onEdit: () => void
}

export function ExtractedDataDisplay({
  documentType,
  data,
  onEdit
}: ExtractedDataDisplayProps) {
  if (documentType === 'w2') {
    return <W2DataDisplay data={data as W2Data} onEdit={onEdit} />
  }

  if (documentType.startsWith('1099')) {
    return <Form1099DataDisplay type={documentType} data={data} onEdit={onEdit} />
  }

  if (documentType === '1098') {
    return <Form1098DataDisplay data={data as Form1098Data} onEdit={onEdit} />
  }

  if (documentType === 'irs_notice') {
    return <IRSNoticeDataDisplay data={data as IRSNoticeData} onEdit={onEdit} />
  }

  return <GenericDataDisplay data={data} onEdit={onEdit} />
}

function W2DataDisplay({ data, onEdit }: { data: W2Data; onEdit: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>W-2 Details</CardTitle>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <EditIcon className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Employer</p>
            <p className="font-medium">{data.employerName}</p>
            <p className="text-sm">{data.employerEIN}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Employee</p>
            <p className="font-medium">{data.employeeName}</p>
            <p className="text-sm">SSN: XXX-XX-{data.employeeSSN}</p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <DataField label="Box 1 - Wages" value={formatCurrency(data.box1_wages)} />
          <DataField label="Box 2 - Federal Tax Withheld" value={formatCurrency(data.box2_federalWithheld)} />
          <DataField label="Box 16 - State Wages" value={formatCurrency(data.box16_stateWages)} />
          <DataField label="Box 17 - State Tax Withheld" value={formatCurrency(data.box17_stateWithheld)} />
        </div>
      </CardContent>
    </Card>
  )
}
```

## API Routes

```typescript
// app/api/documents/[id]/preview/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const document = await getDocument(params.id)

  if (document.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const signedUrl = await getSignedUrl(document.storage_path)

  return NextResponse.json({ url: signedUrl })
}
```

## Key Components Summary

| Component | Purpose |
|-----------|---------|
| `upload.ts` | Document upload to Supabase Storage |
| `ocr-processor.ts` | Claude Vision text extraction |
| `classifier.ts` | Document type classification |
| `extractor.ts` | Structured data extraction (W2, 1099, etc.) |
| `upload-dropzone.tsx` | Drag-and-drop upload UI |
| `document-library.tsx` | Grid/list view with filters |
| `extracted-data-display.tsx` | Form-specific data display |
| `document-preview.tsx` | In-app document viewer |
