import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { processDocument } from '@/lib/documents/ocr-processor'
import { classifyDocument } from '@/lib/documents/classifier'
import { extractDataByType } from '@/lib/documents/extractor'

/**
 * Background function to process uploaded documents
 * Triggered by: documents/process event after document upload
 *
 * Steps:
 * 1. Run OCR to extract text
 * 2. Classify document type
 * 3. Extract structured data based on type
 * 4. Update database with results
 */
export const processDocumentFunction = inngest.createFunction(
  {
    id: 'process-document',
    name: 'Process Uploaded Document',
    retries: 3,
  },
  { event: 'documents/process' },
  async ({ event, step }) => {
    const { documentId, userId, filePath, mimeType } = event.data as {
      documentId: string
      userId: string
      filePath: string
      mimeType: string
    }

    // Step 1: Update status to processing
    await step.run('update-status-processing', async () => {
      const supabase = await createClient()
      await supabase
        .from('tax_documents')
        .update({
          processing_status: 'processing',
        })
        .eq('id', documentId)
    })

    // Step 2: Run OCR to extract text
    const ocrResult = await step.run('run-ocr', async () => {
      const result = await processDocument(filePath, mimeType)

      if (!result) {
        throw new Error('OCR processing failed')
      }

      return result
    })

    // Step 3: Classify document type
    const classification = await step.run('classify-document', async () => {
      return await classifyDocument(ocrResult.text)
    })

    // Step 4: Extract structured data based on document type
    const extractedData = await step.run('extract-data', async () => {
      return await extractDataByType(classification.documentType, ocrResult.text)
    })

    // Step 5: Update database with all results
    await step.run('update-database', async () => {
      const supabase = await createClient()

      const { error } = await supabase
        .from('tax_documents')
        .update({
          document_type: classification.documentType,
          extracted_text: ocrResult.text,
          extracted_data: extractedData.fields,
          extraction_confidence: ocrResult.confidence,
          processing_status: 'completed',
          processed: true,
        })
        .eq('id', documentId)

      if (error) {
        throw new Error(`Failed to update database: ${error.message}`)
      }
    })

    // Step 6: Create income entry if applicable (W2 or 1099)
    if (classification.documentType === 'W2' || classification.documentType.startsWith('1099')) {
      await step.run('create-income-entry', async () => {
        // This step will auto-create income entries
        // For now, we'll just log it - this can be expanded later
        console.log(
          `Would create income entry for ${classification.documentType} document ${documentId}`
        )

        // TODO: Implement income entry creation
        // This will depend on having an income tracking table/feature
        // For now, the extracted data is stored in the tax_documents.extracted_data field
        // and can be used by other parts of the application
      })
    }

    return {
      success: true,
      documentId,
      documentType: classification.documentType,
      confidence: classification.confidence,
      textLength: ocrResult.text.length,
    }
  }
)

/**
 * Error handler for document processing failures
 * Updates status to 'failed' if processing fails after all retries
 */
export const handleDocumentProcessingError = inngest.createFunction(
  {
    id: 'handle-document-processing-error',
    name: 'Handle Document Processing Error',
  },
  { event: 'inngest/function.failed' },
  async ({ event }) => {
    // Check if this is a document processing failure
    if (event.data.function_id !== 'process-document') {
      return { skipped: true }
    }

    // Extract document ID from the original event
    const originalEvent = event.data.event as {
      data: { documentId: string; userId: string }
    }

    if (!originalEvent?.data?.documentId) {
      return { error: 'No document ID found in failed event' }
    }

    const { documentId } = originalEvent.data

    // Update document status to failed
    const supabase = await createClient()
    await supabase
      .from('tax_documents')
      .update({
        processing_status: 'failed',
        processed: false,
      })
      .eq('id', documentId)

    return {
      success: true,
      documentId,
      message: 'Document processing marked as failed',
    }
  }
)

/**
 * Function to retry failed document processing
 * Can be triggered manually for documents that failed
 */
export const retryDocumentProcessing = inngest.createFunction(
  {
    id: 'retry-document-processing',
    name: 'Retry Failed Document Processing',
  },
  { event: 'documents/retry' },
  async ({ event, step }) => {
    const { documentId } = event.data as { documentId: string }

    // Get document details
    const document = await step.run('fetch-document', async () => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('tax_documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error || !data) {
        throw new Error('Document not found')
      }

      return data
    })

    // Trigger processing event
    await step.run('trigger-processing', async () => {
      await inngest.send({
        name: 'documents/process',
        data: {
          documentId: document.id,
          userId: document.user_id,
          filePath: document.file_path,
          mimeType: document.mime_type || 'application/pdf',
        },
      })
    })

    return {
      success: true,
      documentId,
      message: 'Document processing retried',
    }
  }
)

// Export all functions as an array for easy registration
export const documentProcessingFunctions = [
  processDocumentFunction,
  handleDocumentProcessingError,
  retryDocumentProcessing,
]
