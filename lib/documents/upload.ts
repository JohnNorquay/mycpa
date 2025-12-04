import { randomBytes } from 'crypto'

export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

export interface FileValidationResult {
  valid: boolean
  error?: string
}

export interface UploadMetadata {
  userId: string
  taxYear: number
  originalFilename: string
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): FileValidationResult {
  // Check file type
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: PDF, JPG, PNG, HEIC`,
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  return { valid: true }
}

/**
 * Generate a unique filename to prevent collisions
 * Format: {timestamp}_{random}_{original_name}
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const random = randomBytes(8).toString('hex')
  const sanitized = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_')

  return `${timestamp}_${random}_${sanitized}`
}

/**
 * Generate storage path for a document
 * Format: {user_id}/{year}/{filename}
 */
export function generateStoragePath(metadata: UploadMetadata, filename: string): string {
  return `${metadata.userId}/${metadata.taxYear}/${filename}`
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  const extension = parts.length > 1 ? parts[parts.length - 1] : ''
  return extension ? extension.toLowerCase() : ''
}

/**
 * Check if file is a PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf'
}

/**
 * Check if file is an image
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/')
}
