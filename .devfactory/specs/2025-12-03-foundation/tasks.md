# Implementation Tasks: Foundation

## Task Groups Overview

| Group | Name                   | Tasks | Dependencies |
| ----- | ---------------------- | ----- | ------------ |
| 1     | Project Setup          | 7     | None         |
| 2     | Database Schema        | 8     | Group 1      |
| 3     | Supabase Client        | 4     | Group 1      |
| 4     | Authentication         | 8     | Group 2, 3   |
| 5     | Base UI Components     | 6     | Group 1      |
| 6     | Dashboard Layout       | 6     | Group 4, 5   |
| 7     | Testing & Verification | 4     | Group 6      |

---

## Task Group 1: Project Setup

**Assigned Agent:** `frontend-engineer`
**Dependencies:** None

### Tasks

- [ ] **1.1** Initialize Next.js 14 project with App Router

  ```bash
  pnpm create next-app@latest mycpa --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
  ```

  - **depends_on**: []

- [ ] **1.2** Configure TypeScript strict mode
  - Update `tsconfig.json` with strict settings
  - Enable `noUncheckedIndexedAccess`
  - **depends_on**: ["1.1"]

- [ ] **1.3** Install core dependencies

  ```bash
  pnpm add @supabase/supabase-js @supabase/ssr
  pnpm add react-hook-form @hookform/resolvers zod
  pnpm add @tanstack/react-query
  pnpm add lucide-react
  pnpm add -D @types/node
  ```

  - **depends_on**: ["1.1"]
  - **parallel_with**: ["1.2"]

- [ ] **1.4** Install and configure shadcn/ui

  ```bash
  pnpm dlx shadcn-ui@latest init
  # Select: Dark theme, CSS variables, src/components/ui
  pnpm dlx shadcn-ui@latest add button input card form label toast sonner
  ```

  - **depends_on**: ["1.3"]

- [ ] **1.5** Configure ESLint and Prettier
  - Install Prettier: `pnpm add -D prettier eslint-config-prettier`
  - Create `.prettierrc` with project settings
  - Update `.eslintrc.json`
  - **depends_on**: ["1.1"]
  - **parallel_with**: ["1.2", "1.3"]

- [ ] **1.6** Set up Husky and lint-staged

  ```bash
  pnpm add -D husky lint-staged
  pnpm exec husky init
  ```

  - **depends_on**: ["1.5"]

- [ ] **1.7** Create environment configuration
  - Create `.env.example` with all required variables
  - Create `.env.local` (gitignored)
  - Document environment setup in README
  - **depends_on**: ["1.1"]
  - **parallel_with**: ["1.2", "1.3", "1.5"]

---

## Task Group 2: Database Schema

**Assigned Agent:** `database-engineer`
**Dependencies:** Group 1

### Tasks

- [ ] **2.1** Create Supabase migration for user-related tables
  - `user_profile`
  - Enable RLS with policies
  - Create `supabase/migrations/00001_user_tables.sql`
  - **depends_on**: ["1.7"]

- [ ] **2.2** Create migration for tax debt tables
  - `tax_debt`
  - `tax_debt_payments`
  - `irs_correspondence`
  - RLS policies for all
  - **depends_on**: ["2.1"]
  - **parallel_with**: ["2.3", "2.4", "2.5", "2.6"]

- [ ] **2.3** Create migration for financial snapshot tables
  - `financial_snapshot`
  - `irs_allowable_expenses`
  - `relief_applications`
  - RLS policies
  - **depends_on**: ["2.1"]
  - **parallel_with**: ["2.2", "2.4", "2.5", "2.6"]

- [ ] **2.4** Create migration for Plaid/banking tables
  - `plaid_items` (with encrypted access_token note)
  - `accounts`
  - `transactions`
  - `recurring_transactions`
  - `categories`
  - RLS policies
  - **depends_on**: ["2.1"]
  - **parallel_with**: ["2.2", "2.3", "2.5", "2.6"]

- [ ] **2.5** Create migration for tax planning tables
  - `tax_documents`
  - `tax_projections`
  - RLS policies
  - **depends_on**: ["2.1"]
  - **parallel_with**: ["2.2", "2.3", "2.4", "2.6"]

- [ ] **2.6** Create migration for reference data tables
  - `irs_national_standards`
  - `tax_brackets`
  - Public read policies for authenticated users
  - **depends_on**: ["2.1"]
  - **parallel_with**: ["2.2", "2.3", "2.4", "2.5"]

- [ ] **2.7** Create indexes for performance
  - Add indexes as specified in specs.md
  - Verify with EXPLAIN on common queries
  - **depends_on**: ["2.2", "2.3", "2.4", "2.5", "2.6"]

- [ ] **2.8** Generate TypeScript types from schema
  ```bash
  pnpm supabase gen types typescript --project-id $PROJECT_ID > types/database.ts
  ```

  - **depends_on**: ["2.7"]

---

## Task Group 3: Supabase Client Setup

**Assigned Agent:** `frontend-engineer`
**Dependencies:** Group 1

### Tasks

- [ ] **3.1** Create Supabase browser client
  - `lib/supabase/client.ts`
  - Use `createBrowserClient` from `@supabase/ssr`
  - **depends_on**: ["1.3", "1.7"]

- [ ] **3.2** Create Supabase server client
  - `lib/supabase/server.ts`
  - Use `createServerClient` with cookies
  - Handle both Server Components and Route Handlers
  - **depends_on**: ["1.3", "1.7"]
  - **parallel_with**: ["3.1"]

- [ ] **3.3** Create Supabase middleware helper
  - `lib/supabase/middleware.ts`
  - Refresh session on request
  - **depends_on**: ["3.2"]

- [ ] **3.4** Create utility functions
  - `lib/utils.ts` with `cn()` for classnames
  - Type exports from `types/index.ts`
  - **depends_on**: ["1.3"]
  - **parallel_with**: ["3.1", "3.2"]

---

## Task Group 4: Authentication

**Assigned Agent:** `frontend-engineer`
**Dependencies:** Group 2, 3

### Tasks

- [ ] **4.1** Create auth server actions
  - `actions/auth.ts`
  - `signUp()` - create account
  - `signIn()` - login
  - `signOut()` - logout
  - Include Zod validation
  - **depends_on**: ["2.8", "3.2"]

- [ ] **4.2** Create auth middleware
  - `middleware.ts` at project root
  - Protect `/dashboard/*` routes
  - Redirect unauthenticated to `/login`
  - Redirect authenticated from `/login` to `/dashboard`
  - **depends_on**: ["3.3"]

- [ ] **4.3** Create signup page
  - `app/(auth)/signup/page.tsx`
  - Form with email, password, confirm password
  - Validation feedback
  - Link to login
  - **depends_on**: ["4.1", "4.5"]

- [ ] **4.4** Create login page
  - `app/(auth)/login/page.tsx`
  - Form with email, password
  - Error display
  - Link to signup
  - **depends_on**: ["4.1", "4.5"]
  - **parallel_with**: ["4.3"]

- [ ] **4.5** Create auth layout
  - `app/(auth)/layout.tsx`
  - Centered card layout
  - Dark theme styling
  - **depends_on**: ["1.4"]

- [ ] **4.6** Create auth callback route
  - `app/api/auth/callback/route.ts`
  - Exchange code for session
  - Redirect to dashboard
  - **depends_on**: ["3.2"]
  - **parallel_with**: ["4.1", "4.2"]

- [ ] **4.7** Create auth provider/context
  - `components/providers/auth-provider.tsx`
  - Provide user state to client components
  - `hooks/use-auth.ts` for consuming auth state
  - **depends_on**: ["3.1"]
  - **parallel_with**: ["4.1", "4.2", "4.6"]

- [ ] **4.8** Create user profile initialization
  - After signup, create `user_profile` record
  - Handle in auth callback or separate action
  - **depends_on**: ["4.1", "4.6"]

---

## Task Group 5: Base UI Components

**Assigned Agent:** `ui-designer`
**Dependencies:** Group 1

### Tasks

- [ ] **5.1** Configure theme provider
  - `components/providers/theme-provider.tsx`
  - Use `next-themes` for dark mode
  - Default to dark theme
  - **depends_on**: ["1.4"]

- [ ] **5.2** Create sidebar component
  - `components/layout/sidebar.tsx`
  - Navigation items with icons
  - Active state based on current route
  - Collapsible on mobile
  - **depends_on**: ["1.4"]
  - **parallel_with**: ["5.1", "5.3", "5.4"]

- [ ] **5.3** Create header component
  - `components/layout/header.tsx`
  - User menu dropdown
  - Logout option
  - **depends_on**: ["1.4"]
  - **parallel_with**: ["5.1", "5.2", "5.4"]

- [ ] **5.4** Create nav-item component
  - `components/layout/nav-item.tsx`
  - Icon + label
  - Active state styling
  - Link behavior
  - **depends_on**: ["1.4"]
  - **parallel_with**: ["5.1", "5.2", "5.3"]

- [ ] **5.5** Create loading skeleton components
  - `components/ui/skeleton.tsx` (if not from shadcn)
  - Page-level loading skeleton
  - Card loading skeleton
  - **depends_on**: ["1.4"]
  - **parallel_with**: ["5.1", "5.2", "5.3", "5.4"]

- [ ] **5.6** Create toast/notification setup
  - Configure Sonner or shadcn toast
  - Create `components/providers/toast-provider.tsx`
  - **depends_on**: ["1.4"]
  - **parallel_with**: ["5.1", "5.2", "5.3", "5.4", "5.5"]

---

## Task Group 6: Dashboard Layout

**Assigned Agent:** `ui-designer`
**Dependencies:** Group 4, 5

### Tasks

- [ ] **6.1** Create root layout
  - `app/layout.tsx`
  - HTML with dark class
  - Font configuration
  - Providers wrapper
  - **depends_on**: ["5.1", "5.6"]

- [ ] **6.2** Create dashboard layout
  - `app/(dashboard)/layout.tsx`
  - Sidebar + main content area
  - Responsive design
  - Auth check (server component)
  - **depends_on**: ["4.2", "5.2", "5.3", "6.1"]

- [ ] **6.3** Create dashboard home page
  - `app/(dashboard)/dashboard/page.tsx`
  - Welcome message
  - Placeholder widgets
  - "Coming soon" for features
  - **depends_on**: ["6.2"]

- [ ] **6.4** Create placeholder pages for all sections
  - `app/(dashboard)/tax-debt/page.tsx`
  - `app/(dashboard)/cash-flow/page.tsx`
  - `app/(dashboard)/transactions/page.tsx`
  - `app/(dashboard)/tax-center/page.tsx`
  - `app/(dashboard)/documents/page.tsx`
  - `app/(dashboard)/settings/page.tsx`
  - **depends_on**: ["6.2"]
  - **parallel_with**: ["6.3"]

- [ ] **6.5** Create loading and error states
  - `app/(dashboard)/loading.tsx`
  - `app/(dashboard)/error.tsx`
  - Global `app/loading.tsx` and `app/error.tsx`
  - **depends_on**: ["5.5", "6.1"]
  - **parallel_with**: ["6.2", "6.3", "6.4"]

- [ ] **6.6** Create landing page redirect
  - `app/page.tsx`
  - Redirect to `/dashboard` if authenticated
  - Redirect to `/login` if not
  - **depends_on**: ["4.2"]
  - **parallel_with**: ["6.2", "6.3", "6.4", "6.5"]

---

## Task Group 7: Testing & Verification

**Assigned Agent:** `testing-engineer`
**Dependencies:** Group 6

### Tasks

- [ ] **7.1** Set up testing infrastructure

  ```bash
  pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react
  ```

  - Create `vitest.config.ts`
  - Add test scripts to `package.json`
  - **depends_on**: ["1.3"]

- [ ] **7.2** Write auth flow tests
  - Test signup form validation
  - Test login form validation
  - Test auth redirects
  - **depends_on**: ["7.1", "4.3", "4.4"]

- [ ] **7.3** Write component tests
  - Sidebar navigation renders all items
  - Header shows user menu
  - Theme toggle works
  - **depends_on**: ["7.1", "5.2", "5.3"]
  - **parallel_with**: ["7.2"]

- [ ] **7.4** Manual verification checklist
  - [ ] Can create account
  - [ ] Can log in
  - [ ] Can log out
  - [ ] Protected routes redirect when logged out
  - [ ] All navigation links work
  - [ ] Dark theme displays correctly
  - [ ] Mobile responsive works
  - [ ] No console errors
  - [ ] RLS prevents cross-user access (test with 2 accounts)
  - **depends_on**: ["7.2", "7.3", "6.3", "6.4"]

---

## Completion Checklist

- [ ] All task groups completed
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Environment variables documented
- [ ] README updated with setup instructions
- [ ] Database migrations tested
- [ ] RLS policies verified
- [ ] Deployed to Vercel (optional for foundation)

---

## Parallel Execution Summary

### Dependency Graph

```
PHASE 1 (No dependencies):
└── 1.1 Initialize Next.js project

PHASE 2 (After 1.1):
├── 1.2 TypeScript strict mode
├── 1.3 Install core dependencies
├── 1.5 ESLint and Prettier
└── 1.7 Environment configuration

PHASE 3 (After Phase 2):
├── 1.4 Install shadcn/ui              ← depends_on: [1.3]
├── 1.6 Husky and lint-staged          ← depends_on: [1.5]
├── 2.1 User tables migration          ← depends_on: [1.7]
├── 3.1 Supabase browser client        ← depends_on: [1.3, 1.7]
├── 3.2 Supabase server client         ← depends_on: [1.3, 1.7]
├── 3.4 Utility functions              ← depends_on: [1.3]
└── 7.1 Testing infrastructure         ← depends_on: [1.3]

PHASE 4 (After Phase 3):
├── 2.2-2.6 All domain migrations      ← depends_on: [2.1] (parallel)
├── 3.3 Supabase middleware            ← depends_on: [3.2]
├── 4.5 Auth layout                    ← depends_on: [1.4]
├── 4.6 Auth callback route            ← depends_on: [3.2]
├── 4.7 Auth provider                  ← depends_on: [3.1]
├── 5.1-5.6 All UI components          ← depends_on: [1.4] (parallel)

PHASE 5 (After Phase 4):
├── 2.7 Create indexes                 ← depends_on: [2.2-2.6]
├── 4.2 Auth middleware                ← depends_on: [3.3]

PHASE 6 (After Phase 5):
├── 2.8 Generate TypeScript types      ← depends_on: [2.7]
├── 6.1 Root layout                    ← depends_on: [5.1, 5.6]
├── 6.5 Loading/error states           ← depends_on: [5.5, 6.1]
├── 6.6 Landing page redirect          ← depends_on: [4.2]

PHASE 7 (After Phase 6):
├── 4.1 Auth server actions            ← depends_on: [2.8, 3.2]
├── 6.2 Dashboard layout               ← depends_on: [4.2, 5.2, 5.3, 6.1]

PHASE 8 (After Phase 7):
├── 4.3 Signup page                    ← depends_on: [4.1, 4.5]
├── 4.4 Login page                     ← depends_on: [4.1, 4.5]
├── 4.8 Profile initialization         ← depends_on: [4.1, 4.6]
├── 6.3 Dashboard home page            ← depends_on: [6.2]
├── 6.4 Placeholder pages              ← depends_on: [6.2]

PHASE 9 (After Phase 8):
├── 7.2 Auth flow tests                ← depends_on: [7.1, 4.3, 4.4]
├── 7.3 Component tests                ← depends_on: [7.1, 5.2, 5.3]

PHASE 10 (Final):
└── 7.4 Manual verification            ← depends_on: [7.2, 7.3, 6.3, 6.4]
```

### Parallel Execution Waves

| Wave | Tasks (can run simultaneously)       | Count |
| ---- | ------------------------------------ | ----- |
| 1    | 1.1                                  | 1     |
| 2    | 1.2, 1.3, 1.5, 1.7                   | 4     |
| 3    | 1.4, 1.6, 2.1, 3.1, 3.2, 3.4, 7.1    | 7     |
| 4    | 2.2-2.6, 3.3, 4.5, 4.6, 4.7, 5.1-5.6 | 16    |
| 5    | 2.7, 4.2                             | 2     |
| 6    | 2.8, 6.1, 6.5, 6.6                   | 4     |
| 7    | 4.1, 6.2                             | 2     |
| 8    | 4.3, 4.4, 4.8, 6.3, 6.4              | 5     |
| 9    | 7.2, 7.3                             | 2     |
| 10   | 7.4                                  | 1     |

### Critical Path

```
1.1 → 1.3 → 1.4 → 5.1 → 6.1 → 6.2 → 6.3 → 7.4
         ↓
      1.7 → 2.1 → 2.2-2.6 → 2.7 → 2.8 → 4.1 → 4.3/4.4 → 7.2 → 7.4
         ↓
      3.2 → 3.3 → 4.2 → 6.2
```

**Critical Path Length**: 10 sequential phases (vs 43 tasks if sequential = 4.3x speedup potential)
