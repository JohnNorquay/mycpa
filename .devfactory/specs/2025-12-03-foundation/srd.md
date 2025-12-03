# Software Requirements Document: Foundation

## Overview

**Feature Name:** Foundation
**Spec ID:** 2025-12-03-foundation
**Priority:** Critical (Blocking)
**Estimated Effort:** M (3-5 days)

## Executive Summary

Establish the foundational infrastructure for CPA Bot including Next.js 14 project setup, Supabase integration, authentication system, complete database schema, and base UI layout with dark theme. This spec is a prerequisite for all other features.

## Goals

1. Initialize a production-ready Next.js 14 project with TypeScript and Tailwind
2. Implement secure authentication with Supabase Auth
3. Create complete database schema for all CPA Bot features
4. Build responsive dashboard UI shell with navigation

## User Stories

### US-1: Project Initialization
**As a** developer
**I want** a properly configured Next.js project
**So that** I can build features with consistent tooling and patterns

**Acceptance Criteria:**
- Next.js 14 with App Router configured
- TypeScript strict mode enabled
- Tailwind CSS with dark theme configured
- shadcn/ui components installed
- ESLint and Prettier configured
- Environment variables template created

### US-2: User Authentication
**As a** user
**I want** to sign up and log in securely
**So that** my financial data is protected

**Acceptance Criteria:**
- User can sign up with email and password
- User can log in with credentials
- User can log out
- Invalid credentials show clear error
- Sessions persist across browser refreshes
- Unauthenticated users cannot access protected routes

### US-3: Database Schema
**As a** developer
**I want** a complete database schema
**So that** all features have proper data storage

**Acceptance Criteria:**
- All tables from requirements created
- Row-Level Security enabled on all user tables
- Encrypted fields properly configured
- Foreign key relationships defined
- Indexes on frequently queried columns

### US-4: Dashboard Shell
**As a** user
**I want** a clean dashboard interface
**So that** I can navigate between features easily

**Acceptance Criteria:**
- Sidebar navigation with all 7 sections
- Active state indication on current page
- Responsive layout (mobile and desktop)
- Dark theme applied consistently
- Loading states for async content

## Functional Requirements

### FR-1: Project Setup
- FR-1.1: Initialize Next.js 14 with App Router
- FR-1.2: Configure TypeScript with strict mode
- FR-1.3: Install and configure Tailwind CSS
- FR-1.4: Install shadcn/ui with dark theme
- FR-1.5: Configure ESLint, Prettier, Husky
- FR-1.6: Create .env.example with all required variables
- FR-1.7: Set up directory structure per tech-stack.md

### FR-2: Authentication
- FR-2.1: Configure Supabase client (server and client)
- FR-2.2: Create signup page with form validation
- FR-2.3: Create login page with form validation
- FR-2.4: Implement session management
- FR-2.5: Create auth middleware for route protection
- FR-2.6: Implement logout functionality
- FR-2.7: Create auth context provider

### FR-3: Database Schema
- FR-3.1: Create user_profile table
- FR-3.2: Create tax_debt table
- FR-3.3: Create tax_debt_payments table
- FR-3.4: Create irs_correspondence table
- FR-3.5: Create financial_snapshot table
- FR-3.6: Create irs_allowable_expenses table
- FR-3.7: Create relief_applications table
- FR-3.8: Create plaid_items table
- FR-3.9: Create accounts table
- FR-3.10: Create transactions table
- FR-3.11: Create recurring_transactions table
- FR-3.12: Create categories table
- FR-3.13: Create tax_documents table
- FR-3.14: Create tax_projections table
- FR-3.15: Create irs_national_standards table
- FR-3.16: Create tax_brackets table
- FR-3.17: Enable RLS on all user tables
- FR-3.18: Configure pgcrypto for encrypted fields

### FR-4: Base UI
- FR-4.1: Create root layout with dark theme
- FR-4.2: Create dashboard layout with sidebar
- FR-4.3: Create navigation component
- FR-4.4: Create header component with user menu
- FR-4.5: Configure theme provider
- FR-4.6: Create loading skeleton components
- FR-4.7: Create error boundary component
- FR-4.8: Create toast notification system

## Non-Functional Requirements

### NFR-1: Performance
- Initial page load < 2.5s (LCP)
- Navigation between pages < 500ms
- Auth operations < 1s

### NFR-2: Security
- All auth routes over HTTPS
- Passwords never stored in plain text
- Session tokens httpOnly and secure
- RLS prevents cross-user data access

### NFR-3: Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatible
- Focus management on navigation

### NFR-4: Maintainability
- Consistent code style (enforced by linting)
- TypeScript strict mode (no any)
- Component documentation
- Clear directory structure

## Technical Specifications

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Deployment:** Vercel

### Architecture Decisions
1. Use React Server Components by default
2. Use Server Actions for auth mutations
3. Middleware for route protection
4. RLS as primary data access control

## Dependencies

- Supabase project created
- Vercel account (for deployment testing)
- GitHub repository initialized

## Out of Scope

- Email verification flow
- Password reset flow
- OAuth providers
- Multi-factor authentication
- Admin user management
