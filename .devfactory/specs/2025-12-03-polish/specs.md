# Technical Specification: Polish

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Stack                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │     Vercel      │  │    Supabase     │  │    Sentry   │  │
│  │   (Hosting)     │  │   (Database)    │  │  (Errors)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │  Vercel Cron    │  │    Inngest      │  │   Vercel    │  │
│  │   (Scheduled)   │  │  (Background)   │  │  Analytics  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure (additions)

```
app/
├── error.tsx                      # Global error boundary
├── not-found.tsx                  # 404 page
├── loading.tsx                    # Global loading state

components/
├── error-boundary.tsx
├── loading-skeleton.tsx
├── empty-state.tsx
└── offline-indicator.tsx

lib/
├── error-handling.ts
├── monitoring.ts
└── performance.ts

middleware.ts                      # Security headers, rate limiting
```

## Error Handling

### Global Error Boundary

```typescript
// app/error.tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        We encountered an unexpected error. Our team has been notified and is working on a fix.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Go Home
        </Button>
      </div>
      {error.digest && (
        <p className="text-xs text-muted-foreground mt-4">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  )
}

// app/not-found.tsx
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-6">Page not found</p>
      <Button asChild>
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  )
}
```

### API Error Handling

```typescript
// lib/error-handling.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 'FORBIDDEN', 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 'RATE_LIMIT', 429)
  }
}

// Standardized error response
export interface ApiErrorResponse {
  error: {
    message: string
    code: string
    details?: Record<string, any>
  }
}

export function handleApiError(error: unknown): ApiErrorResponse {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        details: error instanceof ValidationError ? { errors: error.errors } : undefined
      }
    }
  }

  // Log unexpected errors
  console.error('Unexpected error:', error)
  Sentry.captureException(error)

  return {
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR'
    }
  }
}

// API route wrapper
export function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req)
    } catch (error) {
      const statusCode = error instanceof AppError ? error.statusCode : 500
      return NextResponse.json(handleApiError(error), { status: statusCode })
    }
  }
}
```

### Network Error Handling

```typescript
// lib/api-client.ts

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000
}

export async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        // Don't retry client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          const error = await response.json()
          throw new AppError(error.error.message, error.error.code, response.status)
        }
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      lastError = error as Error

      // Don't retry if it's a client error
      if (error instanceof AppError && error.statusCode < 500) {
        throw error
      }

      // Calculate exponential backoff delay
      if (attempt < retryConfig.maxRetries) {
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(2, attempt),
          retryConfig.maxDelay
        )
        await sleep(delay)
      }
    }
  }

  throw lastError
}

// Offline detection hook
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

## Security

### Middleware

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/tax-debt', '/transactions', '/settings']

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Security headers
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.anthropic.com"
  )

  // Auth check for protected routes
  const isProtected = PROTECTED_PATHS.some(path =>
    req.nextUrl.pathname.startsWith(path)
  )

  if (isProtected) {
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)']
}
```

### Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true
})

export async function checkRateLimit(identifier: string): Promise<boolean> {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier)

  if (!success) {
    throw new RateLimitError(
      `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`
    )
  }

  return true
}

// Stricter limits for sensitive endpoints
const authRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 attempts per minute
})

export async function checkAuthRateLimit(identifier: string): Promise<boolean> {
  const { success } = await authRatelimit.limit(`auth:${identifier}`)
  if (!success) {
    throw new RateLimitError('Too many authentication attempts. Please wait.')
  }
  return true
}
```

### Input Validation

```typescript
// lib/validation.ts
import { z } from 'zod'

// Common validation schemas
export const uuidSchema = z.string().uuid()
export const emailSchema = z.string().email()
export const dateSchema = z.coerce.date()
export const moneySchema = z.number().min(0).max(999999999.99)

// Sanitization
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .slice(0, 10000) // Limit length
}

// Validate request body
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body)

  if (!result.success) {
    const errors: Record<string, string[]> = {}
    result.error.errors.forEach(err => {
      const path = err.path.join('.')
      if (!errors[path]) errors[path] = []
      errors[path].push(err.message)
    })
    throw new ValidationError('Invalid request body', errors)
  }

  return result.data
}
```

### RLS Policy Verification

```sql
-- Verify all tables have RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Verify user_profile RLS
CREATE POLICY "Users can only view their own profile"
  ON user_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only update their own profile"
  ON user_profile FOR UPDATE
  USING (auth.uid() = user_id);

-- Verify tax_debt RLS
CREATE POLICY "Users can only view their own tax debts"
  ON tax_debt FOR SELECT
  USING (auth.uid() = user_id);

-- Verify transactions RLS
CREATE POLICY "Users can only view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Verify documents RLS
CREATE POLICY "Users can only access their own documents"
  ON tax_documents FOR ALL
  USING (auth.uid() = user_id);
```

## Performance

### Bundle Analysis

```typescript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // ... other config
})

// Run: ANALYZE=true npm run build
```

### Code Splitting

```typescript
// Dynamic imports for heavy components
const TransactionList = dynamic(
  () => import('@/components/features/transactions/transaction-list'),
  {
    loading: () => <TransactionListSkeleton />,
    ssr: false
  }
)

const CashFlowCalendar = dynamic(
  () => import('@/components/features/cash-flow/cash-flow-calendar'),
  {
    loading: () => <CalendarSkeleton />
  }
)

const ChatInterface = dynamic(
  () => import('@/components/features/insights/chat-interface'),
  {
    loading: () => <ChatSkeleton />,
    ssr: false
  }
)
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category);
CREATE INDEX idx_tax_debt_user ON tax_debt(user_id);
CREATE INDEX idx_recurring_user_active ON recurring_transactions(user_id, is_active);
CREATE INDEX idx_documents_user_year ON tax_documents(user_id, tax_year);

-- Full-text search index
CREATE INDEX idx_transactions_search ON transactions
  USING GIN (to_tsvector('english', merchant_name || ' ' || COALESCE(notes, '')));

CREATE INDEX idx_documents_search ON tax_documents
  USING GIN (to_tsvector('english', COALESCE(extracted_text, '')));
```

### React Query Configuration

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Prefetch on hover for faster navigation
export function usePrefetchOnHover(queryKey: string[], queryFn: () => Promise<any>) {
  return {
    onMouseEnter: () => {
      queryClient.prefetchQuery({ queryKey, queryFn })
    }
  }
}
```

## Monitoring

### Sentry Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,

  // Filter out non-actionable errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Network request failed',
    'Load failed',
  ],

  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') {
      return null
    }

    // Remove sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies
    }

    return event
  },
})

// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
})
```

### Performance Monitoring

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

export function trackPerformance(name: string, duration: number) {
  const transaction = Sentry.startTransaction({
    name,
    op: 'performance',
  })

  transaction.setMeasurement('duration', duration, 'millisecond')
  transaction.finish()
}

// Component-level performance tracking
export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      if (duration > 1000) { // Only track slow renders
        trackPerformance(`${componentName}_render`, duration)
      }
    }
  }, [componentName])
}

// API timing middleware
export function withTiming<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: Parameters<T>) => {
    const start = performance.now()
    try {
      return await fn(...args)
    } finally {
      trackPerformance(name, performance.now() - start)
    }
  }) as T
}
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm audit --audit-level=high
```

### Vercel Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-transactions",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/generate-summaries",
      "schedule": "0 6 1 * *"
    },
    {
      "path": "/api/cron/generate-alerts",
      "schedule": "0 8 * * *"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-DNS-Prefetch-Control", "value": "on" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains" }
      ]
    }
  ]
}
```

## Pre-Launch Checklist

```typescript
// scripts/pre-launch-check.ts

const checks = [
  // Security
  { name: 'RLS policies enabled', check: verifyRLSPolicies },
  { name: 'No secrets in code', check: scanForSecrets },
  { name: 'Security headers set', check: verifySecurityHeaders },
  { name: 'Dependencies audit clean', check: runDependencyAudit },

  // Performance
  { name: 'Bundle size < 300KB', check: checkBundleSize },
  { name: 'LCP < 2.5s', check: measureLCP },
  { name: 'Database indexes exist', check: verifyIndexes },

  // Functionality
  { name: 'Auth flow works', check: testAuthFlow },
  { name: 'CRUD operations work', check: testCRUD },
  { name: 'Plaid integration works', check: testPlaidSandbox },

  // Monitoring
  { name: 'Sentry configured', check: verifySentry },
  { name: 'Analytics enabled', check: verifyAnalytics },
  { name: 'Cron jobs scheduled', check: verifyCronJobs },
]

async function runPreLaunchChecks() {
  console.log('Running pre-launch checks...\n')

  for (const { name, check } of checks) {
    try {
      await check()
      console.log(`✅ ${name}`)
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`)
    }
  }
}
```

## Key Components Summary

| Component | Purpose |
|-----------|---------|
| `error.tsx` | Global error boundary |
| `error-handling.ts` | Standardized error classes |
| `middleware.ts` | Security headers, auth |
| `rate-limit.ts` | API rate limiting |
| `validation.ts` | Input validation |
| `monitoring.ts` | Performance tracking |
| `ci.yml` | GitHub Actions pipeline |
| `vercel.json` | Cron jobs, headers |
