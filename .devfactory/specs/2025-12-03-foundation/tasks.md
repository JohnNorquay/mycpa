# Implementation Tasks: Foundation

## Task Groups Overview

| Group | Name | Tasks | Dependencies |
|-------|------|-------|--------------|
| 1 | Project Setup | 7 | None |
| 2 | Database Schema | 8 | Group 1 |
| 3 | Supabase Client | 4 | Group 1 |
| 4 | Authentication | 8 | Group 2, 3 |
| 5 | Base UI Components | 6 | Group 1 |
| 6 | Dashboard Layout | 6 | Group 4, 5 |
| 7 | Testing & Verification | 4 | Group 6 |

---

## Task Group 1: Project Setup

**Assigned Agent:** `frontend-engineer`
**Dependencies:** None

### Tasks

- [ ] **1.1** Initialize Next.js 14 project with App Router
  ```bash
  pnpm create next-app@latest mycpa --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
  ```

- [ ] **1.2** Configure TypeScript strict mode
  - Update `tsconfig.json` with strict settings
  - Enable `noUncheckedIndexedAccess`

- [ ] **1.3** Install core dependencies
  ```bash
  pnpm add @supabase/supabase-js @supabase/ssr
  pnpm add react-hook-form @hookform/resolvers zod
  pnpm add @tanstack/react-query
  pnpm add lucide-react
  pnpm add -D @types/node
  ```

- [ ] **1.4** Install and configure shadcn/ui
  ```bash
  pnpm dlx shadcn-ui@latest init
  # Select: Dark theme, CSS variables, src/components/ui
  pnpm dlx shadcn-ui@latest add button input card form label toast sonner
  ```

- [ ] **1.5** Configure ESLint and Prettier
  - Install Prettier: `pnpm add -D prettier eslint-config-prettier`
  - Create `.prettierrc` with project settings
  - Update `.eslintrc.json`

- [ ] **1.6** Set up Husky and lint-staged
  ```bash
  pnpm add -D husky lint-staged
  pnpm exec husky init
  ```

- [ ] **1.7** Create environment configuration
  - Create `.env.example` with all required variables
  - Create `.env.local` (gitignored)
  - Document environment setup in README

---

## Task Group 2: Database Schema

**Assigned Agent:** `database-engineer`
**Dependencies:** Group 1

### Tasks

- [ ] **2.1** Create Supabase migration for user-related tables
  - `user_profile`
  - Enable RLS with policies
  - Create `supabase/migrations/00001_user_tables.sql`

- [ ] **2.2** Create migration for tax debt tables
  - `tax_debt`
  - `tax_debt_payments`
  - `irs_correspondence`
  - RLS policies for all

- [ ] **2.3** Create migration for financial snapshot tables
  - `financial_snapshot`
  - `irs_allowable_expenses`
  - `relief_applications`
  - RLS policies

- [ ] **2.4** Create migration for Plaid/banking tables
  - `plaid_items` (with encrypted access_token note)
  - `accounts`
  - `transactions`
  - `recurring_transactions`
  - `categories`
  - RLS policies

- [ ] **2.5** Create migration for tax planning tables
  - `tax_documents`
  - `tax_projections`
  - RLS policies

- [ ] **2.6** Create migration for reference data tables
  - `irs_national_standards`
  - `tax_brackets`
  - Public read policies for authenticated users

- [ ] **2.7** Create indexes for performance
  - Add indexes as specified in specs.md
  - Verify with EXPLAIN on common queries

- [ ] **2.8** Generate TypeScript types from schema
  ```bash
  pnpm supabase gen types typescript --project-id $PROJECT_ID > types/database.ts
  ```

---

## Task Group 3: Supabase Client Setup

**Assigned Agent:** `frontend-engineer`
**Dependencies:** Group 1

### Tasks

- [ ] **3.1** Create Supabase browser client
  - `lib/supabase/client.ts`
  - Use `createBrowserClient` from `@supabase/ssr`

- [ ] **3.2** Create Supabase server client
  - `lib/supabase/server.ts`
  - Use `createServerClient` with cookies
  - Handle both Server Components and Route Handlers

- [ ] **3.3** Create Supabase middleware helper
  - `lib/supabase/middleware.ts`
  - Refresh session on request

- [ ] **3.4** Create utility functions
  - `lib/utils.ts` with `cn()` for classnames
  - Type exports from `types/index.ts`

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

- [ ] **4.2** Create auth middleware
  - `middleware.ts` at project root
  - Protect `/dashboard/*` routes
  - Redirect unauthenticated to `/login`
  - Redirect authenticated from `/login` to `/dashboard`

- [ ] **4.3** Create signup page
  - `app/(auth)/signup/page.tsx`
  - Form with email, password, confirm password
  - Validation feedback
  - Link to login

- [ ] **4.4** Create login page
  - `app/(auth)/login/page.tsx`
  - Form with email, password
  - Error display
  - Link to signup

- [ ] **4.5** Create auth layout
  - `app/(auth)/layout.tsx`
  - Centered card layout
  - Dark theme styling

- [ ] **4.6** Create auth callback route
  - `app/api/auth/callback/route.ts`
  - Exchange code for session
  - Redirect to dashboard

- [ ] **4.7** Create auth provider/context
  - `components/providers/auth-provider.tsx`
  - Provide user state to client components
  - `hooks/use-auth.ts` for consuming auth state

- [ ] **4.8** Create user profile initialization
  - After signup, create `user_profile` record
  - Handle in auth callback or separate action

---

## Task Group 5: Base UI Components

**Assigned Agent:** `ui-designer`
**Dependencies:** Group 1

### Tasks

- [ ] **5.1** Configure theme provider
  - `components/providers/theme-provider.tsx`
  - Use `next-themes` for dark mode
  - Default to dark theme

- [ ] **5.2** Create sidebar component
  - `components/layout/sidebar.tsx`
  - Navigation items with icons
  - Active state based on current route
  - Collapsible on mobile

- [ ] **5.3** Create header component
  - `components/layout/header.tsx`
  - User menu dropdown
  - Logout option

- [ ] **5.4** Create nav-item component
  - `components/layout/nav-item.tsx`
  - Icon + label
  - Active state styling
  - Link behavior

- [ ] **5.5** Create loading skeleton components
  - `components/ui/skeleton.tsx` (if not from shadcn)
  - Page-level loading skeleton
  - Card loading skeleton

- [ ] **5.6** Create toast/notification setup
  - Configure Sonner or shadcn toast
  - Create `components/providers/toast-provider.tsx`

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

- [ ] **6.2** Create dashboard layout
  - `app/(dashboard)/layout.tsx`
  - Sidebar + main content area
  - Responsive design
  - Auth check (server component)

- [ ] **6.3** Create dashboard home page
  - `app/(dashboard)/dashboard/page.tsx`
  - Welcome message
  - Placeholder widgets
  - "Coming soon" for features

- [ ] **6.4** Create placeholder pages for all sections
  - `app/(dashboard)/tax-debt/page.tsx`
  - `app/(dashboard)/cash-flow/page.tsx`
  - `app/(dashboard)/transactions/page.tsx`
  - `app/(dashboard)/tax-center/page.tsx`
  - `app/(dashboard)/documents/page.tsx`
  - `app/(dashboard)/settings/page.tsx`

- [ ] **6.5** Create loading and error states
  - `app/(dashboard)/loading.tsx`
  - `app/(dashboard)/error.tsx`
  - Global `app/loading.tsx` and `app/error.tsx`

- [ ] **6.6** Create landing page redirect
  - `app/page.tsx`
  - Redirect to `/dashboard` if authenticated
  - Redirect to `/login` if not

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

- [ ] **7.2** Write auth flow tests
  - Test signup form validation
  - Test login form validation
  - Test auth redirects

- [ ] **7.3** Write component tests
  - Sidebar navigation renders all items
  - Header shows user menu
  - Theme toggle works

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
