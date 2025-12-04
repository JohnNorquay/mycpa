# Implementation Tasks: Bank Integration

## Task Groups Overview

| Group | Name                | Tasks | Dependencies |
| ----- | ------------------- | ----- | ------------ |
| 1     | Plaid Setup         | 5     | Foundation   |
| 2     | Transaction Sync    | 5     | Group 1      |
| 3     | AI Categorization   | 4     | Group 2      |
| 4     | Transaction UI      | 6     | Group 3      |
| 5     | Category Management | 4     | Group 4      |
| 6     | Testing             | 3     | All          |

---

## Task Group 1: Plaid Setup

**Assigned Agent:** `integration-engineer`

- [ ] **1.1** Install Plaid dependencies

  ```bash
  pnpm add plaid react-plaid-link
  ```

  - **depends_on**: []

- [ ] **1.2** Create Plaid client utility
  - `lib/plaid/client.ts`
  - Environment-based configuration
  - **depends_on**: ["1.1"]

- [ ] **1.3** Create link token API route
  - `app/api/plaid/create-link-token/route.ts`
  - Returns link token for Plaid Link
  - **depends_on**: ["1.2"]

- [ ] **1.4** Create token exchange API route
  - `app/api/plaid/exchange-token/route.ts`
  - Exchange public token for access token
  - Store encrypted in database
  - **depends_on**: ["1.2"]
  - **parallel_with**: ["1.3"]

- [ ] **1.5** Create Plaid Link button component
  - `components/features/transactions/plaid-link-button.tsx`
  - Handle success/error callbacks
  - Trigger initial sync on success
  - **depends_on**: ["1.3", "1.4"]

---

## Task Group 2: Transaction Sync

**Assigned Agent:** `integration-engineer`

- [ ] **2.1** Create transaction sync utility
  - `lib/plaid/sync.ts`
  - Fetch transactions with pagination
  - Handle cursor for incremental sync
  - **depends_on**: ["1.2"]

- [ ] **2.2** Create sync API route
  - `app/api/plaid/sync/route.ts`
  - Manual sync trigger
  - Update last_synced timestamp
  - **depends_on**: ["2.1"]

- [ ] **2.3** Create daily cron job
  - `app/api/cron/sync-transactions/route.ts`
  - Configure in vercel.json
  - Process all users with Plaid accounts
  - **depends_on**: ["2.2"]

- [ ] **2.4** Handle transaction deduplication
  - Use transaction_id as unique key
  - Handle modified transactions
  - Mark removed transactions
  - **depends_on**: ["2.1"]
  - **parallel_with**: ["2.2", "2.3"]

- [ ] **2.5** Create accounts management page
  - `app/(dashboard)/settings/accounts/page.tsx`
  - List connected accounts
  - Show sync status
  - Disconnect option
  - **depends_on**: ["1.5", "2.2"]

---

## Task Group 3: AI Categorization

**Assigned Agent:** `integration-engineer`

- [ ] **3.1** Install Claude SDK

  ```bash
  pnpm add @anthropic-ai/sdk
  ```

  - **depends_on**: []

- [ ] **3.2** Create categorization utility
  - `lib/claude/categorize.ts`
  - Prompt for transaction categorization
  - Parse JSON response
  - **depends_on**: ["3.1"]

- [ ] **3.3** Create Inngest function for batch processing
  - `inngest/functions/categorize-transactions.ts`
  - Process uncategorized transactions
  - Batch for efficiency
  - **depends_on**: ["3.2", "2.2"]

- [ ] **3.4** Create merchant → category mapping table
  - Cache known merchant categories
  - Update on user corrections
  - Use cache before calling Claude
  - **depends_on**: ["3.2"]
  - **parallel_with**: ["3.3"]

---

## Task Group 4: Transaction UI

**Assigned Agent:** `ui-designer`

- [ ] **4.1** Create transaction list component
  - `components/features/transactions/transaction-list.tsx`
  - Infinite scroll
  - Color coding (income/expense)
  - **depends_on**: ["2.2"]

- [ ] **4.2** Create transaction filters
  - `components/features/transactions/transaction-filters.tsx`
  - Date range, category, account, search
  - **depends_on**: []
  - **parallel_with**: ["4.1"]

- [ ] **4.3** Create transaction detail component
  - `components/features/transactions/transaction-detail.tsx`
  - Edit category, notes
  - Toggle tax-deductible
  - **depends_on**: ["3.4"]

- [ ] **4.4** Create split transaction modal
  - `components/features/transactions/split-transaction-modal.tsx`
  - Add line items
  - Validate sum equals original
  - **depends_on**: ["4.3"]

- [ ] **4.5** Create transactions page
  - `app/(dashboard)/transactions/page.tsx`
  - List with filters
  - Bulk actions
  - **depends_on**: ["4.1", "4.2", "4.3"]

- [ ] **4.6** Create transaction actions
  - `actions/transactions.ts`
  - Update category, split, delete
  - **depends_on**: ["2.2"]
  - **parallel_with**: ["4.1", "4.2", "4.3"]

---

## Task Group 5: Category Management

**Assigned Agent:** `ui-designer`

- [ ] **5.1** Create category select component
  - `components/features/transactions/category-select.tsx`
  - Searchable dropdown
  - Show tax-deductible badge
  - **depends_on**: ["3.4"]

- [ ] **5.2** Create category manager
  - `components/features/transactions/category-manager.tsx`
  - Add/edit/delete categories
  - Parent category hierarchy
  - **depends_on**: ["5.1"]

- [ ] **5.3** Create category rules
  - "If merchant contains X, use category Y"
  - Apply to existing transactions
  - Auto-apply to new
  - **depends_on**: ["5.2"]

- [ ] **5.4** Create category actions
  - `actions/categories.ts`
  - CRUD for categories and rules
  - **depends_on**: ["3.4"]
  - **parallel_with**: ["5.1", "5.2"]

---

## Task Group 6: Testing

**Assigned Agent:** `testing-engineer`

- [ ] **6.1** Test Plaid integration
  - Use Plaid sandbox
  - Test link flow
  - Test sync
  - **depends_on**: ["2.5"]

- [ ] **6.2** Test categorization
  - Verify Claude responses parse correctly
  - Test confidence thresholds
  - **depends_on**: ["3.3"]
  - **parallel_with**: ["6.1"]

- [ ] **6.3** Manual verification
  - [ ] Can connect bank account
  - [ ] Transactions sync
  - [ ] Categories assigned
  - [ ] Can edit category
  - [ ] Can split transaction
  - [ ] Filters work correctly
  - **depends_on**: ["6.1", "6.2", "4.5", "5.3"]

---

## Completion Checklist

- [ ] Plaid Link working
- [ ] Transactions syncing
- [ ] AI categorization running
- [ ] Transaction UI complete
- [ ] Category management working
- [ ] Tests passing

---

## Parallel Execution Summary

### Dependency Graph

```
PHASE 1 (No dependencies - Maximum Parallelism):
├── 1.1 Install Plaid dependencies
├── 3.1 Install Claude SDK
└── 4.2 Transaction filters component

PHASE 2 (After Phase 1):
├── 1.2 Create Plaid client utility    ← depends_on: [1.1]
└── 3.2 Create categorization utility  ← depends_on: [3.1]

PHASE 3 (After Phase 2):
├── 1.3 Link token API route           ← depends_on: [1.2]
├── 1.4 Token exchange API route       ← depends_on: [1.2]
├── 2.1 Transaction sync utility       ← depends_on: [1.2]
└── 3.4 Merchant category mapping      ← depends_on: [3.2]

PHASE 4 (After Phase 3):
├── 1.5 Plaid Link button              ← depends_on: [1.3, 1.4]
├── 2.2 Sync API route                 ← depends_on: [2.1]
├── 2.4 Transaction deduplication      ← depends_on: [2.1]
├── 4.3 Transaction detail component   ← depends_on: [3.4]
├── 5.1 Category select component      ← depends_on: [3.4]
└── 5.4 Category actions               ← depends_on: [3.4]

PHASE 5 (After Phase 4):
├── 2.3 Daily cron job                 ← depends_on: [2.2]
├── 2.5 Accounts management page       ← depends_on: [1.5, 2.2]
├── 3.3 Inngest batch processing       ← depends_on: [3.2, 2.2]
├── 4.1 Transaction list component     ← depends_on: [2.2]
├── 4.4 Split transaction modal        ← depends_on: [4.3]
├── 4.6 Transaction actions            ← depends_on: [2.2]
└── 5.2 Category manager               ← depends_on: [5.1]

PHASE 6 (After Phase 5):
├── 4.5 Transactions page              ← depends_on: [4.1, 4.2, 4.3]
├── 5.3 Category rules                 ← depends_on: [5.2]
├── 6.1 Test Plaid integration         ← depends_on: [2.5]
└── 6.2 Test categorization            ← depends_on: [3.3]

PHASE 7 (Final):
└── 6.3 Manual verification            ← depends_on: [6.1, 6.2, 4.5, 5.3]
```

### Parallel Execution Waves

| Wave | Tasks (can run simultaneously)    | Count |
| ---- | --------------------------------- | ----- |
| 1    | 1.1, 3.1, 4.2                     | 3     |
| 2    | 1.2, 3.2                          | 2     |
| 3    | 1.3, 1.4, 2.1, 3.4                | 4     |
| 4    | 1.5, 2.2, 2.4, 4.3, 5.1, 5.4      | 6     |
| 5    | 2.3, 2.5, 3.3, 4.1, 4.4, 4.6, 5.2 | 7     |
| 6    | 4.5, 5.3, 6.1, 6.2                | 4     |
| 7    | 6.3                               | 1     |

### Critical Path

```
1.1 → 1.2 → 1.3/1.4 → 1.5 → 2.5 → 6.1 ─────────────────────┐
         ↓                                                   │
      2.1 → 2.2 → 4.1 ────────────────────────────────────→ 4.5 → 6.3
                  ↓                                          ↑
               3.3 → 6.2 ────────────────────────────────────┤
                                                             │
3.1 → 3.2 → 3.4 → 5.1 → 5.2 → 5.3 ───────────────────────────┘
```

**Critical Path Length**: 7 sequential phases (vs 27 tasks if sequential = 3.9x speedup potential)
