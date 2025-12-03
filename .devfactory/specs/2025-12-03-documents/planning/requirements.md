# Requirements: Documents

## Initial Request

Build a secure document management system with drag-and-drop upload, Claude Vision OCR processing, automatic document type classification, structured data extraction from tax forms, and a searchable document library.

## Product Context

### Mission Alignment
Eliminates manual document organization and data entry for tax season. Extracted data feeds into tax calculations and IRS correspondence tracking.

### Roadmap Context
- Current Phase: Phase 5 - Document Management
- Feature Priority: Medium - supports tax planning and debt resolution
- Related Features: Tax Debt (correspondence attachments), Tax Planning (W2/1099 data)

### Technical Context
- Stack: Next.js 14, Supabase Storage, Claude Vision API
- Processing: Claude Vision for OCR and extraction (Vercel-compatible)
- Background Jobs: Inngest for async processing

## Clarification Q&A

No additional clarification needed - original product spec comprehensive.

## Visual Assets

No visual assets provided. Standard document library with grid/list view.

## Functional Requirements

### 28. Document Upload System

1. **Upload Interface**:
   - Drag-and-drop zone
   - Click to browse
   - Multi-file upload support
   - Progress indicator per file
2. **Supported Formats**:
   - PDF (primary)
   - Images: JPG, PNG, HEIC
   - Max file size: 10MB
3. **Upload Metadata**:
   - Tax year (default current, user selectable)
   - Document type (optional, AI will classify)
   - Notes (optional)
4. **Storage Organization**:
   - Path: `{user_id}/{tax_year}/{document_type}/{filename}`
   - Unique filename generation (avoid collisions)
5. **Security**:
   - Direct upload to Supabase Storage
   - Signed URLs for access (expire in 1 hour)
   - RLS on storage bucket
6. **Encryption**:
   - Supabase Storage server-side encryption
   - (Optional future: client-side encryption for sensitive docs)
7. **Upload Validation**:
   - File type validation
   - Size limit enforcement
   - Malware scan (future enhancement)

### 29. OCR Processing Pipeline

1. **Processing Trigger**:
   - Automatic on upload completion
   - Queue via Inngest for async processing
2. **Claude Vision Integration**:
   - Send document image to Claude Vision API
   - Prompt for structured text extraction
   - Handle multi-page PDFs (process page by page)
3. **PDF Handling**:
   - Convert PDF pages to images
   - Process each page
   - Combine results
4. **Processing Status**:
   - pending: Just uploaded
   - processing: OCR in progress
   - completed: Successfully processed
   - failed: Error during processing
5. **Error Handling**:
   - Retry failed processing (up to 3 times)
   - Log errors for debugging
   - User notification of failures
6. **Rate Limiting**:
   - Queue documents to avoid API rate limits
   - Process in batches during off-peak
7. **Cost Tracking**:
   - Track API calls per document
   - Estimate cost per document type

### 30. Document Classification & Extraction

1. **Document Type Classification**:
   - W2 (Wage and Tax Statement)
   - 1099-MISC (Miscellaneous Income)
   - 1099-NEC (Nonemployee Compensation)
   - 1099-INT (Interest Income)
   - 1099-DIV (Dividends)
   - 1099-B (Broker Transactions)
   - 1099-R (Retirement Distributions)
   - 1098 (Mortgage Interest)
   - Property Tax Bill
   - Charitable Donation Receipt
   - Medical Bill/Statement
   - IRS Notice/Letter
   - Other (unclassified)
2. **W2 Extraction**:
   - Employer name and EIN
   - Box 1: Wages, tips, other compensation
   - Box 2: Federal income tax withheld
   - Box 3-6: Social Security wages and tax
   - Box 16: State wages
   - Box 17: State income tax withheld
3. **1099 Extraction** (common fields):
   - Payer name and TIN
   - Recipient name
   - Box 1: Amount (varies by form type)
   - Box 4: Federal tax withheld (if any)
4. **1098 Extraction**:
   - Lender name
   - Box 1: Mortgage interest received
   - Box 2: Outstanding mortgage principal
5. **Property Tax Bill Extraction**:
   - Taxing authority
   - Property address
   - Total tax amount
   - Payment due date
6. **IRS Notice Extraction**:
   - Notice type/number
   - Tax year referenced
   - Amount due (if applicable)
   - Response deadline
   - Key action required
7. **Confidence Scoring**:
   - Per-field confidence from Claude
   - Flag low-confidence extractions for review
8. **Extracted Data Storage**:
   - Store in JSONB column
   - Structured by document type
   - Searchable

### 31. Document Management UI

1. **Document Library View**:
   - Grid view (thumbnails) and list view toggle
   - Sort by: upload date, tax year, type, name
   - Default: most recent first
2. **Filtering**:
   - By tax year
   - By document type
   - By processing status
   - By search query (searches extracted text)
3. **Search**:
   - Full-text search on extracted content
   - Search by document name
   - Search by employer/payer name
4. **Document Preview**:
   - In-app document viewer
   - PDF viewer with page navigation
   - Image viewer with zoom
5. **Document Details Panel**:
   - Document metadata
   - Extracted data (formatted)
   - Edit extracted fields (manual correction)
   - Re-process button (re-run OCR)
   - Delete document
6. **Bulk Operations**:
   - Select multiple documents
   - Bulk delete
   - Bulk move to different year
   - Bulk download (zip)
7. **Year-End Summary**:
   - View all documents for tax year
   - Checklist: "Do you have all your documents?"
   - W2 count, 1099 count, etc.
8. **Tax Season Prep Mode**:
   - Guided view for collecting tax documents
   - Checkboxes for expected document types
   - Missing document alerts
9. **Integration Display**:
   - Show where extracted data was used
   - "This W2 is reflected in your tax projection"
   - Link to correspondence (for IRS notices)

## Non-Functional Requirements

### Performance
- Upload initiation < 1s
- OCR processing < 10s per page (async)
- Document library loads < 2s (first 20 docs)

### Security
- All documents encrypted at rest
- Signed URLs expire in 1 hour
- RLS enforced on all storage access
- No document content in logs

### Accuracy
- Document classification > 95% accuracy
- Field extraction > 90% accuracy for standard forms
- User can correct any extraction errors

### Storage
- Efficient storage usage
- Support for years of document history
- Export capability for all documents

## Integration Points

1. **Tax Debt Core**: IRS notices link to correspondence tracker
2. **Tax Planning**: W2/1099 data feeds income totals
3. **Transactions**: Receipts can attach to transactions
4. **AI Insights**: Document data available for Q&A

## Out of Scope

1. E-signature integration
2. Document sharing/collaboration
3. Third-party cloud storage integration (Drive, Dropbox)
4. Mobile camera capture (future enhancement)
5. Email auto-import (future enhancement)
6. Client-side encryption (future enhancement)

## Dependencies

1. Foundation complete (auth, storage configured)
2. Supabase Storage bucket configured with RLS
3. Claude Vision API access
4. Inngest configured for background processing

## Success Criteria

- [ ] User can drag-and-drop upload documents
- [ ] Documents stored securely in Supabase Storage
- [ ] OCR processing extracts text automatically
- [ ] Document type classified correctly (>95%)
- [ ] W2 fields extracted accurately
- [ ] 1099 fields extracted accurately
- [ ] IRS notices extract key info
- [ ] User can search documents by content
- [ ] User can filter by year and type
- [ ] User can preview documents in-app
- [ ] User can correct extracted data
- [ ] Extracted W2 data reflected in tax projection

## Open Questions

None. Requirements complete and ready for specification.

## Next Steps

Ready to proceed to formal specification via `/create-spec`.

---

*This requirements document was created through lite shape-spec process, leveraging comprehensive product planning already completed.*
