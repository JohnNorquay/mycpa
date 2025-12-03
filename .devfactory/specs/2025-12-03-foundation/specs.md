# Technical Specification: Foundation

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Next.js 14                         │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │    │
│  │  │  App Router  │  │  API Routes  │  │ Middleware│  │    │
│  │  │  (Pages)     │  │  (Auth)      │  │ (Protect) │  │    │
│  │  └──────────────┘  └──────────────┘  └───────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Supabase                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │     Auth     │  │  PostgreSQL  │  │   Storage    │       │
│  │  (Sessions)  │  │   (+ RLS)    │  │  (Future)    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
mycpa/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── tax-debt/
│   │   │   └── page.tsx
│   │   ├── cash-flow/
│   │   │   └── page.tsx
│   │   ├── transactions/
│   │   │   └── page.tsx
│   │   ├── tax-center/
│   │   │   └── page.tsx
│   │   ├── documents/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   └── globals.css
├── components/
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── toast.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── nav-item.tsx
│   │   └── user-menu.tsx
│   └── providers/
│       ├── theme-provider.tsx
│       └── auth-provider.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   └── middleware.ts      # Auth middleware helper
│   └── utils.ts               # cn() and utilities
├── actions/
│   └── auth.ts                # Server actions for auth
├── hooks/
│   └── use-auth.ts
├── types/
│   ├── database.ts            # Generated from Supabase
│   └── index.ts
├── supabase/
│   ├── migrations/
│   │   └── 00001_initial_schema.sql
│   ├── seed.sql
│   └── config.toml
├── middleware.ts              # Next.js middleware
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── .env.local
```

## Database Schema

### Core Tables

```sql
-- User Profile (extends Supabase auth.users)
CREATE TABLE user_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  filing_status TEXT CHECK (filing_status IN ('single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household', 'qualifying_widow')),
  dependents INTEGER DEFAULT 0,
  state TEXT,
  county TEXT,
  employment_status TEXT CHECK (employment_status IN ('employed', 'self_employed', 'unemployed', 'retired', 'disabled')),
  has_health_conditions BOOLEAN DEFAULT FALSE,
  health_conditions_notes TEXT, -- Encrypted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Debt
CREATE TABLE tax_debt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tax_year INTEGER NOT NULL,
  debt_type TEXT CHECK (debt_type IN ('income_tax', 'penalty_failure_to_file', 'penalty_failure_to_pay', 'interest', 'other')),
  original_amount DECIMAL(12,2) NOT NULL,
  current_balance DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(5,4) DEFAULT 0.08,
  penalty_rate DECIMAL(5,4),
  source TEXT CHECK (source IN ('w2_shortage', '1099_unreported', 'business', 'estimated_tax', 'other')),
  collection_status TEXT CHECK (collection_status IN ('normal', 'notice_sent', 'lien_filed', 'levy_pending', 'levy_active', 'garnishment', 'currently_not_collectible')) DEFAULT 'normal',
  statute_expiration_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Debt Payments
CREATE TABLE tax_debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_debt_id UUID REFERENCES tax_debt(id) ON DELETE CASCADE NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT,
  applied_to TEXT CHECK (applied_to IN ('principal', 'interest', 'penalty', 'mixed')),
  confirmation_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IRS Correspondence
CREATE TABLE irs_correspondence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tax_debt_id UUID REFERENCES tax_debt(id) ON DELETE SET NULL,
  notice_date DATE NOT NULL,
  notice_type TEXT NOT NULL,
  notice_number TEXT,
  response_deadline DATE,
  status TEXT CHECK (status IN ('received', 'in_review', 'response_sent', 'resolved', 'escalated')) DEFAULT 'received',
  document_id UUID, -- References tax_documents when that table exists
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Snapshot
CREATE TABLE financial_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  relief_application_id UUID, -- References relief_applications
  snapshot_date DATE DEFAULT CURRENT_DATE,
  monthly_gross_income DECIMAL(12,2),
  monthly_net_income DECIMAL(12,2),
  monthly_allowable_expenses DECIMAL(12,2),
  monthly_disposable_income DECIMAL(12,2),
  total_asset_equity DECIMAL(12,2),
  home_equity DECIMAL(12,2),
  vehicle_equity DECIMAL(12,2),
  bank_balance DECIMAL(12,2),
  investment_value DECIMAL(12,2),
  reasonable_collection_potential DECIMAL(12,2),
  future_income_months INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IRS Allowable Expenses
CREATE TABLE irs_allowable_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  financial_snapshot_id UUID REFERENCES financial_snapshot(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  irs_allowable_amount DECIMAL(12,2),
  actual_amount DECIMAL(12,2),
  variance DECIMAL(12,2),
  justification TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relief Applications
CREATE TABLE relief_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_type TEXT CHECK (application_type IN ('oic', 'installment_agreement', 'penalty_abatement', 'cnc')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'appealing')) DEFAULT 'draft',
  submission_date DATE,
  decision_date DATE,
  application_data JSONB,
  outcome TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plaid Items
CREATE TABLE plaid_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL,
  access_token TEXT NOT NULL, -- Encrypted
  institution_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plaid_item_id UUID REFERENCES plaid_items(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  subtype TEXT,
  current_balance DECIMAL(12,2),
  available_balance DECIMAL(12,2),
  last_synced TIMESTAMPTZ,
  UNIQUE(plaid_item_id, account_id)
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  transaction_id TEXT NOT NULL,
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  merchant_name TEXT,
  category TEXT,
  category_confidence DECIMAL(3,2),
  is_tax_deductible BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  notes TEXT,
  receipt_document_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, transaction_id)
);

-- Recurring Transactions
CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  merchant_name TEXT NOT NULL,
  category TEXT,
  expected_amount DECIMAL(12,2),
  amount_variance DECIMAL(12,2),
  frequency TEXT CHECK (frequency IN ('weekly', 'biweekly', 'semimonthly', 'monthly', 'quarterly', 'annual')),
  expected_day INTEGER,
  last_occurrence DATE,
  next_expected DATE,
  is_income BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_category TEXT,
  is_tax_deductible BOOLEAN DEFAULT FALSE,
  color TEXT
);

-- Tax Documents
CREATE TABLE tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tax_year INTEGER NOT NULL,
  document_type TEXT,
  file_path TEXT NOT NULL,
  extracted_data JSONB,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Tax Projections
CREATE TABLE tax_projections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tax_year INTEGER NOT NULL,
  projection_date DATE DEFAULT CURRENT_DATE,
  estimated_income DECIMAL(12,2),
  estimated_deductions DECIMAL(12,2),
  estimated_tax_liability DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IRS National Standards (Reference Data)
CREATE TABLE irs_national_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  household_size INTEGER,
  state TEXT,
  county TEXT,
  amount DECIMAL(12,2) NOT NULL
);

-- Tax Brackets (Reference Data)
CREATE TABLE tax_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  filing_status TEXT NOT NULL,
  min_income DECIMAL(12,2) NOT NULL,
  max_income DECIMAL(12,2),
  rate DECIMAL(5,4) NOT NULL,
  base_tax DECIMAL(12,2) DEFAULT 0
);

-- Create indexes
CREATE INDEX idx_tax_debt_user ON tax_debt(user_id);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_irs_standards_lookup ON irs_national_standards(year, category, household_size, state, county);
CREATE INDEX idx_tax_brackets_lookup ON tax_brackets(year, filing_status);
```

### Row-Level Security Policies

```sql
-- Enable RLS on all user tables
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_debt ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE irs_correspondence ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE irs_allowable_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE relief_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_projections ENABLE ROW LEVEL SECURITY;

-- Create policies (example for user_profile, replicate for others)
CREATE POLICY "Users can view own profile" ON user_profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profile
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reference tables are readable by all authenticated users
CREATE POLICY "Authenticated users can read standards" ON irs_national_standards
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read brackets" ON tax_brackets
  FOR SELECT TO authenticated USING (true);
```

## Component Specifications

### Sidebar Navigation

```tsx
// components/layout/sidebar.tsx
interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Tax Debt', href: '/tax-debt', icon: AlertCircle },
  { label: 'Cash Flow', href: '/cash-flow', icon: TrendingUp },
  { label: 'Transactions', href: '/transactions', icon: CreditCard },
  { label: 'Tax Center', href: '/tax-center', icon: Calculator },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Settings', href: '/settings', icon: Settings },
]
```

### Auth Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   /login    │────▶│  Supabase   │────▶│ /dashboard  │
│   (form)    │     │   Auth      │     │ (protected) │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   ▼                   │
       │            ┌─────────────┐            │
       │            │  Middleware │◀───────────┘
       │            │  (check)    │
       │            └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       └───────────▶│  Redirect   │
                    │  to /login  │
                    └─────────────┘
```

### Theme Configuration

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... rest of shadcn/ui colors
      },
    },
  },
}
```

## API Specifications

### Auth Callback Route

```typescript
// app/api/auth/callback/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

### Server Actions

```typescript
// actions/auth.ts
'use server'

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = createServerActionClient({ cookies })

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = createServerActionClient({ cookies })
  await supabase.auth.signOut()
  redirect('/login')
}
```

## Environment Variables

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing Strategy

### Unit Tests
- Utility functions
- Form validation schemas
- Component rendering

### Integration Tests
- Auth flow (signup → login → logout)
- Protected route access
- Database operations

### E2E Tests
- Complete auth journey
- Navigation between pages
