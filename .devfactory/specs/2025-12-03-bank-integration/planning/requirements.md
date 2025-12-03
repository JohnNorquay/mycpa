# Requirements: Bank Integration

## Initial Request

Implement Plaid API integration for bank account connections, automatic daily transaction sync with 2+ years of history, Claude-powered transaction categorization, and a full transaction management UI.

## Product Context

### Mission Alignment
Automates financial tracking and provides the transaction data foundation for cash flow forecasting, tax planning, and IRS expense validation.

### Roadmap Context
- Current Phase: Phase 3 - Financial Tracking & Bank Integration
- Feature Priority: High - enables cash flow and tax features
- Related Features: Foundation (auth), Cash Flow (uses transactions), Tax Planning (uses categories)

### Technical Context
- Stack: Next.js 14, Supabase, Plaid Node SDK, Claude API
- Key Integration: Plaid Link, Plaid Transactions API
- Background Jobs: Vercel Cron for daily sync

## Clarification Q&A

No additional clarification needed - original product spec was comprehensive.

## Visual Assets

No visual assets provided. Standard transaction list UI with Plaid Link modal.

## Functional Requirements

### 13. Plaid Integration Setup

1. **Plaid Link Integration**:
   - Implement Plaid Link (React) for account connection
   - Create link token via API route
   - Handle public token exchange for access token
   - Store encrypted access token in database
2. **Supported Account Types**:
   - Checking accounts
   - Savings accounts
   - Credit cards
   - (Investment accounts out of scope for v1)
3. **Institution Display**:
   - Show connected institution name and logo
   - Display account name, type, and current balance
   - Last synced timestamp
4. **Account Management**:
   - View all connected accounts
   - Disconnect/remove account (revoke Plaid access)
   - Re-authenticate expired connections (Link update mode)
5. **Error Handling**:
   - Handle Plaid errors gracefully
   - Display user-friendly messages
   - Retry logic for transient failures
6. **Sandbox/Production Toggle**: Environment-based Plaid configuration

### 14. Transaction Sync Engine

1. **Initial Sync**:
   - Fetch up to 2 years of transaction history on first connect
   - Paginate through large datasets
   - Store with proper deduplication (transaction_id)
2. **Daily Sync** (Vercel Cron):
   - Run at 6 AM daily
   - Fetch new/modified transactions since last sync
   - Handle removed transactions (mark as removed, don't delete)
3. **Incremental Updates**:
   - Track cursor for efficient syncing
   - Handle transaction modifications
   - Process pending transactions appropriately
4. **Sync Status**:
   - Track last successful sync per account
   - Display sync status in UI
   - Manual "Sync Now" button
5. **Transaction Processing**:
   - Normalize merchant names
   - Parse Plaid categories (use as fallback)
   - Set pending flag for pending transactions
6. **Error Recovery**:
   - Retry failed syncs with exponential backoff
   - Alert on persistent failures
   - Log sync history for debugging

### 15. AI Transaction Categorization

1. **Claude Integration**:
   - Use Claude 3.5 Haiku for cost efficiency
   - Batch categorization for new transactions
   - Single transaction categorization on demand
2. **Categorization Request**:
   - Send: merchant name, amount, date, Plaid category (hint)
   - Receive: category, is_tax_deductible flag, confidence score
3. **Category Mapping**:
   - Map to user's category system
   - Tax-relevant categories: Deductible Expenses, Charitable, Medical, Home Office
   - Standard categories: Housing, Transportation, Food, Utilities, Entertainment, Healthcare
4. **Confidence Scoring**:
   - High (>0.9): Auto-apply category
   - Medium (0.7-0.9): Apply with review flag
   - Low (<0.7): Mark as uncategorized
5. **Learning from Corrections**:
   - Track user category overrides
   - Use overrides to improve future categorization
   - Build merchant → category mapping
6. **Batch Processing**:
   - Process new transactions in batches of 50
   - Run after sync completes
   - Background processing via Inngest

### 16. Transaction Management UI

1. **Transaction List**:
   - Date, merchant, amount, category, account
   - Paginated with infinite scroll
   - Color coding: income (green), expense (red)
2. **Filtering**:
   - Date range picker
   - Category filter (multi-select)
   - Account filter
   - Income/expense toggle
   - Tax-deductible only
   - Search by merchant name
3. **Sorting**:
   - Date (default, newest first)
   - Amount
   - Merchant name
   - Category
4. **Transaction Detail**:
   - Full transaction info
   - Edit category (with AI suggestion)
   - Toggle tax-deductible
   - Add notes
   - Attach receipt (link to Documents)
   - Mark as recurring
5. **Split Transaction**:
   - Split single transaction into multiple categories
   - E.g., Costco run: $100 groceries + $40 gas
   - Track split children linked to parent
6. **Bulk Actions**:
   - Select multiple transactions
   - Bulk categorize
   - Bulk mark as tax-deductible
7. **Recurring Detection UI**:
   - Show recurring badge on detected patterns
   - Link to recurring transaction management

### 17. Category Management

1. **Default Categories**:
   - Pre-populated standard categories
   - Tax-relevant categories pre-flagged
2. **Custom Categories**:
   - Create new categories
   - Set parent category (hierarchy)
   - Choose color for UI
   - Mark as tax-deductible
3. **Category Hierarchy**:
   - Parent/child relationship
   - E.g., Transportation > Gas, Transportation > Car Payment
4. **Category Rules**:
   - Create rules: "Merchant contains X → Category Y"
   - Apply rules to existing transactions
   - Auto-apply to new transactions
5. **Category Merging**:
   - Merge two categories into one
   - Update all transactions
6. **Category Usage Stats**:
   - Show transaction count per category
   - Monthly spending per category

## Non-Functional Requirements

### Performance
- Plaid Link opens < 2s
- Transaction list loads < 1s (first 50)
- Category assignment < 500ms (Claude API)
- Sync completes within Vercel function timeout (60s for initial, 10s for daily)

### Security
- Plaid access tokens encrypted at rest
- Tokens never exposed to client
- RLS on all transaction data
- Audit log for account connections

### Reliability
- Sync retry on failure (3 attempts)
- Graceful degradation if Plaid unavailable
- No data loss on sync failures

### Cost Control
- Batch Claude calls to minimize API costs
- Cache categorization for known merchants
- Haiku model for routine categorization

## Integration Points

1. **Foundation**: Auth, database, UI shell
2. **Plaid API**: Account connection, transactions
3. **Claude API**: Transaction categorization
4. **Cash Flow spec**: Recurring detection reads transactions
5. **Tax Planning spec**: Tax-deductible expenses
6. **Documents spec**: Receipt attachments

## Out of Scope

1. Investment account sync (stocks, crypto)
2. Real-time transaction webhooks (use daily polling)
3. Bill pay integration
4. Account balance alerts
5. Multi-currency support

## Dependencies

1. Foundation spec complete
2. Plaid account with sandbox access
3. Anthropic API key configured
4. Inngest configured for background jobs

## Success Criteria

- [ ] User can connect bank account via Plaid Link
- [ ] Initial sync fetches 2 years of transactions
- [ ] Daily cron syncs new transactions
- [ ] Transactions are auto-categorized by Claude
- [ ] User can view, filter, and search transactions
- [ ] User can edit categories and override AI
- [ ] User can split transactions
- [ ] User can create custom categories
- [ ] Category rules auto-apply to new transactions
- [ ] Sync status visible in UI

## Open Questions

None. Requirements complete and ready for specification.

## Next Steps

Ready to proceed to formal specification via `/create-spec`.

---

*This requirements document was created through lite shape-spec process, leveraging comprehensive product planning already completed.*
