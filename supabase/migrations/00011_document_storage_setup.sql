-- =====================================================
-- Migration: Document Storage Setup
-- Description: Sets up document storage bucket, RLS policies, and enhances tax_documents table
-- Tasks: 1.1, 1.2, 1.3 from documents spec
-- =====================================================

-- =====================================================
-- SECTION 1: Storage Bucket Configuration (Task 1.1)
-- =====================================================
-- Create the documents storage bucket with:
-- - Private access (public = false)
-- - 10MB file size limit
-- - Restricted to PDF, JPEG, PNG, and HEIC formats

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- SECTION 2: Storage RLS Policies (Task 1.2)
-- =====================================================
-- Enable Row Level Security on storage.objects
-- Path pattern: {user_id}/** (users can only access their own documents)

-- Policy: Users can upload their own documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Users can view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================
-- SECTION 3: Document Table Updates (Task 1.3)
-- =====================================================
-- Enhance the existing tax_documents table with additional columns
-- for document processing, metadata, and full-text search

-- Add extracted_text column for full-text search
ALTER TABLE tax_documents
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Add processing_status column to track document processing state
-- Values: 'pending', 'processing', 'completed', 'failed'
ALTER TABLE tax_documents
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';

-- Add extraction_confidence column to store OCR confidence scores
-- Range: 0.0000 to 1.0000 (0% to 100%)
ALTER TABLE tax_documents
ADD COLUMN IF NOT EXISTS extraction_confidence DECIMAL(5,4);

-- Add file_name column to store original file name
ALTER TABLE tax_documents
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- Add file_size column to store file size in bytes
ALTER TABLE tax_documents
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Add mime_type column to store file MIME type
ALTER TABLE tax_documents
ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- =====================================================
-- SECTION 4: Indexes for Performance
-- =====================================================
-- Create indexes for efficient querying and full-text search

-- GIN index for full-text search on extracted_text
-- This enables fast searches across document content
CREATE INDEX IF NOT EXISTS idx_tax_documents_extracted_text
ON tax_documents USING GIN (to_tsvector('english', extracted_text));

-- B-tree index on processing_status for filtering documents by status
CREATE INDEX IF NOT EXISTS idx_tax_documents_processing_status
ON tax_documents(processing_status);

-- =====================================================
-- SECTION 5: Add Constraints
-- =====================================================
-- Add check constraints to ensure data quality

-- Ensure processing_status has valid values
ALTER TABLE tax_documents
ADD CONSTRAINT IF NOT EXISTS chk_processing_status
CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- Ensure extraction_confidence is between 0 and 1
ALTER TABLE tax_documents
ADD CONSTRAINT IF NOT EXISTS chk_extraction_confidence
CHECK (extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1));

-- Ensure file_size is positive
ALTER TABLE tax_documents
ADD CONSTRAINT IF NOT EXISTS chk_file_size
CHECK (file_size IS NULL OR file_size > 0);

-- =====================================================
-- SECTION 6: Comments for Documentation
-- =====================================================
-- Add helpful comments to explain the new columns

COMMENT ON COLUMN tax_documents.extracted_text IS 'Full text extracted from document via OCR for search functionality';
COMMENT ON COLUMN tax_documents.processing_status IS 'Current processing state: pending, processing, completed, or failed';
COMMENT ON COLUMN tax_documents.extraction_confidence IS 'OCR confidence score (0.0000 to 1.0000)';
COMMENT ON COLUMN tax_documents.file_name IS 'Original file name as uploaded by user';
COMMENT ON COLUMN tax_documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN tax_documents.mime_type IS 'MIME type of the uploaded document';
