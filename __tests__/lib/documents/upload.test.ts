import { describe, it, expect } from 'vitest'
import {
  validateFile,
  generateUniqueFilename,
  generateStoragePath,
  getFileExtension,
  isPDF,
  isImage,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/documents/upload'

// Helper to create mock File objects
function createMockFile(name: string, type: string, size: number): File {
  const file = new File([''], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('Document Upload Utilities', () => {
  describe('validateFile', () => {
    it('accepts PDF files', () => {
      const file = createMockFile('document.pdf', 'application/pdf', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('accepts JPEG files', () => {
      const file = createMockFile('image.jpg', 'image/jpeg', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(true)
    })

    it('accepts PNG files', () => {
      const file = createMockFile('image.png', 'image/png', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(true)
    })

    it('accepts HEIC files', () => {
      const file = createMockFile('image.heic', 'image/heic', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(true)
    })

    it('rejects unsupported file types', () => {
      const file = createMockFile('document.doc', 'application/msword', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file type')
    })

    it('rejects files larger than max size', () => {
      const file = createMockFile('large.pdf', 'application/pdf', MAX_FILE_SIZE + 1)
      const result = validateFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('File too large')
    })

    it('accepts files at exactly max size', () => {
      const file = createMockFile('exact.pdf', 'application/pdf', MAX_FILE_SIZE)
      const result = validateFile(file)

      expect(result.valid).toBe(true)
    })

    it('accepts small files', () => {
      const file = createMockFile('tiny.pdf', 'application/pdf', 100)
      const result = validateFile(file)

      expect(result.valid).toBe(true)
    })

    it('rejects text files', () => {
      const file = createMockFile('readme.txt', 'text/plain', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(false)
    })

    it('rejects GIF files', () => {
      const file = createMockFile('animation.gif', 'image/gif', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(false)
    })

    it('rejects WEBP files', () => {
      const file = createMockFile('image.webp', 'image/webp', 1024)
      const result = validateFile(file)

      expect(result.valid).toBe(false)
    })
  })

  describe('generateUniqueFilename', () => {
    it('generates unique filename with timestamp and random string', () => {
      const original = 'document.pdf'
      const result = generateUniqueFilename(original)

      // Should have format: timestamp_random_original (16 hex chars for random)
      expect(result).toMatch(/^\d+_[a-f0-9]{16}_document\.pdf$/)
    })

    it('sanitizes special characters in filename', () => {
      const original = 'my file (1) [copy].pdf'
      const result = generateUniqueFilename(original)

      // Special characters should be replaced with underscores
      expect(result).not.toContain(' ')
      expect(result).not.toContain('(')
      expect(result).not.toContain('[')
    })

    it('preserves file extension', () => {
      const original = 'document.pdf'
      const result = generateUniqueFilename(original)

      expect(result).toContain('.pdf')
    })

    it('handles filenames with multiple dots', () => {
      const original = 'my.document.file.pdf'
      const result = generateUniqueFilename(original)

      expect(result).toContain('my.document.file.pdf')
    })

    it('handles unicode characters', () => {
      const original = 'документ_файл.pdf'
      const result = generateUniqueFilename(original)

      // Unicode should be replaced with underscores
      expect(result).toMatch(/^\d+_[a-f0-9]+_[_a-zA-Z0-9.]+$/)
    })
  })

  describe('generateStoragePath', () => {
    it('generates path with user id and year', () => {
      const metadata = {
        userId: 'user123',
        taxYear: 2024,
        originalFilename: 'document.pdf',
      }
      const filename = 'unique_document.pdf'

      const result = generateStoragePath(metadata, filename)

      expect(result).toBe('user123/2024/unique_document.pdf')
    })

    it('handles different years', () => {
      const metadata = {
        userId: 'user123',
        taxYear: 2023,
        originalFilename: 'document.pdf',
      }
      const filename = 'file.pdf'

      const result = generateStoragePath(metadata, filename)

      expect(result).toBe('user123/2023/file.pdf')
    })

    it('handles UUID-style user ids', () => {
      const metadata = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        taxYear: 2024,
        originalFilename: 'w2.pdf',
      }
      const filename = 'w2.pdf'

      const result = generateStoragePath(metadata, filename)

      expect(result).toBe('550e8400-e29b-41d4-a716-446655440000/2024/w2.pdf')
    })
  })

  describe('getFileExtension', () => {
    it('returns lowercase extension', () => {
      expect(getFileExtension('document.PDF')).toBe('pdf')
      expect(getFileExtension('image.JPG')).toBe('jpg')
      expect(getFileExtension('file.Png')).toBe('png')
    })

    it('returns extension for simple filenames', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf')
      expect(getFileExtension('image.jpg')).toBe('jpg')
    })

    it('returns last extension for multiple dots', () => {
      expect(getFileExtension('my.document.file.pdf')).toBe('pdf')
      expect(getFileExtension('backup.2024.01.tar.gz')).toBe('gz')
    })

    it('returns empty string for no extension', () => {
      expect(getFileExtension('README')).toBe('')
      expect(getFileExtension('Makefile')).toBe('')
    })

    it('handles dot files', () => {
      expect(getFileExtension('.gitignore')).toBe('gitignore')
      expect(getFileExtension('.env')).toBe('env')
    })
  })

  describe('isPDF', () => {
    it('returns true for PDF files', () => {
      const file = createMockFile('document.pdf', 'application/pdf', 1024)
      expect(isPDF(file)).toBe(true)
    })

    it('returns false for image files', () => {
      const file = createMockFile('image.jpg', 'image/jpeg', 1024)
      expect(isPDF(file)).toBe(false)
    })

    it('returns false for PNG files', () => {
      const file = createMockFile('image.png', 'image/png', 1024)
      expect(isPDF(file)).toBe(false)
    })

    it('returns false for other file types', () => {
      const file = createMockFile('doc.txt', 'text/plain', 1024)
      expect(isPDF(file)).toBe(false)
    })
  })

  describe('isImage', () => {
    it('returns true for JPEG files', () => {
      const file = createMockFile('image.jpg', 'image/jpeg', 1024)
      expect(isImage(file)).toBe(true)
    })

    it('returns true for PNG files', () => {
      const file = createMockFile('image.png', 'image/png', 1024)
      expect(isImage(file)).toBe(true)
    })

    it('returns true for HEIC files', () => {
      const file = createMockFile('image.heic', 'image/heic', 1024)
      expect(isImage(file)).toBe(true)
    })

    it('returns true for GIF files', () => {
      const file = createMockFile('image.gif', 'image/gif', 1024)
      expect(isImage(file)).toBe(true)
    })

    it('returns false for PDF files', () => {
      const file = createMockFile('document.pdf', 'application/pdf', 1024)
      expect(isImage(file)).toBe(false)
    })

    it('returns false for text files', () => {
      const file = createMockFile('readme.txt', 'text/plain', 1024)
      expect(isImage(file)).toBe(false)
    })
  })

  describe('Constants', () => {
    it('has correct allowed document types', () => {
      expect(ALLOWED_DOCUMENT_TYPES).toContain('application/pdf')
      expect(ALLOWED_DOCUMENT_TYPES).toContain('image/jpeg')
      expect(ALLOWED_DOCUMENT_TYPES).toContain('image/png')
      expect(ALLOWED_DOCUMENT_TYPES).toContain('image/heic')
      expect(ALLOWED_DOCUMENT_TYPES).toHaveLength(4)
    })

    it('has 10MB max file size', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
    })
  })
})
