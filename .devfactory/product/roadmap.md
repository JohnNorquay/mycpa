# Product Roadmap

## Development Phases

### Phase 1: Foundation & Authentication
Core infrastructure that everything else depends on.

1. [ ] **Project Setup & Configuration** — Initialize Next.js 14 (App Router), FastAPI backend, and Supabase project with proper folder structure, environment configuration, and development tooling `S`

2. [ ] **Authentication System** — Implement Supabase Auth with email/password login, session management, protected routes, and user profile creation `S`

3. [ ] **Database Schema & Migrations** — Create all core database tables (users, user_profile, tax_debt, irs_correspondence, financial_snapshot, etc.) with proper relationships, RLS policies, and encrypted field handling `M`

4. [ ] **Base UI Layout** — Build responsive dashboard shell with navigation (Dashboard, Tax Debt Center, Transactions, Tax Center, Documents, Settings), theming, and loading states `S`

### Phase 2: Tax Debt Resolution Core
The highest-priority features for the user's immediate needs.

5. [ ] **User Profile & Demographics** — Create profile management for age, filing status, dependents, location (county for IRS standards), health conditions, and employment status—all required for IRS calculations `S`

6. [ ] **Tax Debt Tracking** — Build CRUD interface for tracking tax debt by year, type (income/penalty/interest), original amount, current balance, interest rate, collection status, and statute expiration dates `M`

7. [ ] **IRS National Standards Integration** — Implement database/API for IRS allowable living expenses (food, housing, transportation, healthcare) by location and household size with annual update capability `M`

8. [ ] **Financial Snapshot System** — Build comprehensive financial data capture: monthly income (all sources), actual expenses by category, asset equity (home, vehicles, bank, investments), with comparison to IRS allowable amounts `M`

9. [ ] **OIC Calculator Engine** — Implement full Reasonable Collection Potential calculation: asset equity (quick sale value), future income (age-adjusted months × disposable income), and minimum offer determination with lump sum vs periodic payment options `L`

10. [ ] **Installment Agreement Calculator** — Build payment plan comparison tool: guaranteed (<$10K), streamlined (<$50K), and partial payment options with monthly payment, total interest, and payoff timeline calculations `M`

11. [ ] **Relief Program Comparison Dashboard** — Create side-by-side view of OIC vs Installment Agreement vs CNC vs Penalty Abatement with eligibility indicators, pros/cons, and AI-powered strategy recommendation `M`

12. [ ] **IRS Correspondence Tracker** — Build notice logging system with date, type, response deadline, status, document attachment, and automated deadline reminders `S`

### Phase 3: Financial Tracking & Bank Integration
Build the transaction infrastructure that supports both debt resolution and ongoing tax planning.

13. [ ] **Plaid Integration Setup** — Implement Plaid Link flow, token exchange, and secure access token storage with support for checking, savings, and credit card accounts `M`

14. [ ] **Transaction Sync Engine** — Build automatic daily transaction sync from Plaid with historical import (2+ years), incremental updates, and error handling/retry logic `M`

15. [ ] **AI Transaction Categorization** — Implement Claude API integration for intelligent transaction categorization with tax-deductible flagging, confidence scores, and learning from user corrections `M`

16. [ ] **Transaction Management UI** — Create searchable, filterable transaction list with category editing, split transactions, recurring detection, merchant normalization, and receipt attachment `M`

17. [ ] **Category Management** — Build custom category system with tax-deductible flags, parent categories, and category mapping rules `S`

18. [ ] **Recurring Transaction Detection** — Analyze transaction history to identify recurring income (paychecks, deposits) and expenses (subscriptions, bills) with amount, frequency, and expected date patterns `M`

19. [ ] **Cash Flow Calendar** — Build visual calendar showing expected income (green) and expenses (red) by date, with actual vs expected status indicators and running balance projection `M`

20. [ ] **Month-End Forecasting Engine** — Calculate projected balance for any future date based on current balance + expected income - expected expenses, with confidence intervals based on historical variance `M`

21. [ ] **Cash Flow Dashboard** — Create dashboard widget showing: current balance, month-to-date in/out, remaining expected in/out, and projected month-end balance with "where will I be on X date" query `S`

22. [ ] **Cash Flow Alerts** — Implement notifications for: projected negative balance, missed expected transactions, unusual variance from expected amounts, and upcoming large expenses `S`

### Phase 4: Tax Planning & Projections
Year-round tax intelligence.

23. [ ] **Federal Tax Calculation Engine** — Implement 2024/2025 federal tax bracket calculations, standard deduction, filing status handling, and marginal rate visualization `M`

24. [ ] **Wisconsin State Tax Engine** — Build Wisconsin-specific tax calculations including state brackets, credits, and deductions `S`

25. [ ] **Tax Projection Dashboard** — Create real-time tax liability projection combining income sources, deductions, and withholdings with standard vs itemized comparison `M`

26. [ ] **Deduction Tracker** — Build categorized deduction tracking for charitable donations, medical expenses, state/local taxes (SALT), home office, and mileage with running totals and thresholds `M`

27. [ ] **Estimated Tax Calculator** — Implement quarterly estimated payment calculations for 1099 income with safe harbor rules and payment schedule `S`

### Phase 5: Document Management
Secure document handling with intelligent processing.

28. [ ] **Document Upload System** — Build secure drag-and-drop upload to Supabase Storage with encryption, year/category organization, and file type validation `S`

29. [ ] **OCR Processing Pipeline** — Implement document text extraction using Tesseract/pdf2image with async processing queue and status tracking `M`

30. [ ] **Document Classification & Extraction** — Build AI-powered document type detection (W2, 1099-MISC, 1099-NEC, 1099-INT, etc.) with key field extraction (employer, amounts, EIN) `M`

31. [ ] **Document Management UI** — Create document library with year filtering, type filtering, search, preview, and bulk operations `S`

### Phase 6: AI Insights & Intelligence
Leverage Claude for personalized financial guidance.

32. [ ] **Financial Q&A Interface** — Build "Ask Claude" chat interface for natural language questions about finances, taxes, and debt resolution with context-aware responses `M`

33. [ ] **Spending Analysis & Trends** — Implement monthly/yearly spending analysis with category breakdowns, month-over-month comparisons, and anomaly detection `M`

34. [ ] **Tax Optimization Suggestions** — Build proactive recommendation engine for retirement contributions, tax-loss harvesting timing, deduction bunching, and estimated payment reminders `M`

35. [ ] **Monthly Summary Reports** — Generate AI-written monthly financial summaries with key insights, tax status, and action items `S`

### Phase 7: Polish & Production
Final refinements for production readiness.

36. [ ] **Error Handling & Edge Cases** — Comprehensive error handling, validation, user-friendly error messages, and graceful degradation across all features `M`

37. [ ] **Security Audit & Hardening** — Review authentication, API security, data encryption, RLS policies, and sensitive data handling `M`

38. [ ] **Performance Optimization** — Database query optimization, API response caching, frontend bundle optimization, and lazy loading `S`

39. [ ] **Production Deployment** — Deploy to Vercel (frontend) and Railway/Vercel (backend) with proper environment configuration, monitoring, and logging `S`

## Effort Scale
- `XS`: < 1 day
- `S`: 1-2 days
- `M`: 3-5 days
- `L`: 1-2 weeks
- `XL`: 2+ weeks

## Dependencies & Notes

### Critical Dependencies
- Features 5-12 (Tax Debt Resolution) depend on Feature 3 (Database Schema)
- Features 13-17 (Bank Integration) depend on Features 1-2 (Auth)
- Feature 9 (OIC Calculator) depends on Features 7-8 (National Standards + Financial Snapshot)
- Features 18-22 (Cash Flow) depend on Features 14-15 (Transaction Sync + Categorization)
- Feature 18 (Recurring Detection) is prerequisite for Features 19-22 (Cash Flow features)
- Features 23-27 (Tax Planning) depend on Features 15-16 (Transaction categorization)
- Features 28-31 (Documents) can be built in parallel with Phase 3-4

### Technical Considerations
- IRS National Standards data needs annual updates (typically March)
- Plaid requires production credentials approval process
- Claude API rate limits need consideration for batch categorization
- OCR processing should be async to not block UI

### Risk Areas
- OIC calculation accuracy must match IRS methodology closely
- Plaid integration requires handling various bank edge cases
- Tax calculations need thorough testing against known scenarios
- Document OCR quality varies significantly by source document

### Annual Maintenance Required
- Update federal tax brackets (January)
- Update Wisconsin tax rules (January)
- Update IRS National Standards (March)
- Update IRS form versions as released
- Review Plaid API changes

## MVP Definition

**Minimum Viable Product (Features 1-12):**
A user can authenticate, enter their profile demographics, track their IRS tax debt, capture a complete financial snapshot, calculate their OIC offer amount, compare relief program options, and track IRS correspondence—addressing the immediate tax debt resolution need.

**V1.1 - Financial Tracking + Cash Flow (Features 13-22):**
Bank integration with automatic transaction sync, AI categorization, recurring pattern detection, and cash flow forecasting—know where you'll be at month-end from any point in the month.

**Full V1 (Features 1-35):**
Complete personal CPA assistant with bank integration, AI categorization, cash flow forecasting, year-round tax projections, document management, and intelligent insights.
