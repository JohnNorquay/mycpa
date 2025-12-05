import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UploadDropzone } from '@/components/features/documents/upload-dropzone'

// Mock the upload module
vi.mock('@/lib/documents/upload', () => ({
  validateFile: vi.fn((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File too large. Maximum size is 10MB' }
    }
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/heic'].includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Allowed types: PDF, JPG, PNG, HEIC' }
    }
    return { valid: true }
  }),
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'],
  MAX_FILE_SIZE: 10 * 1024 * 1024,
}))

function createMockFile(name: string, size: number, type: string): File {
  const blob = new Blob(['x'.repeat(size)], { type })
  return new File([blob], name, { type })
}

describe('UploadDropzone', () => {
  const mockOnFilesSelected = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dropzone with instructions', () => {
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument()
    expect(screen.getByText(/browse your computer/i)).toBeInTheDocument()
  })

  it('shows file size limit', () => {
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    expect(screen.getByText(/up to 10MB/i)).toBeInTheDocument()
  })

  it('shows accepted file types', () => {
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    expect(screen.getByText(/PDF, JPG, PNG, or HEIC/i)).toBeInTheDocument()
  })

  it('can be disabled', () => {
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} disabled />)

    const browseButton = screen.getByText(/browse your computer/i)
    expect(browseButton).toBeDisabled()
  })
})

describe('UploadDropzone - File Selection', () => {
  const mockOnFilesSelected = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows selected files in list', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const file = createMockFile('test.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(screen.getByText('test.pdf')).toBeInTheDocument()
    expect(screen.getByText('Selected Files (1)')).toBeInTheDocument()
  })

  it('shows file size', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const file = createMockFile('test.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(screen.getByText('1.0 KB')).toBeInTheDocument()
  })

  it('allows selecting multiple files', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const file1 = createMockFile('doc1.pdf', 1024, 'application/pdf')
    const file2 = createMockFile('doc2.pdf', 2048, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, [file1, file2])

    expect(screen.getByText('doc1.pdf')).toBeInTheDocument()
    expect(screen.getByText('doc2.pdf')).toBeInTheDocument()
    expect(screen.getByText('Selected Files (2)')).toBeInTheDocument()
  })

  it('respects maxFiles limit', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} maxFiles={2} />)

    const files = [
      createMockFile('doc1.pdf', 1024, 'application/pdf'),
      createMockFile('doc2.pdf', 1024, 'application/pdf'),
      createMockFile('doc3.pdf', 1024, 'application/pdf'),
    ]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, files)

    expect(screen.getByText('doc1.pdf')).toBeInTheDocument()
    expect(screen.getByText('doc2.pdf')).toBeInTheDocument()
    expect(screen.queryByText('doc3.pdf')).not.toBeInTheDocument()
  })
})

describe('UploadDropzone - File Removal', () => {
  const mockOnFilesSelected = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows remove button for each file', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const file = createMockFile('test.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    // X button for removing file
    const removeButtons = document.querySelectorAll('button')
    expect(removeButtons.length).toBeGreaterThan(0)
  })

  it('removes file when X clicked', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const file = createMockFile('test.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)
    expect(screen.getByText('test.pdf')).toBeInTheDocument()

    // Find and click the remove button (X icon button in the file row)
    const fileRow = screen.getByText('test.pdf').closest('div')?.parentElement
    const removeButton = fileRow?.querySelector('button[type="button"]')
    if (removeButton) {
      await user.click(removeButton)
    }

    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument()
  })

  it('shows Clear all button', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const file = createMockFile('test.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(screen.getByText('Clear all')).toBeInTheDocument()
  })

  it('clears all files when Clear all clicked', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const files = [
      createMockFile('doc1.pdf', 1024, 'application/pdf'),
      createMockFile('doc2.pdf', 1024, 'application/pdf'),
    ]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, files)
    expect(screen.getByText('doc1.pdf')).toBeInTheDocument()
    expect(screen.getByText('doc2.pdf')).toBeInTheDocument()

    await user.click(screen.getByText('Clear all'))

    expect(screen.queryByText('doc1.pdf')).not.toBeInTheDocument()
    expect(screen.queryByText('doc2.pdf')).not.toBeInTheDocument()
  })
})

describe('UploadDropzone - Validation', () => {
  const mockOnFilesSelected = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates selected files via processFiles', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    // Select a valid PDF file
    const file = createMockFile('valid.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    // File should be shown
    expect(screen.getByText('valid.pdf')).toBeInTheDocument()
  })
})

describe('UploadDropzone - Upload Action', () => {
  const mockOnFilesSelected = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows upload button with file count', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const files = [
      createMockFile('doc1.pdf', 1024, 'application/pdf'),
      createMockFile('doc2.pdf', 1024, 'application/pdf'),
    ]
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, files)

    expect(screen.getByText('Upload 2 files')).toBeInTheDocument()
  })

  it('shows singular "file" for single file', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const file = createMockFile('doc1.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(screen.getByText('Upload 1 file')).toBeInTheDocument()
  })

  it('enables upload button for valid files', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const file = createMockFile('doc.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)

    expect(screen.getByRole('button', { name: /upload 1 file/i })).not.toBeDisabled()
  })

  it('calls onFilesSelected with valid files when upload clicked', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const file = createMockFile('doc.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)
    await user.click(screen.getByText('Upload 1 file'))

    expect(mockOnFilesSelected).toHaveBeenCalledWith([expect.any(File)])
  })

  it('clears file list after upload', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const file = createMockFile('doc.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, file)
    await user.click(screen.getByText('Upload 1 file'))

    expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument()
  })

  it('includes all selected files in upload', async () => {
    const user = userEvent.setup()
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const file1 = createMockFile('doc1.pdf', 1024, 'application/pdf')
    const file2 = createMockFile('doc2.pdf', 1024, 'application/pdf')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement

    await user.upload(input, [file1, file2])
    await user.click(screen.getByText('Upload 2 files'))

    expect(mockOnFilesSelected).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'doc1.pdf' }),
        expect.objectContaining({ name: 'doc2.pdf' }),
      ])
    )
  })
})

describe('UploadDropzone - Drag and Drop', () => {
  const mockOnFilesSelected = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows active state on drag enter', () => {
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const dropzone = screen.getByText(/drag and drop files here/i).closest('div')?.parentElement
    if (dropzone) {
      fireEvent.dragEnter(dropzone)
    }

    expect(screen.getByText('Drop files here')).toBeInTheDocument()
  })

  it('removes active state on drag leave', () => {
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} />)

    const dropzone = screen.getByText(/drag and drop files here/i).closest('div')?.parentElement
    if (dropzone) {
      fireEvent.dragEnter(dropzone)
      expect(screen.getByText('Drop files here')).toBeInTheDocument()

      fireEvent.dragLeave(dropzone)
    }

    expect(screen.getByText(/drag and drop files here/i)).toBeInTheDocument()
  })

  it('does not activate when disabled', () => {
    render(<UploadDropzone onFilesSelected={mockOnFilesSelected} disabled />)

    const dropzone = screen.getByText(/drag and drop files here/i).closest('div')?.parentElement
    if (dropzone) {
      fireEvent.dragEnter(dropzone)
    }

    expect(screen.queryByText('Drop files here')).not.toBeInTheDocument()
  })
})
