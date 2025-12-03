# Implementation Tasks: Bank Integration

## Task Groups Overview

| Group | Name | Tasks | Dependencies |
|-------|------|-------|--------------|
| 1 | Plaid Setup | 5 | Foundation |
| 2 | Transaction Sync | 5 | Group 1 |
| 3 | AI Categorization | 4 | Group 2 |
| 4 | Transaction UI | 6 | Group 3 |
| 5 | Category Management | 4 | Group 4 |
| 6 | Testing | 3 | All |

---

## Task Group 1: Plaid Setup

**Assigned Agent:** `integration-engineer`

- [ ] **1.1** Install Plaid dependencies
  ```bash
  pnpm add plaid react-plaid-link
  ```

- [ ] **1.2** Create Plaid client utility
  - `lib/plaid/client.ts`
  - Environment-based configuration

- [ ] **1.3** Create link token API route
  - `app/api/plaid/create-link-token/route.ts`
  - Returns link token for Plaid Link

- [ ] **1.4** Create token exchange API route
  - `app/api/plaid/exchange-token/route.ts`
  - Exchange public token for access token
  - Store encrypted in database

- [ ] **1.5** Create Plaid Link button component
  - `components/features/transactions/plaid-link-button.tsx`
  - Handle success/error callbacks
  - Trigger initial sync on success

---

## Task Group 2: Transaction Sync

**Assigned Agent:** `integration-engineer`

- [ ] **2.1** Create transaction sync utility
  - `lib/plaid/sync.ts`
  - Fetch transactions with pagination
  - Handle cursor for incremental sync

- [ ] **2.2** Create sync API route
  - `app/api/plaid/sync/route.ts`
  - Manual sync trigger
  - Update last_synced timestamp

- [ ] **2.3** Create daily cron job
  - `app/api/cron/sync-transactions/route.ts`
  - Configure in vercel.json
  - Process all users with Plaid accounts

- [ ] **2.4** Handle transaction deduplication
  - Use transaction_id as unique key
  - Handle modified transactions
  - Mark removed transactions

- [ ] **2.5** Create accounts management page
  - `app/(dashboard)/settings/accounts/page.tsx`
  - List connected accounts
  - Show sync status
  - Disconnect option

---

## Task Group 3: AI Categorization

**Assigned Agent:** `integration-engineer`

- [ ] **3.1** Install Claude SDK
  ```bash
  pnpm add @anthropic-ai/sdk
  ```

- [ ] **3.2** Create categorization utility
  - `lib/claude/categorize.ts`
  - Prompt for transaction categorization
  - Parse JSON response

- [ ] **3.3** Create Inngest function for batch processing
  - `inngest/functions/categorize-transactions.ts`
  - Process uncategorized transactions
  - Batch for efficiency

- [ ] **3.4** Create merchant → category mapping table
  - Cache known merchant categories
  - Update on user corrections
  - Use cache before calling Claude

---

## Task Group 4: Transaction UI

**Assigned Agent:** `ui-designer`

- [ ] **4.1** Create transaction list component
  - `components/features/transactions/transaction-list.tsx`
  - Infinite scroll
  - Color coding (income/expense)

- [ ] **4.2** Create transaction filters
  - `components/features/transactions/transaction-filters.tsx`
  - Date range, category, account, search

- [ ] **4.3** Create transaction detail component
  - `components/features/transactions/transaction-detail.tsx`
  - Edit category, notes
  - Toggle tax-deductible

- [ ] **4.4** Create split transaction modal
  - `components/features/transactions/split-transaction-modal.tsx`
  - Add line items
  - Validate sum equals original

- [ ] **4.5** Create transactions page
  - `app/(dashboard)/transactions/page.tsx`
  - List with filters
  - Bulk actions

- [ ] **4.6** Create transaction actions
  - `actions/transactions.ts`
  - Update category, split, delete

---

## Task Group 5: Category Management

**Assigned Agent:** `ui-designer`

- [ ] **5.1** Create category select component
  - `components/features/transactions/category-select.tsx`
  - Searchable dropdown
  - Show tax-deductible badge

- [ ] **5.2** Create category manager
  - `components/features/transactions/category-manager.tsx`
  - Add/edit/delete categories
  - Parent category hierarchy

- [ ] **5.3** Create category rules
  - "If merchant contains X, use category Y"
  - Apply to existing transactions
  - Auto-apply to new

- [ ] **5.4** Create category actions
  - `actions/categories.ts`
  - CRUD for categories and rules

---

## Task Group 6: Testing

**Assigned Agent:** `testing-engineer`

- [ ] **6.1** Test Plaid integration
  - Use Plaid sandbox
  - Test link flow
  - Test sync

- [ ] **6.2** Test categorization
  - Verify Claude responses parse correctly
  - Test confidence thresholds

- [ ] **6.3** Manual verification
  - [ ] Can connect bank account
  - [ ] Transactions sync
  - [ ] Categories assigned
  - [ ] Can edit category
  - [ ] Can split transaction
  - [ ] Filters work correctly

---

## Completion Checklist

- [ ] Plaid Link working
- [ ] Transactions syncing
- [ ] AI categorization running
- [ ] Transaction UI complete
- [ ] Category management working
- [ ] Tests passing
