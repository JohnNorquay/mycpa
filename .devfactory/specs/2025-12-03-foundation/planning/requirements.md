# Requirements: Foundation

## Initial Request

Set up the foundational infrastructure for CPA Bot including Next.js project, Supabase integration, authentication, database schema, and base UI layout with dark theme.

## Product Context

### Mission Alignment
This foundation enables all core CPA Bot functionality: IRS debt resolution, financial tracking, cash flow forecasting, tax planning, and document management.

### Roadmap Context
- Current Phase: Phase 1 - Foundation
- Feature Priority: Critical (blocking all other features)
- Related Features: Every subsequent feature depends on this

### Technical Context
- Stack: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase
- Deployment: Vercel
- Key Constraints: Single-user application, Vercel-optimized, dark theme default

## Clarification Q&A

### Navigation Structure
**Q: Which sections should appear in the main nav from day one?**
**A:** All sections - Dashboard, Tax Debt, Cash Flow, Transactions, Tax Center, Documents, Settings - show all even if empty initially.

### Theme Preference
**Q: For the color theme/branding, any preference?**
**A:** Dark theme as primary default, with optional light mode support.

## Visual Assets

No visual assets provided. Use shadcn/ui defaults with dark theme customization.

## Functional Requirements

### 1. Project Setup & Configuration

1. **Next.js Initialization**: Create Next.js 14 project with App Router, TypeScript, Tailwind CSS, and ESLint
2. **Package Installation**: Install and configure shadcn/ui, React Hook Form, Zod, React Query, Recharts
3. **Supabase Setup**: Configure Supabase client for both server and client components
4. **Environment Configuration**: Set up environment variables for Supabase, with .env.example template
5. **Directory Structure**: Implement the directory structure from tech-stack.md
6. **Development Tooling**: Configure pnpm, Husky, lint-staged, Prettier

### 2. Authentication System

1. **Supabase Auth Integration**: Configure Supabase Auth with email/password
2. **Auth Pages**: Create login and signup pages with form validation
3. **Session Management**: Implement session handling with Supabase client
4. **Protected Routes**: Create Next.js middleware for route protection
5. **Auth Context**: Provide auth state throughout the application
6. **Logout Functionality**: Implement secure logout with session cleanup

### 3. Database Schema & Migrations

1. **Users Table**: Extend Supabase auth.users with profile data
2. **User Profile Table**:
   - id, user_id, first_name, last_name, date_of_birth
   - filing_status, dependents, state, county
   - has_health_conditions, health_conditions_notes (encrypted)
   - employment_status, created_at, updated_at
3. **Tax Debt Table**:
   - id, user_id, tax_year, debt_type, original_amount, current_balance
   - interest_rate, penalty_rate, source, collection_status
   - statute_expiration_date, created_at, updated_at
4. **Tax Debt Payments Table**:
   - id, tax_debt_id, payment_date, amount, payment_method
   - applied_to, confirmation_number, created_at
5. **IRS Correspondence Table**:
   - id, user_id, tax_debt_id, notice_date, notice_type, notice_number
   - response_deadline, status, document_id, notes, created_at, updated_at
6. **Financial Snapshot Table**:
   - id, user_id, relief_application_id, snapshot_date
   - monthly_gross_income, monthly_net_income, monthly_allowable_expenses
   - monthly_disposable_income, total_asset_equity, home_equity
   - vehicle_equity, bank_balance, investment_value
   - reasonable_collection_potential, future_income_months, notes, created_at
7. **IRS Allowable Expenses Table**:
   - id, user_id, financial_snapshot_id, category
   - irs_allowable_amount, actual_amount, variance, justification
   - created_at, updated_at
8. **Relief Applications Table**:
   - id, user_id, application_type, status, submission_date
   - decision_date, application_data (JSONB), outcome, notes
   - created_at, updated_at
9. **Plaid Items Table**:
   - id, user_id, item_id, access_token (encrypted), institution_name
   - created_at
10. **Accounts Table**:
    - id, user_id, plaid_item_id, account_id, name, type, subtype
    - current_balance, available_balance, last_synced
11. **Transactions Table**:
    - id, user_id, account_id, transaction_id, date, amount
    - merchant_name, category, category_confidence, is_tax_deductible
    - is_recurring, recurrence_pattern, notes, receipt_document_id
    - created_at, updated_at
12. **Recurring Transactions Table**:
    - id, user_id, merchant_name, category, expected_amount
    - amount_variance, frequency, expected_day, last_occurrence
    - next_expected, is_income, is_active, created_at, updated_at
13. **Categories Table**:
    - id, user_id, name, parent_category, is_tax_deductible, color
14. **Tax Documents Table**:
    - id, user_id, tax_year, document_type, file_path
    - extracted_data (JSONB), upload_date, processed
15. **Tax Projections Table**:
    - id, user_id, tax_year, projection_date, estimated_income
    - estimated_deductions, estimated_tax_liability, notes, created_at
16. **IRS National Standards Table** (reference data):
    - id, year, category, household_size, state, county, amount
17. **Tax Brackets Table** (reference data):
    - id, year, filing_status, min_income, max_income, rate, base_tax
18. **Row-Level Security**: Implement RLS policies for all user-specific tables
19. **Field Encryption**: Set up pgcrypto for sensitive fields (access_token, health_conditions_notes)

### 4. Base UI Layout

1. **Root Layout**: Create app layout with dark theme, fonts, metadata
2. **Dashboard Shell**: Responsive layout with sidebar navigation and main content area
3. **Navigation Component**:
   - Sidebar with icons and labels
   - Sections: Dashboard, Tax Debt, Cash Flow, Transactions, Tax Center, Documents, Settings
   - Active state indication
   - Collapsible on mobile
4. **Header Component**: User avatar/menu, quick actions
5. **Theme Provider**: Dark theme default with system preference detection and toggle
6. **Loading States**: Skeleton components for async content
7. **Error Boundary**: Global error handling with user-friendly messages
8. **Toast/Notification System**: For success/error feedback

## Non-Functional Requirements

### Performance
- Initial page load < 2.5s (LCP)
- Navigation between pages < 500ms
- Auth operations < 1s

### Security
- All routes except /login, /signup require authentication
- Supabase RLS enforced on all tables
- No sensitive data in client-side storage
- HTTPS enforced

### Accessibility
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management on route changes
- Color contrast meets WCAG AA

### Mobile/Responsive
- Works on viewport widths 320px to 2560px
- Touch-friendly navigation
- Collapsible sidebar on mobile

## Integration Points

1. **Supabase Auth**: Authentication provider
2. **Supabase Database**: PostgreSQL with RLS
3. **Supabase Storage**: For future document uploads
4. **Next.js Middleware**: Route protection

## Out of Scope

1. Actual Plaid integration (schema only, implementation in Spec 3)
2. Transaction syncing (Spec 3)
3. Tax calculations (Spec 5)
4. Document upload/OCR (Spec 6)
5. AI features (Spec 7)
6. Email verification (can add later)
7. Password reset flow (can add later)
8. OAuth providers (future enhancement)

## Dependencies

1. Supabase project created with auth enabled
2. Vercel account for deployment
3. GitHub repository initialized

## Success Criteria

- [ ] Next.js app runs locally with `pnpm dev`
- [ ] User can sign up with email/password
- [ ] User can log in and see dashboard
- [ ] Unauthenticated users redirected to login
- [ ] All database tables created with RLS policies
- [ ] Navigation shows all 7 sections
- [ ] Dark theme displays correctly
- [ ] Responsive layout works on mobile
- [ ] App deploys successfully to Vercel

## Open Questions

None. Requirements complete and ready for specification.

## Next Steps

Ready to proceed to formal specification via `/create-spec`.

---

*This requirements document was created through lite shape-spec process, leveraging comprehensive product planning already completed.*
