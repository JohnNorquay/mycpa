import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UploadProgress } from '@/components/features/documents/upload-progress'

// Mock the uploadDocument action
vi.mock('@/app/actions/documents', () => ({
  uploadDocument: vi.fn(),
}))

import { uploadDocument } from '@/app/actions/documents'

const mockUploadDocument = uploadDocument as ReturnType<typeof vi.fn>

function createMockFile(name: string, size: number, type: string): File {
  const blob = new Blob(['x'.repeat(size)], { type })
  return new File([blob], name, { type })
}

describe('UploadProgress', () => {
  const mockOnComplete = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUploadDocument.mockResolvedValue({
      success: true,
      data: { documentId: 'doc-123' },
    })
  })

  it('renders file list', () => {
    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('test.pdf')).toBeInTheDocument()
  })

  it('shows uploading status header', () => {
    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText(/uploading 1 of 1/i)).toBeInTheDocument()
  })

  it('shows file size', () => {
    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText(/1\.0 KB/)).toBeInTheDocument()
  })

  it('shows cancel button during upload', () => {
    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls onCancel when cancel clicked', async () => {
    const user = userEvent.setup()
    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    // Never resolve to keep in uploading state
    mockUploadDocument.mockImplementation(() => new Promise(() => {}))

    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockOnCancel).toHaveBeenCalled()
  })
})

describe('UploadProgress - Upload Completion', () => {
  const mockOnComplete = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows success status after upload', async () => {
    mockUploadDocument.mockResolvedValue({
      success: true,
      data: { documentId: 'doc-123' },
    })

    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Upload Complete')).toBeInTheDocument()
    })
  })

  it('shows success count', async () => {
    mockUploadDocument.mockResolvedValue({
      success: true,
      data: { documentId: 'doc-123' },
    })

    const files = [
      createMockFile('doc1.pdf', 1024, 'application/pdf'),
      createMockFile('doc2.pdf', 1024, 'application/pdf'),
    ]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/2 successful/)).toBeInTheDocument()
    })
  })

  it('shows Done button after completion', async () => {
    mockUploadDocument.mockResolvedValue({
      success: true,
      data: { documentId: 'doc-123' },
    })

    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument()
    })
  })

  it('calls onComplete when Done clicked', async () => {
    const user = userEvent.setup()
    mockUploadDocument.mockResolvedValue({
      success: true,
      data: { documentId: 'doc-123' },
    })

    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /done/i }))

    expect(mockOnComplete).toHaveBeenCalled()
  })

  it('hides cancel button after completion', async () => {
    mockUploadDocument.mockResolvedValue({
      success: true,
      data: { documentId: 'doc-123' },
    })

    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Upload Complete')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
  })
})

describe('UploadProgress - Error Handling', () => {
  const mockOnComplete = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows error status for failed uploads', async () => {
    mockUploadDocument.mockResolvedValue({
      success: false,
      error: 'Upload failed',
    })

    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument()
    })
  })

  it('shows error count', async () => {
    mockUploadDocument.mockResolvedValue({
      success: false,
      error: 'Server error',
    })

    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/1 failed/)).toBeInTheDocument()
    })
  })

  it('shows Retry button for failed files', async () => {
    mockUploadDocument.mockResolvedValue({
      success: false,
      error: 'Server error',
    })

    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      // Check for any button containing "Retry" text
      const retryButtons = screen
        .getAllByRole('button')
        .filter((btn) => btn.textContent?.toLowerCase().includes('retry'))
      expect(retryButtons.length).toBeGreaterThan(0)
    })
  })

  it('shows Retry All Failed button', async () => {
    mockUploadDocument.mockResolvedValue({
      success: false,
      error: 'Server error',
    })

    const files = [
      createMockFile('doc1.pdf', 1024, 'application/pdf'),
      createMockFile('doc2.pdf', 1024, 'application/pdf'),
    ]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry all failed/i })).toBeInTheDocument()
    })
  })

  it('shows warning banner for partial failures', async () => {
    mockUploadDocument.mockResolvedValue({
      success: false,
      error: 'Server error',
    })

    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/failed to upload/i)).toBeInTheDocument()
    })
  })

  it('shows retry button after failed upload', async () => {
    mockUploadDocument.mockResolvedValue({ success: false, error: 'Server error' })

    const files = [createMockFile('test.pdf', 1024, 'application/pdf')]
    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    // Wait for upload attempt to complete with error
    await waitFor(() => {
      expect(screen.getByText('Upload Complete')).toBeInTheDocument()
    })

    // Check that there's a Retry button available
    const retryButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.textContent?.toLowerCase().includes('retry'))
    expect(retryButtons.length).toBeGreaterThan(0)
  })
})

describe('UploadProgress - Multiple Files', () => {
  const mockOnComplete = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUploadDocument.mockResolvedValue({
      success: true,
      data: { documentId: 'doc-123' },
    })
  })

  it('uploads files sequentially', async () => {
    const files = [
      createMockFile('doc1.pdf', 1024, 'application/pdf'),
      createMockFile('doc2.pdf', 1024, 'application/pdf'),
      createMockFile('doc3.pdf', 1024, 'application/pdf'),
    ]

    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    // Wait for all uploads to complete
    await waitFor(() => {
      expect(screen.getByText('Upload Complete')).toBeInTheDocument()
    })

    expect(mockUploadDocument).toHaveBeenCalledTimes(3)
  })

  it('shows progress indicator', () => {
    const files = [
      createMockFile('doc1.pdf', 1024, 'application/pdf'),
      createMockFile('doc2.pdf', 1024, 'application/pdf'),
    ]

    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText(/uploading 1 of 2/i)).toBeInTheDocument()
  })

  it('shows mixed results correctly', async () => {
    mockUploadDocument
      .mockResolvedValueOnce({ success: true, data: { documentId: 'doc-1' } })
      .mockResolvedValueOnce({ success: false, error: 'Failed' })

    const files = [
      createMockFile('success.pdf', 1024, 'application/pdf'),
      createMockFile('fail.pdf', 1024, 'application/pdf'),
    ]

    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Upload Complete')).toBeInTheDocument()
    })

    expect(screen.getByText(/1 successful/)).toBeInTheDocument()
    expect(screen.getByText(/1 failed/)).toBeInTheDocument()
  })
})

describe('UploadProgress - File Icons', () => {
  const mockOnComplete = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUploadDocument.mockImplementation(() => new Promise(() => {}))
  })

  it('renders file icons for different types', () => {
    const files = [
      createMockFile('document.pdf', 1024, 'application/pdf'),
      createMockFile('image.jpg', 1024, 'image/jpeg'),
    ]

    render(
      <UploadProgress
        files={files}
        taxYear={2023}
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    )

    // Both files should be visible
    expect(screen.getByText('document.pdf')).toBeInTheDocument()
    expect(screen.getByText('image.jpg')).toBeInTheDocument()

    // Icons are rendered via lucide-react SVGs
    const icons = document.querySelectorAll('[class*="lucide-"]')
    expect(icons.length).toBeGreaterThan(0)
  })
})
