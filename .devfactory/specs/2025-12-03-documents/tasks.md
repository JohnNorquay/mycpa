# Implementation Tasks: Documents

## Task Groups Overview

| Group | Name                | Tasks | Dependencies |
| ----- | ------------------- | ----- | ------------ |
| 1     | Storage Setup       | 3     | Foundation   |
| 2     | Upload System       | 4     | Group 1      |
| 3     | OCR Processing      | 5     | Group 2      |
| 4     | Data Extraction     | 4     | Group 3      |
| 5     | Document Library UI | 6     | Group 4      |
| 6     | Testing             | 3     | All          |

---

## Task Group 1: Storage Setup

**Assigned Agent:** `database-engineer`

- [ ] **1.1** Configure Supabase Storage bucket
  - Create `documents` bucket
  - Set 10MB file size limit
  - Configure allowed MIME types (pdf, jpg, png, heic)
  - **depends_on**: []

- [ ] **1.2** Create storage RLS policies
  - Users can only access their own documents
  - Authenticated access only
  - Path pattern: `{user_id}/**`
  - **depends_on**: ["1.1"]

- [ ] **1.3** Add document columns to database
  - Verify `tax_documents` table exists
  - Add `extracted_text` column for full-text search
  - Add GIN index for text search
  - **depends_on**: []
  - **parallel_with**: ["1.1", "1.2"]

---

## Task Group 2: Upload System

**Assigned Agent:** `integration-engineer`

- [ ] **2.1** Create upload utility
  - `lib/documents/upload.ts`
  - File validation (type, size)
  - Unique filename generation
  - Storage path organization
  - **depends_on**: ["1.2"]

- [ ] **2.2** Create upload server action
  - `actions/documents.ts` - `uploadDocument()`
  - Form data handling
  - Create database record
  - Trigger processing
  - **depends_on**: ["2.1", "1.3"]

- [ ] **2.3** Create upload dropzone component
  - `components/features/documents/upload-dropzone.tsx`
  - Drag-and-drop support
  - Click to browse
  - Multi-file upload
  - **depends_on**: ["2.1"]
  - **parallel_with**: ["2.2"]

- [ ] **2.4** Create upload progress component
  - `components/features/documents/upload-progress.tsx`
  - Per-file progress indicator
  - Success/error states
  - Cancel option
  - **depends_on**: ["2.3"]

---

## Task Group 3: OCR Processing

**Assigned Agent:** `integration-engineer`

- [ ] **3.1** Create OCR processor utility
  - `lib/documents/ocr-processor.ts`
  - Claude Vision API integration
  - Multi-page PDF handling
  - Rate limiting consideration
  - **depends_on**: ["2.2"]

- [ ] **3.2** Create document classifier
  - `lib/documents/classifier.ts`
  - Document type detection
  - Confidence scoring
  - Handle unknown types
  - **depends_on**: ["3.1"]

- [ ] **3.3** Create Inngest processing function
  - `inngest/functions/process-document.ts`
  - Trigger on upload
  - Update processing status
  - Handle retries (max 3)
  - **depends_on**: ["3.2"]

- [ ] **3.4** Create processing status component
  - `components/features/documents/processing-status.tsx`
  - Show pending/processing/completed/failed
  - Reprocess button for failed
  - **depends_on**: ["3.3"]

- [ ] **3.5** Create error handling
  - Log processing errors
  - Update status on failure
  - User notification of failures
  - **depends_on**: ["3.3"]
  - **parallel_with**: ["3.4"]

---

## Task Group 4: Data Extraction

**Assigned Agent:** `integration-engineer`

- [ ] **4.1** Create W2 extractor
  - `lib/documents/extractor.ts`
  - Extract all W2 box values
  - Confidence per field
  - Handle variations in form layout
  - **depends_on**: ["3.2"]

- [ ] **4.2** Create 1099 extractors
  - 1099-MISC, 1099-NEC, 1099-INT, 1099-DIV
  - Common fields across types
  - Type-specific fields
  - **depends_on**: ["3.2"]
  - **parallel_with**: ["4.1"]

- [ ] **4.3** Create IRS notice extractor
  - Notice type/number
  - Tax year
  - Amount due
  - Response deadline
  - Key actions required
  - **depends_on**: ["3.2"]
  - **parallel_with**: ["4.1", "4.2"]

- [ ] **4.4** Create income entry integration
  - Auto-create income entry from W2
  - Auto-create income entry from 1099
  - Link entry to source document
  - **depends_on**: ["4.1", "4.2"]

---

## Task Group 5: Document Library UI

**Assigned Agent:** `ui-designer`

- [ ] **5.1** Create document library page
  - `app/(dashboard)/documents/page.tsx`
  - Upload zone at top
  - Document list below
  - Year filter prominent
  - **depends_on**: ["2.4", "3.4"]

- [ ] **5.2** Create document grid component
  - `components/features/documents/document-grid.tsx`
  - Thumbnail cards
  - Document type badge
  - Processing status indicator
  - **depends_on**: ["5.1"]

- [ ] **5.3** Create document list component
  - `components/features/documents/document-list.tsx`
  - Table view
  - Sortable columns
  - Bulk selection
  - **depends_on**: ["5.1"]
  - **parallel_with**: ["5.2"]

- [ ] **5.4** Create document filters component
  - `components/features/documents/document-filters.tsx`
  - Filter by tax year
  - Filter by document type
  - Filter by processing status
  - Search by content
  - **depends_on**: ["5.1"]
  - **parallel_with**: ["5.2", "5.3"]

- [ ] **5.5** Create document detail page
  - `app/(dashboard)/documents/[id]/page.tsx`
  - Document preview
  - Extracted data display
  - Edit extracted data
  - Delete option
  - **depends_on**: ["4.4"]

- [ ] **5.6** Create extracted data editor
  - `components/features/documents/extracted-data-editor.tsx`
  - Form for editing extracted values
  - Save changes
  - Mark as manually edited
  - **depends_on**: ["5.5"]

---

## Task Group 6: Testing

**Assigned Agent:** `testing-engineer`

- [ ] **6.1** Test upload system
  - Test file type validation
  - Test file size limits
  - Test multi-file upload
  - Test storage path creation
  - **depends_on**: ["2.4"]

- [ ] **6.2** Test OCR processing
  - Test with sample W2
  - Test with sample 1099
  - Test with IRS notice
  - Verify extraction accuracy
  - **depends_on**: ["4.4"]
  - **parallel_with**: ["6.1"]

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
  - **depends_on**: ["6.1", "6.2", "5.6"]

---

## Completion Checklist

- [ ] Storage bucket configured with RLS
- [ ] Upload system working
- [ ] OCR processing documents
- [ ] Document classification accurate (>95%)
- [ ] W2/1099 extraction working
- [ ] Document library UI complete
- [ ] All tests passing

---

## Parallel Execution Summary

### Dependency Graph

```
PHASE 1 (No dependencies - Maximum Parallelism):
├── 1.1 Configure Supabase Storage bucket
└── 1.3 Add document columns to database

PHASE 2 (After Phase 1):
└── 1.2 Create storage RLS policies       ← depends_on: [1.1]

PHASE 3 (After Phase 2):
├── 2.1 Create upload utility             ← depends_on: [1.2]

PHASE 4 (After Phase 3):
├── 2.2 Create upload server action       ← depends_on: [2.1, 1.3]
└── 2.3 Create upload dropzone component  ← depends_on: [2.1]

PHASE 5 (After Phase 4):
├── 2.4 Create upload progress component  ← depends_on: [2.3]
└── 3.1 Create OCR processor utility      ← depends_on: [2.2]

PHASE 6 (After Phase 5):
├── 3.2 Create document classifier        ← depends_on: [3.1]
└── 6.1 Test upload system                ← depends_on: [2.4]

PHASE 7 (After Phase 6):
├── 3.3 Create Inngest processing func    ← depends_on: [3.2]
├── 4.1 Create W2 extractor               ← depends_on: [3.2]
├── 4.2 Create 1099 extractors            ← depends_on: [3.2]
└── 4.3 Create IRS notice extractor       ← depends_on: [3.2]

PHASE 8 (After Phase 7):
├── 3.4 Create processing status comp     ← depends_on: [3.3]
├── 3.5 Create error handling             ← depends_on: [3.3]
└── 4.4 Create income entry integration   ← depends_on: [4.1, 4.2]

PHASE 9 (After Phase 8):
├── 5.1 Create document library page      ← depends_on: [2.4, 3.4]
├── 5.5 Create document detail page       ← depends_on: [4.4]
└── 6.2 Test OCR processing               ← depends_on: [4.4]

PHASE 10 (After Phase 9):
├── 5.2 Create document grid component    ← depends_on: [5.1]
├── 5.3 Create document list component    ← depends_on: [5.1]
├── 5.4 Create document filters component ← depends_on: [5.1]
└── 5.6 Create extracted data editor      ← depends_on: [5.5]

PHASE 11 (Final):
└── 6.3 Manual verification               ← depends_on: [6.1, 6.2, 5.6]
```

### Parallel Execution Waves

| Wave | Tasks (can run simultaneously) | Count |
| ---- | ------------------------------ | ----- |
| 1    | 1.1, 1.3                       | 2     |
| 2    | 1.2                            | 1     |
| 3    | 2.1                            | 1     |
| 4    | 2.2, 2.3                       | 2     |
| 5    | 2.4, 3.1                       | 2     |
| 6    | 3.2, 6.1                       | 2     |
| 7    | 3.3, 4.1, 4.2, 4.3             | 4     |
| 8    | 3.4, 3.5, 4.4                  | 3     |
| 9    | 5.1, 5.5, 6.2                  | 3     |
| 10   | 5.2, 5.3, 5.4, 5.6             | 4     |
| 11   | 6.3                            | 1     |

### Critical Path

```
1.1 → 1.2 → 2.1 → 2.2 → 3.1 → 3.2 → 4.1/4.2 → 4.4 → 5.5 → 5.6 → 6.3
                  ↓                   ↓
               2.3 → 2.4 → 6.1       3.3 → 3.4 → 5.1 → 5.2-5.4
                      ↓                         ↑
                   ───────────────────────────────
```

**Critical Path Length**: 11 sequential phases (vs 25 tasks if sequential = 2.3x speedup potential)
