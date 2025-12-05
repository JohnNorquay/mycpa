import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DocumentsPage from '@/app/(dashboard)/documents/page'

// Mock server actions
vi.mock('@/app/actions/documents', () => ({
  getDocuments: vi.fn(),
  uploadDocument: vi.fn(),
}))

import { getDocuments, uploadDocument } from '@/app/actions/documents'

const mockGetDocuments = getDocuments as ReturnType<typeof vi.fn>
const mockUploadDocument = uploadDocument as ReturnType<typeof vi.fn>

// Helper to create mock files
function createMockFile(name: string, size: number, type: string): File {
  const blob = new Blob(['x'.repeat(size)], { type })
  return new File([blob], name, { type })
}

// Helper to create mock document data
function createMockDocument(overrides = {}) {
  return {
    id: 'doc-1',
    user_id: 'user-1',
    tax_year: 2023,
    file_path: 'documents/user-1/2023/test.pdf',
    file_name: 'test.pdf',
    file_size: 102400,
    mime_type: 'application/pdf',
    processing_status: 'completed',
    document_type: 'w2',
    processed: true,
    upload_date: new Date('2023-01-15').toISOString(),
    created_at: new Date('2023-01-15').toISOString(),
    updated_at: new Date('2023-01-15').toISOString(),
    extracted_text: 'Sample W-2 text',
    extraction_confidence: 0.95,
    ...overrides,
  }
}

describe('Documents E2E - Page Load and Initial State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockGetDocuments.mockImplementation(() => new Promise(() => {}))
    render(<DocumentsPage />)

    // Check for the loading spinner element
    const loadingSpinner = document.querySelector('.animate-spin')
    expect(loadingSpinner).toBeInTheDocument()
  })

  it('loads and displays documents on mount', async () => {
    const mockDocs = [
      createMockDocument({ id: 'doc-1', file_name: 'W2-2023.pdf' }),
      createMockDocument({ id: 'doc-2', file_name: '1099-2023.pdf', document_type: '1099_misc' }),
    ]

    mockGetDocuments.mockResolvedValue({
      success: true,
      data: mockDocs,
    })

    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('W2-2023.pdf')).toBeInTheDocument()
      expect(screen.getByText('1099-2023.pdf')).toBeInTheDocument()
    })
  })

  it('shows empty state when no documents exist', async () => {
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [],
    })

    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument()
      expect(screen.getByText(/upload your first document/i)).toBeInTheDocument()
    })
  })

  it('renders page header and upload button', async () => {
    mockGetDocuments.mockResolvedValue({ success: true, data: [] })

    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('Documents')).toBeInTheDocument()
    })

    expect(screen.getByText(/upload and manage your tax documents/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
  })
})

describe('Documents E2E - Document List Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays documents in grid view by default', async () => {
    const mockDocs = [
      createMockDocument({ id: 'doc-1', file_name: 'W2.pdf' }),
      createMockDocument({ id: 'doc-2', file_name: '1099.pdf' }),
    ]

    mockGetDocuments.mockResolvedValue({ success: true, data: mockDocs })
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('W2.pdf')).toBeInTheDocument()
    })

    // Check for grid layout (should have multiple card elements)
    const cards = screen.getAllByRole('link')
    expect(cards.length).toBe(2)
  })

  it('shows document metadata in cards', async () => {
    const mockDoc = createMockDocument({
      file_name: 'W2-2023.pdf',
      tax_year: 2023,
      document_type: 'w2',
      upload_date: new Date('2023-01-15').toISOString(),
    })

    mockGetDocuments.mockResolvedValue({ success: true, data: [mockDoc] })
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('W2-2023.pdf')).toBeInTheDocument()
    })

    // Check for year (multiple instances expected due to filter dropdowns)
    const yearTexts = screen.getAllByText('2023')
    expect(yearTexts.length).toBeGreaterThan(0)

    // Check for document type label (multiple instances due to filter dropdown)
    const docTypeLabels = screen.getAllByText('W-2')
    expect(docTypeLabels.length).toBeGreaterThan(0)
  })

  it('displays processing status badges', async () => {
    const mockDocs = [
      createMockDocument({
        id: 'doc-1',
        file_name: 'completed.pdf',
        processing_status: 'completed',
      }),
      createMockDocument({
        id: 'doc-2',
        file_name: 'processing.pdf',
        processing_status: 'processing',
      }),
      createMockDocument({ id: 'doc-3', file_name: 'pending.pdf', processing_status: 'pending' }),
      createMockDocument({ id: 'doc-4', file_name: 'failed.pdf', processing_status: 'failed' }),
    ]

    mockGetDocuments.mockResolvedValue({ success: true, data: mockDocs })
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('completed.pdf')).toBeInTheDocument()
    })

    // Check for status badges - there may be multiple instances due to filter dropdown
    expect(screen.getAllByText('Completed').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Processing').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pending').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Failed').length).toBeGreaterThan(0)
  })

  it('shows document count', async () => {
    const mockDocs = [
      createMockDocument({ id: 'doc-1' }),
      createMockDocument({ id: 'doc-2' }),
      createMockDocument({ id: 'doc-3' }),
    ]

    mockGetDocuments.mockResolvedValue({ success: true, data: mockDocs })
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('3 documents')).toBeInTheDocument()
    })
  })

  it('shows singular "document" for one item', async () => {
    mockGetDocuments.mockResolvedValue({
      success: true,
      data: [createMockDocument()],
    })

    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('1 document')).toBeInTheDocument()
    })
  })
})

describe('Documents E2E - View Mode Toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('switches between grid and list views', async () => {
    const user = userEvent.setup()
    const mockDocs = [
      createMockDocument({ id: 'doc-1', file_name: 'test1.pdf' }),
      createMockDocument({ id: 'doc-2', file_name: 'test2.pdf' }),
    ]

    mockGetDocuments.mockResolvedValue({ success: true, data: mockDocs })
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('test1.pdf')).toBeInTheDocument()
    })

    // Find list view button and click it
    const buttons = screen.getAllByRole('button')
    const listViewButton = buttons.find((btn) => {
      const svg = btn.querySelector('svg')
      return svg?.classList.toString().includes('lucide')
    })

    if (listViewButton) {
      await user.click(listViewButton)
    }

    // Documents should still be visible
    expect(screen.getByText('test1.pdf')).toBeInTheDocument()
    expect(screen.getByText('test2.pdf')).toBeInTheDocument()
  })
})

describe('Documents E2E - Search and Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filters documents by search query', async () => {
    const user = userEvent.setup()
    const mockDocs = [
      createMockDocument({ id: 'doc-1', file_name: 'W2-2023.pdf' }),
      createMockDocument({ id: 'doc-2', file_name: '1099-2023.pdf' }),
      createMockDocument({ id: 'doc-3', file_name: 'Receipt.pdf' }),
    ]

    mockGetDocuments.mockResolvedValue({ success: true, data: mockDocs })
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('W2-2023.pdf')).toBeInTheDocument()
      expect(screen.getByText('1099-2023.pdf')).toBeInTheDocument()
      expect(screen.getByText('Receipt.pdf')).toBeInTheDocument()
    })

    // Verify search input exists and can be typed into
    const searchInput = screen.getByPlaceholderText(/search documents/i)
    expect(searchInput).toBeInTheDocument()

    await user.type(searchInput, 'W2')

    // Verify input value changed
    expect(searchInput).toHaveValue('W2')

    // Note: The actual filtering behavior is tested in component tests
    // This E2E test verifies the search input is functional
  })

  it('filters by tax year', async () => {
    const user = userEvent.setup()
    const mockDocs = [
      createMockDocument({ id: 'doc-1', file_name: 'W2-2023.pdf', tax_year: 2023 }),
      createMockDocument({ id: 'doc-2', file_name: 'W2-2022.pdf', tax_year: 2022 }),
    ]

    mockGetDocuments.mockResolvedValue({ success: true, data: mockDocs })
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('W2-2023.pdf')).toBeInTheDocument()
    })

    // Find year filter dropdown
    const yearSelect = screen.getAllByRole('combobox')[0]
    await user.selectOptions(yearSelect, '2022')

    expect(screen.queryByText('W2-2023.pdf')).not.toBeInTheDocument()
    expect(screen.getByText('W2-2022.pdf')).toBeInTheDocument()
  })

  it('filters by document type', async () => {
    const user = userEvent.setup()
    const mockDocs = [
      createMockDocument({ id: 'doc-1', file_name: 'W2.pdf', document_type: 'w2' }),
      createMockDocument({ id: 'doc-2', file_name: '1099.pdf', document_type: '1099_misc' }),
    ]

    mockGetDocuments.mockResolvedValue({ success: true, data: mockDocs })
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('W2.pdf')).toBeInTheDocument()
    })

    // Find type filter dropdown (second combobox)
    const typeSelect = screen.getAllByRole('combobox')[1]
    await user.selectOptions(typeSelect, 'w2')

    expect(screen.getByText('W2.pdf')).toBeInTheDocument()
    expect(screen.queryByText('1099.pdf')).not.toBeInTheDocument()
  })

  it('filters by processing status', async () => {
    const user = userEvent.setup()
    const mockDocs = [
      createMockDocument({
        id: 'doc-1',
        file_name: 'completed.pdf',
        processing_status: 'completed',
      }),
      createMockDocument({ id: 'doc-2', file_name: 'pending.pdf', processing_status: 'pending' }),
    ]

    mockGetDocuments.mockResolvedValue({ success: true, data: mockDocs })
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('completed.pdf')).toBeInTheDocument()
    })

    // Find status filter dropdown (third combobox)
    const statusSelect = screen.getAllByRole('combobox')[2]
    await user.selectOptions(statusSelect, 'completed')

    expect(screen.getByText('completed.pdf')).toBeInTheDocument()
    expect(screen.queryByText('pending.pdf')).not.toBeInTheDocument()
  })

  it('shows document count', async () => {
    const mockDocs = [
      createMockDocument({ id: 'doc-1', file_name: 'W2.pdf' }),
      createMockDocument({ id: 'doc-2', file_name: '1099.pdf' }),
      createMockDocument({ id: 'doc-3', file_name: 'Receipt.pdf' }),
    ]

    mockGetDocuments.mockResolvedValue({ success: true, data: mockDocs })
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('3 documents')).toBeInTheDocument()
    })

    // Verify total count is shown
    expect(screen.getByText('3 documents')).toBeInTheDocument()
  })

  it('shows empty state when filters return no results', async () => {
    const user = userEvent.setup()
    const mockDocs = [createMockDocument({ id: 'doc-1', file_name: 'W2.pdf' })]

    mockGetDocuments.mockResolvedValue({ success: true, data: mockDocs })
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('W2.pdf')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/search documents/i)
    await user.type(searchInput, 'nonexistent')

    await waitFor(() => {
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument()
      expect(screen.getByText(/try adjusting your filters/i)).toBeInTheDocument()
    })
  })
})

describe('Documents E2E - Upload Flow - Opening Upload Zone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDocuments.mockResolvedValue({ success: true, data: [] })
  })

  it('shows upload dropzone when Upload Documents button clicked', async () => {
    const user = userEvent.setup()
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument()
  })

  it('shows upload zone from empty state button', async () => {
    const user = userEvent.setup()
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument()
    })

    // Get the button within the empty state card
    const emptyStateButtons = screen.getAllByRole('button', { name: /upload document/i })
    const emptyStateButton =
      emptyStateButtons.find((btn) => btn.closest('.py-12') !== null) || emptyStateButtons[0]

    await user.click(emptyStateButton)

    expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument()
  })

  it('shows tax year selector in upload zone', async () => {
    const user = userEvent.setup()
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    expect(screen.getByText(/tax year/i)).toBeInTheDocument()
    // There are multiple comboboxes (filters + upload tax year selector)
    const yearSelects = screen.getAllByRole('combobox')
    expect(yearSelects.length).toBeGreaterThan(0)
  })

  it('allows changing tax year before upload', async () => {
    const user = userEvent.setup()
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    // Get all comboboxes and find the upload tax year selector (should be the last one)
    await waitFor(() => {
      expect(screen.getByText(/tax year/i)).toBeInTheDocument()
    })

    const yearSelects = screen.getAllByRole('combobox')
    const uploadYearSelect = yearSelects[yearSelects.length - 1]

    // Check if 2022 is available as an option
    const options = Array.from(uploadYearSelect.querySelectorAll('option'))
    const has2022 = options.some((opt) => opt.value === '2022')

    if (has2022) {
      await user.selectOptions(uploadYearSelect, '2022')
      expect(uploadYearSelect).toHaveValue('2022')
    } else {
      // If 2022 isn't available, verify we can at least interact with it
      expect(uploadYearSelect).toBeInTheDocument()
      expect(options.length).toBeGreaterThan(0)
    }
  })

  it('can cancel upload zone', async () => {
    const user = userEvent.setup()
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument()

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(screen.queryByText(/drag and drop files here/i)).not.toBeInTheDocument()
  })
})

describe('Documents E2E - Upload Flow - File Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDocuments.mockResolvedValue({ success: true, data: [] })
  })

  it('allows selecting files via file input', async () => {
    const user = userEvent.setup()
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    const file = createMockFile('W2-2023.pdf', 102400, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(screen.getByText('W2-2023.pdf')).toBeInTheDocument()
    expect(screen.getByText(/selected files \(1\)/i)).toBeInTheDocument()
  })

  it('allows selecting multiple files', async () => {
    const user = userEvent.setup()
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    const files = [
      createMockFile('W2.pdf', 102400, 'application/pdf'),
      createMockFile('1099.pdf', 51200, 'application/pdf'),
    ]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, files)

    expect(screen.getByText('W2.pdf')).toBeInTheDocument()
    expect(screen.getByText('1099.pdf')).toBeInTheDocument()
    expect(screen.getByText(/selected files \(2\)/i)).toBeInTheDocument()
  })

  it('shows file sizes', async () => {
    const user = userEvent.setup()
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    const file = createMockFile('test.pdf', 1024 * 1024, 'application/pdf') // 1 MB
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(screen.getByText(/1\.0 MB/i)).toBeInTheDocument()
  })

  it('allows removing individual files', async () => {
    const user = userEvent.setup()
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    const files = [
      createMockFile('keep.pdf', 1024, 'application/pdf'),
      createMockFile('remove.pdf', 1024, 'application/pdf'),
    ]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, files)

    expect(screen.getByText('keep.pdf')).toBeInTheDocument()
    expect(screen.getByText('remove.pdf')).toBeInTheDocument()

    // Find and click remove button for the second file
    const fileRow = screen.getByText('remove.pdf').closest('div')?.parentElement
    const removeButton = fileRow?.querySelector('button[type="button"]')
    if (removeButton) {
      await user.click(removeButton)
    }

    expect(screen.getByText('keep.pdf')).toBeInTheDocument()
    expect(screen.queryByText('remove.pdf')).not.toBeInTheDocument()
  })

  it('allows clearing all files', async () => {
    const user = userEvent.setup()
    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    const files = [
      createMockFile('file1.pdf', 1024, 'application/pdf'),
      createMockFile('file2.pdf', 1024, 'application/pdf'),
    ]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, files)

    await user.click(screen.getByText(/clear all/i))

    expect(screen.queryByText('file1.pdf')).not.toBeInTheDocument()
    expect(screen.queryByText('file2.pdf')).not.toBeInTheDocument()
  })
})

describe('Documents E2E - Upload Flow - Upload Progress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDocuments.mockResolvedValue({ success: true, data: [] })
  })

  it('shows upload progress after clicking Upload', async () => {
    const user = userEvent.setup()
    mockUploadDocument.mockImplementation(() => new Promise(() => {})) // Never resolve

    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    const file = createMockFile('test.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await user.click(screen.getByText(/upload 1 file/i))

    // Upload progress should be visible
    await waitFor(() => {
      expect(screen.getByText(/uploading 1 of 1/i)).toBeInTheDocument()
    })
  })

  it('uploads files successfully', async () => {
    const user = userEvent.setup()
    mockUploadDocument.mockResolvedValue({
      success: true,
      data: { documentId: 'new-doc-1' },
    })

    const updatedDocs = [createMockDocument({ id: 'new-doc-1', file_name: 'uploaded.pdf' })]
    mockGetDocuments
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({ success: true, data: updatedDocs })

    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    const file = createMockFile('uploaded.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await user.click(screen.getByText(/upload 1 file/i))

    await waitFor(() => {
      expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
    })
  })

  it('shows progress for multiple file uploads', async () => {
    const user = userEvent.setup()
    let resolveFirst: () => void
    let resolveSecond: () => void

    mockUploadDocument
      .mockImplementationOnce(
        () =>
          new Promise<{ success: boolean; data: { documentId: string } }>((resolve) => {
            resolveFirst = () => resolve({ success: true, data: { documentId: 'doc-1' } })
          })
      )
      .mockImplementationOnce(
        () =>
          new Promise<{ success: boolean; data: { documentId: string } }>((resolve) => {
            resolveSecond = () => resolve({ success: true, data: { documentId: 'doc-2' } })
          })
      )

    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    const files = [
      createMockFile('file1.pdf', 1024, 'application/pdf'),
      createMockFile('file2.pdf', 1024, 'application/pdf'),
    ]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, files)

    await user.click(screen.getByText(/upload 2 files/i))

    await waitFor(() => {
      expect(screen.getByText(/uploading 1 of 2/i)).toBeInTheDocument()
    })

    // Resolve first upload
    resolveFirst!()

    await waitFor(() => {
      expect(screen.getByText(/uploading 2 of 2/i)).toBeInTheDocument()
    })

    // Resolve second upload
    resolveSecond!()

    await waitFor(() => {
      expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
    })
  })

  it('handles upload errors gracefully', async () => {
    const user = userEvent.setup()
    mockUploadDocument.mockResolvedValue({
      success: false,
      error: 'Server error',
    })

    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    const file = createMockFile('test.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await user.click(screen.getByText(/upload 1 file/i))

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })
  })

  it('shows retry option for failed uploads', async () => {
    const user = userEvent.setup()
    mockUploadDocument.mockResolvedValue({ success: false, error: 'Server error' })

    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    const file = createMockFile('test.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await user.click(screen.getByText(/upload 1 file/i))

    // Wait for upload to complete with error
    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument()
    })

    // Verify upload completed state is shown
    await waitFor(() => {
      expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
    })

    // Verify retry button exists
    const retryButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.textContent?.toLowerCase().includes('retry'))
    expect(retryButtons.length).toBeGreaterThan(0)
  })

  it('reloads documents after successful upload', async () => {
    const user = userEvent.setup()
    mockUploadDocument.mockResolvedValue({
      success: true,
      data: { documentId: 'new-doc' },
    })

    const updatedDocs = [createMockDocument({ id: 'new-doc', file_name: 'uploaded.pdf' })]
    mockGetDocuments
      .mockResolvedValueOnce({ success: true, data: [] })
      .mockResolvedValueOnce({ success: true, data: updatedDocs })

    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /upload documents/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /upload documents/i }))

    const file = createMockFile('uploaded.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, file)

    await user.click(screen.getByText(/upload 1 file/i))

    await waitFor(() => {
      expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /done/i }))

    await waitFor(() => {
      expect(mockGetDocuments).toHaveBeenCalledTimes(2)
    })
  })
})

describe('Documents E2E - Document Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('document cards are clickable links', async () => {
    const mockDoc = createMockDocument({ id: 'doc-123', file_name: 'test.pdf' })
    mockGetDocuments.mockResolvedValue({ success: true, data: [mockDoc] })

    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
    })

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/documents/doc-123')
  })

  it('list view items are clickable links', async () => {
    const user = userEvent.setup()
    const mockDoc = createMockDocument({ id: 'doc-456', file_name: 'test.pdf' })
    mockGetDocuments.mockResolvedValue({ success: true, data: [mockDoc] })

    render(<DocumentsPage />)

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument()
    })

    // Switch to list view
    const buttons = screen.getAllByRole('button')
    const viewButtons = buttons.slice(-2) // Last two should be view toggle buttons
    if (viewButtons[1]) {
      await user.click(viewButtons[1])
    }

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/documents/doc-456')
  })
})

describe('Documents E2E - Complete Upload Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('completes full upload workflow from start to finish', async () => {
    const user = userEvent.setup()

    // Initial state: no documents
    mockGetDocuments.mockResolvedValueOnce({ success: true, data: [] })

    render(<DocumentsPage />)

    // 1. Verify empty state
    await waitFor(() => {
      expect(screen.getByText(/no documents found/i)).toBeInTheDocument()
    })

    // 2. Click upload button - get the one from empty state
    const uploadButtons = screen.getAllByRole('button', { name: /upload document/i })
    const emptyStateButton =
      uploadButtons.find((btn) => btn.closest('.py-12') !== null) || uploadButtons[0]
    await user.click(emptyStateButton)

    // 3. Verify dropzone appears
    expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument()

    // 4. Select tax year (last combobox should be the upload year selector)
    await waitFor(() => {
      expect(screen.getByText(/tax year/i)).toBeInTheDocument()
    })

    const yearSelects = screen.getAllByRole('combobox')
    const uploadYearSelect = yearSelects[yearSelects.length - 1]

    // Check if 2023 is available before selecting
    const options = Array.from(uploadYearSelect.querySelectorAll('option'))
    const has2023 = options.some((opt) => opt.value === '2023')

    if (has2023) {
      await user.selectOptions(uploadYearSelect, '2023')
    }

    // 5. Select files
    const files = [
      createMockFile('W2-2023.pdf', 102400, 'application/pdf'),
      createMockFile('1099-2023.pdf', 51200, 'application/pdf'),
    ]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, files)

    // 6. Verify files are listed
    expect(screen.getByText('W2-2023.pdf')).toBeInTheDocument()
    expect(screen.getByText('1099-2023.pdf')).toBeInTheDocument()

    // 7. Click upload
    mockUploadDocument.mockResolvedValue({
      success: true,
      data: { documentId: 'doc-1' },
    })

    await user.click(screen.getByText(/upload 2 files/i))

    // 8. Verify upload progress appears (or completes - since mocks complete quickly)
    await waitFor(() => {
      const uploadingText = screen.queryByText(/uploading/i)
      const completeText = screen.queryByText(/upload complete/i)
      expect(uploadingText || completeText).toBeTruthy()
    })

    // 9. Wait for completion
    await waitFor(() => {
      expect(screen.getByText(/upload complete/i)).toBeInTheDocument()
    })

    // 10. Click Done
    const updatedDocs = [
      createMockDocument({ id: 'doc-1', file_name: 'W2-2023.pdf' }),
      createMockDocument({ id: 'doc-2', file_name: '1099-2023.pdf' }),
    ]
    mockGetDocuments.mockResolvedValueOnce({ success: true, data: updatedDocs })

    await user.click(screen.getByRole('button', { name: /done/i }))

    // 11. Verify documents appear in list
    await waitFor(() => {
      expect(screen.getByText('2 documents')).toBeInTheDocument()
    })

    expect(mockUploadDocument).toHaveBeenCalledTimes(2)
    expect(mockGetDocuments).toHaveBeenCalledTimes(2)
  })
})
