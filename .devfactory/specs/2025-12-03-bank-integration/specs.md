# Technical Specification: Bank Integration

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Plaid Link    │────▶│  Access Token   │────▶│   Transactions  │
│   (Frontend)    │     │   (Encrypted)   │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   Claude API    │◀────│   Categorize    │
                        │   (Haiku)       │     │   (Background)  │
                        └─────────────────┘     └─────────────────┘
```

## Directory Structure

```
app/
├── (dashboard)/
│   ├── transactions/
│   │   ├── page.tsx              # Transaction list
│   │   └── [id]/page.tsx         # Transaction detail
│   └── settings/
│       └── accounts/
│           └── page.tsx          # Connected accounts
├── api/
│   ├── plaid/
│   │   ├── create-link-token/route.ts
│   │   ├── exchange-token/route.ts
│   │   └── sync/route.ts
│   └── cron/
│       └── sync-transactions/route.ts

components/features/transactions/
├── plaid-link-button.tsx
├── account-list.tsx
├── transaction-list.tsx
├── transaction-filters.tsx
├── transaction-detail.tsx
├── category-select.tsx
├── split-transaction-modal.tsx
└── category-manager.tsx

lib/
├── plaid/
│   ├── client.ts
│   └── sync.ts
└── claude/
    └── categorize.ts

inngest/
└── functions/
    └── categorize-transactions.ts
```

## Plaid Integration

```typescript
// lib/plaid/client.ts
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV!],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

export const plaidClient = new PlaidApi(config)
```

## Claude Categorization

```typescript
// lib/claude/categorize.ts
export async function categorizeTransaction(tx: Transaction): Promise<CategoryResult> {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Categorize this transaction:
Merchant: ${tx.merchant_name}
Amount: $${tx.amount}
Date: ${tx.date}

Respond with JSON: {"category": "...", "is_tax_deductible": boolean, "confidence": 0.0-1.0}`
    }]
  })
  return JSON.parse(response.content[0].text)
}
```

## Cron Job

```typescript
// app/api/cron/sync-transactions/route.ts
// Runs daily at 6 AM via Vercel Cron
export async function GET() {
  const users = await getUsersWithPlaidAccounts()

  for (const user of users) {
    await syncUserTransactions(user.id)
    await inngest.send({ name: 'transactions/categorize', data: { userId: user.id } })
  }

  return Response.json({ synced: users.length })
}
```

## Key Components

### Transaction List
- Infinite scroll pagination
- Client-side filtering (date, category, account)
- Quick category edit
- Bulk actions

### Split Transaction
- Modal with line items
- Each item: amount + category
- Must sum to original amount
