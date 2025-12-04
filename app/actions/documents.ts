'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Tables } from '@/types'
import { inngest } from '@/inngest/client'
import {
  validateFile,
  generateUniqueFilename,
  generateStoragePath,
  type UploadMetadata,
} from '@/lib/documents/upload'

export type TaxDocument = Tables<'tax_documents'>

/**
 * Upload a document and create database record
 * Triggers Inngest processing event
 */
export async function uploadDocument(
  formData: FormData
): Promise<ActionResult<{ documentId: string }>> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Extract form data
    const file = formData.get('file') as File
    const taxYear = parseInt(formData.get('taxYear') as string)

    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      }
    }

    if (isNaN(taxYear)) {
      return {
        success: false,
        error: 'Invalid tax year',
      }
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid file',
      }
    }

    // Generate unique filename and storage path
    const uniqueFilename = generateUniqueFilename(file.name)
    const metadata: UploadMetadata = {
      userId: user.id,
      taxYear,
      originalFilename: file.name,
    }
    const storagePath = generateStoragePath(metadata, uniqueFilename)

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError)
      return {
        success: false,
        error: 'Failed to upload file',
      }
    }

    // Create database record
    const { data: document, error: dbError } = await supabase
      .from('tax_documents')
      .insert({
        user_id: user.id,
        tax_year: taxYear,
        file_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        processing_status: 'pending',
        processed: false,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error creating document record:', dbError)
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([storagePath])
      return {
        success: false,
        error: 'Failed to create document record',
      }
    }

    // Trigger Inngest processing event
    try {
      await inngest.send({
        name: 'documents/process',
        data: {
          documentId: document.id,
          userId: user.id,
          filePath: storagePath,
          mimeType: file.type,
        },
      })
    } catch (inngestError) {
      console.error('Error triggering Inngest event:', inngestError)
      // Don't fail the upload if event sending fails
      // Document can be processed later manually
    }

    revalidatePath('/dashboard/documents')

    return {
      success: true,
      data: { documentId: document.id },
    }
  } catch (error) {
    console.error('Unexpected error in uploadDocument:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get all documents for the current user
 */
export async function getDocuments(): Promise<ActionResult<TaxDocument[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const { data, error } = await supabase
      .from('tax_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('upload_date', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return {
        success: false,
        error: 'Failed to fetch documents',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error in getDocuments:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get a specific document by ID
 */
export async function getDocument(id: string): Promise<ActionResult<TaxDocument | null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const { data, error } = await supabase
      .from('tax_documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching document:', error)
      return {
        success: false,
        error: 'Failed to fetch document',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in getDocument:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Get document to find file path
    const { data: document, error: fetchError } = await supabase
      .from('tax_documents')
      .select('file_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError || !document) {
      return {
        success: false,
        error: 'Document not found',
      }
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_path])

    if (storageError) {
      console.error('Error deleting from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('tax_documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting document record:', deleteError)
      return {
        success: false,
        error: 'Failed to delete document',
      }
    }

    revalidatePath('/dashboard/documents')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('Unexpected error in deleteDocument:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get documents by tax year
 */
export async function getDocumentsByYear(taxYear: number): Promise<ActionResult<TaxDocument[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const { data, error } = await supabase
      .from('tax_documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('tax_year', taxYear)
      .order('upload_date', { ascending: false })

    if (error) {
      console.error('Error fetching documents by year:', error)
      return {
        success: false,
        error: 'Failed to fetch documents',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error in getDocumentsByYear:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Search documents by text
 */
export async function searchDocuments(query: string): Promise<ActionResult<TaxDocument[]>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Use PostgreSQL full-text search
    const { data, error } = await supabase
      .from('tax_documents')
      .select('*')
      .eq('user_id', user.id)
      .textSearch('extracted_text', query)
      .order('upload_date', { ascending: false })

    if (error) {
      console.error('Error searching documents:', error)
      return {
        success: false,
        error: 'Failed to search documents',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error in searchDocuments:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
