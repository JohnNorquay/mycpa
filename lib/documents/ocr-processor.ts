import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface OCRResult {
  text: string
  confidence: number
  pageCount?: number
}

/**
 * Extract text from an image using Claude Vision API
 */
async function extractTextFromImage(imageData: Buffer, mimeType: string): Promise<OCRResult> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageData.toString('base64'),
              },
            },
            {
              type: 'text',
              text: 'Extract ALL text from this document exactly as it appears. Include all numbers, labels, and text. Maintain the structure and formatting as much as possible.',
            },
          ],
        },
      ],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // For Vision API, we assume high confidence if we got a response
    return {
      text: content.text,
      confidence: 0.95,
    }
  } catch (error) {
    console.error('Error extracting text from image:', error)
    throw error
  }
}

/**
 * Extract text from a PDF document
 * For multi-page PDFs, we'll need to convert to images first
 * This is a simplified version - in production, you might use pdf-parse or similar
 */
async function extractTextFromPDF(pdfData: Buffer): Promise<OCRResult> {
  // For now, we'll use Claude to extract text from the PDF
  // In production, you might want to:
  // 1. Use pdf-parse to extract text directly from text-based PDFs
  // 2. Use pdf2pic or similar to convert pages to images for scanned PDFs
  // 3. Process each page separately and combine results

  try {
    // Convert PDF to base64 and send to Claude
    // Note: Claude can handle PDFs directly in some cases
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfData.toString('base64'),
              },
            },
            {
              type: 'text',
              text: 'Extract ALL text from this PDF document exactly as it appears. Include all numbers, labels, and text from all pages. Maintain the structure and formatting as much as possible.',
            },
          ],
        },
      ],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    return {
      text: content.text,
      confidence: 0.95,
    }
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw error
  }
}

/**
 * Process a document and extract text using OCR
 * Handles both images and PDFs
 */
export async function processDocument(
  filePath: string,
  mimeType: string
): Promise<OCRResult | null> {
  try {
    const supabase = await createClient()

    // Download file from Supabase Storage
    const { data, error } = await supabase.storage.from('documents').download(filePath)

    if (error || !data) {
      console.error('Error downloading file from storage:', error)
      return null
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await data.arrayBuffer())

    // Process based on file type
    if (mimeType === 'application/pdf') {
      return await extractTextFromPDF(buffer)
    } else if (mimeType.startsWith('image/')) {
      return await extractTextFromImage(buffer, mimeType)
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`)
    }
  } catch (error) {
    console.error('Error processing document:', error)
    return null
  }
}

/**
 * Extract text from multiple pages of a PDF
 * This is a placeholder for more advanced PDF processing
 */
export async function processMultiPagePDF(
  filePath: string
): Promise<{ pages: OCRResult[]; combined: string } | null> {
  // For now, we'll just process the entire PDF at once
  const result = await processDocument(filePath, 'application/pdf')

  if (!result) {
    return null
  }

  return {
    pages: [result],
    combined: result.text,
  }
}

/**
 * Enhance OCR results with post-processing
 * Clean up common OCR errors, normalize formatting, etc.
 */
export function enhanceOCRResult(text: string): string {
  let enhanced = text

  // Remove excessive whitespace
  enhanced = enhanced.replace(/\s+/g, ' ').trim()

  // Normalize line breaks
  enhanced = enhanced.replace(/\r\n/g, '\n')

  // Remove page numbers that might appear as standalone numbers
  // (be careful not to remove important numbers)

  return enhanced
}
