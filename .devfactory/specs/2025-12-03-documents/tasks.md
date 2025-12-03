# Implementation Tasks: Documents

## Task Groups Overview

| Group | Name | Tasks | Dependencies |
|-------|------|-------|--------------|
| 1 | Storage Setup | 3 | Foundation |
| 2 | Upload System | 4 | Group 1 |
| 3 | OCR Processing | 5 | Group 2 |
| 4 | Data Extraction | 4 | Group 3 |
| 5 | Document Library UI | 6 | Group 4 |
| 6 | Testing | 3 | All |

---

## Task Group 1: Storage Setup

**Assigned Agent:** `database-engineer`

- [ ] **1.1** Configure Supabase Storage bucket
  - Create `documents` bucket
  - Set 10MB file size limit
  - Configure allowed MIME types (pdf, jpg, png, heic)

- [ ] **1.2** Create storage RLS policies
  - Users can only access their own documents
  - Authenticated access only
  - Path pattern: `{user_id}/**`

- [ ] **1.3** Add document columns to database
  - Verify `tax_documents` table exists
  - Add `extracted_text` column for full-text search
  - Add GIN index for text search

---

## Task Group 2: Upload System

**Assigned Agent:** `integration-engineer`

- [ ] **2.1** Create upload utility
  - `lib/documents/upload.ts`
  - File validation (type, size)
  - Unique filename generation
  - Storage path organization

- [ ] **2.2** Create upload server action
  - `actions/documents.ts` - `uploadDocument()`
  - Form data handling
  - Create database record
  - Trigger processing

- [ ] **2.3** Create upload dropzone component
  - `components/features/documents/upload-dropzone.tsx`
  - Drag-and-drop support
  - Click to browse
  - Multi-file upload

- [ ] **2.4** Create upload progress component
  - `components/features/documents/upload-progress.tsx`
  - Per-file progress indicator
  - Success/error states
  - Cancel option

---

## Task Group 3: OCR Processing

**Assigned Agent:** `integration-engineer`

- [ ] **3.1** Create OCR processor utility
  - `lib/documents/ocr-processor.ts`
  - Claude Vision API integration
  - Multi-page PDF handling
  - Rate limiting consideration

- [ ] **3.2** Create document classifier
  - `lib/documents/classifier.ts`
  - Document type detection
  - Confidence scoring
  - Handle unknown types

- [ ] **3.3** Create Inngest processing function
  - `inngest/functions/process-document.ts`
  - Trigger on upload
  - Update processing status
  - Handle retries (max 3)

- [ ] **3.4** Create processing status component
  - `components/features/documents/processing-status.tsx`
  - Show pending/processing/completed/failed
  - Reprocess button for failed

- [ ] **3.5** Create error handling
  - Log processing errors
  - Update status on failure
  - User notification of failures

---

## Task Group 4: Data Extraction

**Assigned Agent:** `integration-engineer`

- [ ] **4.1** Create W2 extractor
  - `lib/documents/extractor.ts`
  - Extract all W2 box values
  - Confidence per field
  - Handle variations in form layout

- [ ] **4.2** Create 1099 extractors
  - 1099-MISC, 1099-NEC, 1099-INT, 1099-DIV
  - Common fields across types
  - Type-specific fields

- [ ] **4.3** Create IRS notice extractor
  - Notice type/number
  - Tax year
  - Amount due
  - Response deadline
  - Key actions required

- [ ] **4.4** Create income entry integration
  - Auto-create income entry from W2
  - Auto-create income entry from 1099
  - Link entry to source document

---

## Task Group 5: Document Library UI

**Assigned Agent:** `ui-designer`

- [ ] **5.1** Create document library page
  - `app/(dashboard)/documents/page.tsx`
  - Upload zone at top
  - Document list below
  - Year filter prominent

- [ ] **5.2** Create document grid component
  - `components/features/documents/document-grid.tsx`
  - Thumbnail cards
  - Document type badge
  - Processing status indicator

- [ ] **5.3** Create document list component
  - `components/features/documents/document-list.tsx`
  - Table view
  - Sortable columns
  - Bulk selection

- [ ] **5.4** Create document filters component
  - `components/features/documents/document-filters.tsx`
  - Filter by tax year
  - Filter by document type
  - Filter by processing status
  - Search by content

- [ ] **5.5** Create document detail page
  - `app/(dashboard)/documents/[id]/page.tsx`
  - Document preview
  - Extracted data display
  - Edit extracted data
  - Delete option

- [ ] **5.6** Create extracted data editor
  - `components/features/documents/extracted-data-editor.tsx`
  - Form for editing extracted values
  - Save changes
  - Mark as manually edited

---

## Task Group 6: Testing

**Assigned Agent:** `testing-engineer`

- [ ] **6.1** Test upload system
  - Test file type validation
  - Test file size limits
  - Test multi-file upload
  - Test storage path creation

- [ ] **6.2** Test OCR processing
  - Test with sample W2
  - Test with sample 1099
  - Test with IRS notice
  - Verify extraction accuracy

- [ ] **6.3** Manual verification
  - [ ] Can upload PDF document
  - [ ] Can upload image document
  - [ ] Processing status updates correctly
  - [ ] Document type classified correctly
  - [ ] W2 data extracted accurately
  - [ ] 1099 data extracted accurately
  - [ ] Can search by document content
  - [ ] Can filter by type and year
  - [ ] Can preview document in app
  - [ ] Can edit extracted data
  - [ ] Income entry created from W2/1099

---

## Completion Checklist

- [ ] Storage bucket configured with RLS
- [ ] Upload system working
- [ ] OCR processing documents
- [ ] Document classification accurate (>95%)
- [ ] W2/1099 extraction working
- [ ] Document library UI complete
- [ ] All tests passing
