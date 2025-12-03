# Tech Stack

## Overview

**Unified Next.js Full-Stack Architecture** - Optimized for Vercel deployment with a single codebase handling both frontend and backend via Next.js API Routes and Server Actions.

## Frontend

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix primitives)
- **State Management:** React Server Components + React Context (client state)
- **Data Fetching:** Server Actions + React Query (client-side caching)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Testing:** Vitest + React Testing Library + Playwright (E2E)

## Backend (Next.js API Routes)

- **Framework:** Next.js 14 API Routes + Server Actions
- **Language:** TypeScript
- **API Style:** REST via Route Handlers + Server Actions for mutations
- **Validation:** Zod schemas (shared with frontend)
- **Background Jobs:** Vercel Cron Jobs + Inngest (for complex workflows)
- **Edge Functions:** Vercel Edge Runtime for low-latency operations

## Database

- **Primary:** PostgreSQL via Supabase
- **Client:** Supabase JS client (@supabase/supabase-js)
- **Migrations:** Supabase CLI migrations
- **Security:** Row-Level Security (RLS) policies
- **Encryption:** pgcrypto for sensitive fields
- **Types:** Auto-generated TypeScript types from database schema

## Authentication

- **Provider:** Supabase Auth
- **Methods:** Email/password (initially)
- **Session:** JWT with Supabase session management
- **Middleware:** Next.js middleware for route protection
- **Future:** Consider adding OAuth (Google) for convenience

## File Storage

- **Provider:** Supabase Storage
- **Encryption:** Server-side encryption enabled
- **Organization:** User-prefixed paths (`{user_id}/documents/...`)
- **Access:** Signed URLs for secure document access
- **Upload:** Direct browser upload to Supabase with presigned URLs

## External Services

### Financial Data
- **Plaid API:** Bank account connections, transaction sync
  - Link flow for account connection
  - Transactions sync for daily updates
  - Sandbox for development, Production for real accounts
  - Node.js SDK: `plaid-node`

### AI/ML
- **Anthropic Claude API:**
  - Transaction categorization (Claude 3.5 Haiku for cost efficiency)
  - Financial Q&A (Claude 3.5 Sonnet for quality)
  - Document classification
  - Insight generation
  - SDK: `@anthropic-ai/sdk`

### Document Processing
- **OCR Primary:** Vercel AI SDK with Claude Vision (for document text extraction)
- **OCR Fallback:** Tesseract.js (client-side for simple documents)
- **PDF Processing:** pdf-lib, pdf-parse
- **Image Processing:** sharp (Vercel-compatible)

### IRS Data
- **National Standards:** Self-maintained database tables updated annually from IRS.gov
- **Tax Brackets:** Database tables, updated annually
- **Forms:** Reference data only (not official submission)

## Infrastructure

- **Hosting:** Vercel (frontend + API routes + cron jobs)
- **Database Hosting:** Supabase (managed PostgreSQL)
- **File Storage:** Supabase Storage
- **CI/CD:** GitHub Actions + Vercel Git Integration
- **Edge Network:** Vercel Edge Network (global CDN)

## Monitoring & Observability

- **Error Tracking:** Sentry (@sentry/nextjs)
- **Logging:** Vercel Logs + structured logging with pino
- **Analytics:** Vercel Analytics (privacy-focused)
- **Uptime:** Vercel built-in monitoring
- **Performance:** Vercel Speed Insights

## Development Tools

- **Package Manager:** pnpm
- **Linting:** ESLint (Next.js config) + Prettier
- **Type Checking:** TypeScript strict mode
- **Git Hooks:** Husky + lint-staged
- **Environment:** dotenv for local, Vercel env vars for production
- **Database Types:** Supabase CLI type generation

## Security Measures

### Data Security
- All sensitive data encrypted at rest (Supabase encryption)
- Additional field-level encryption for financial data using pgcrypto
- Plaid access tokens encrypted before storage
- No SSN storage (use last-4 only if needed)

### API Security
- JWT authentication via Supabase on all protected routes
- Rate limiting via Vercel Edge middleware + Upstash Redis
- Input validation with Zod on all endpoints
- CORS configured automatically by Vercel
- API key rotation policy for external services

### Client Security
- HTTPS only (enforced by Vercel)
- Secure cookie settings (httpOnly, secure, sameSite)
- CSP headers via next.config.js
- No sensitive data in localStorage

## Key Technical Decisions

### Unified Next.js over Separate Frontend/Backend
**Rationale:**
- Single deployment target (Vercel) simplifies DevOps
- Shared TypeScript types between frontend and backend
- Server Actions provide type-safe mutations without API boilerplate
- Vercel's edge network provides excellent performance
- Reduces operational complexity for a single-user application

### Next.js API Routes over FastAPI
**Rationale:**
- All-TypeScript stack (no context switching)
- Vercel-optimized with automatic scaling
- Server Actions for form mutations are cleaner than REST
- Financial calculations work fine in TypeScript
- Simpler deployment (one platform vs two)

### Claude Vision over Tesseract for OCR
**Rationale:**
- Higher accuracy on varied document formats
- No server-side dependencies to manage
- Works well on Vercel serverless
- Can extract structured data, not just text
- Fallback to Tesseract.js for cost optimization on simple docs

### Supabase over Custom PostgreSQL
**Rationale:** Built-in auth, storage, real-time subscriptions, and RLS policies reduce development time significantly. Easy to migrate to self-hosted PostgreSQL later if needed.

### Vercel Cron + Inngest over Traditional Job Queues
**Rationale:**
- Vercel Cron handles scheduled tasks (daily Plaid sync)
- Inngest provides durable workflows for complex operations (OCR pipeline)
- No Redis/BullMQ infrastructure to manage
- Serverless-native approach

### Self-Hosted IRS Standards in Supabase
**Rationale:** IRS National Standards are public data updated annually. Maintaining in database tables is more reliable than scraping and allows for SQL-based calculations.

## Environment Configuration

### Required Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Plaid
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox  # sandbox, development, production

# Anthropic
ANTHROPIC_API_KEY=

# Encryption
ENCRYPTION_KEY=  # For field-level encryption (32-byte hex)

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Inngest (background jobs)
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Sentry (optional)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

## Directory Structure

```
mycpa/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Auth pages (login, signup)
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── (dashboard)/            # Protected dashboard pages
│   │   ├── dashboard/
│   │   ├── tax-debt/
│   │   ├── cash-flow/
│   │   ├── transactions/
│   │   ├── tax-center/
│   │   ├── documents/
│   │   ├── settings/
│   │   └── layout.tsx
│   ├── api/                    # API Route Handlers
│   │   ├── auth/
│   │   ├── plaid/
│   │   ├── transactions/
│   │   ├── tax-debt/
│   │   ├── cash-flow/
│   │   ├── documents/
│   │   ├── insights/
│   │   └── cron/               # Vercel Cron endpoints
│   ├── layout.tsx
│   └── page.tsx
├── components/                 # React components
│   ├── ui/                     # shadcn/ui components
│   ├── forms/                  # Form components
│   ├── charts/                 # Chart components
│   └── features/               # Feature-specific components
│       ├── tax-debt/
│       ├── cash-flow/
│       ├── transactions/
│       └── documents/
├── lib/                        # Shared utilities
│   ├── supabase/               # Supabase clients (server/client)
│   ├── plaid/                  # Plaid client & utilities
│   ├── claude/                 # Claude API utilities
│   ├── tax/                    # Tax calculation functions
│   ├── irs/                    # IRS standards & calculations
│   ├── encryption/             # Field encryption utilities
│   └── utils/                  # General utilities
├── actions/                    # Server Actions
│   ├── auth.ts
│   ├── transactions.ts
│   ├── tax-debt.ts
│   ├── cash-flow.ts
│   └── documents.ts
├── hooks/                      # Custom React hooks
├── types/                      # TypeScript types
│   ├── database.ts             # Auto-generated from Supabase
│   └── index.ts
├── inngest/                    # Background job definitions
│   ├── client.ts
│   └── functions/
│       ├── sync-transactions.ts
│       ├── process-document.ts
│       └── calculate-projections.ts
├── supabase/                   # Supabase configuration
│   ├── migrations/             # Database migrations
│   ├── seed.sql                # Seed data (IRS standards, categories)
│   └── config.toml
├── public/                     # Static assets
├── tests/                      # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .devfactory/                # DevFactory product docs
│   └── product/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── vercel.json                 # Vercel configuration (cron jobs)
```

## Performance Targets

- **API Response Time:** <200ms (p95) for standard operations
- **Server Action Response:** <100ms for simple mutations
- **Transaction Categorization:** <500ms per transaction (Claude API)
- **Document OCR:** <10s per page (Claude Vision)
- **Page Load (LCP):** <2.5s initial, <500ms navigation
- **Time to Interactive:** <3s
- **Uptime:** 99.5%+

## Vercel Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-transactions",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/update-projections",
      "schedule": "0 7 * * *"
    }
  ]
}
```

## Database Type Generation

```bash
# Generate TypeScript types from Supabase schema
pnpm supabase gen types typescript --project-id $PROJECT_ID > types/database.ts
```

This creates fully-typed database access throughout the application.
