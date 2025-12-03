# Software Requirements Document: Tax Debt Core

## Overview

**Feature Name:** Tax Debt Core
**Spec ID:** 2025-12-03-tax-debt-core
**Priority:** Critical (MVP)
**Estimated Effort:** L (1-2 weeks)

## Executive Summary

Build the complete IRS tax debt resolution toolkit - the primary value proposition of CPA Bot. This includes user demographics, debt tracking, IRS National Standards integration, financial snapshot capture, OIC calculator, installment agreement calculator, relief program comparison, and IRS correspondence tracking.

## Goals

1. Enable users to track and manage their IRS tax debt
2. Provide accurate OIC (Offer in Compromise) calculations matching IRS methodology
3. Compare relief program options with personalized recommendations
4. Track IRS correspondence and never miss deadlines

## User Stories

### US-1: User Profile Management
**As a** user with tax debt
**I want** to enter my demographic information
**So that** the system can calculate my IRS relief options accurately

### US-2: Tax Debt Tracking
**As a** user
**I want** to track my outstanding tax debt by year and type
**So that** I can see my total liability and progress over time

### US-3: OIC Eligibility Assessment
**As a** user
**I want** to know if I qualify for an Offer in Compromise
**So that** I can potentially settle my debt for less than I owe

### US-4: Relief Program Comparison
**As a** user
**I want** to compare my options (OIC, payment plan, CNC)
**So that** I can choose the best strategy for my situation

### US-5: Correspondence Management
**As a** user
**I want** to track IRS notices and deadlines
**So that** I never miss a response deadline

## Functional Requirements

### FR-1: User Profile & Demographics
- FR-1.1: Profile form with all IRS-relevant fields
- FR-1.2: Age calculation with OIC multiplier display
- FR-1.3: Profile validation for IRS requirements
- FR-1.4: Dashboard widget showing key demographics

### FR-2: Tax Debt Tracking
- FR-2.1: CRUD for tax debt records
- FR-2.2: Debt list with totals and filtering
- FR-2.3: Daily interest calculation
- FR-2.4: Statute of limitations tracking
- FR-2.5: Payment history tracking

### FR-3: IRS National Standards
- FR-3.1: Database of allowable living expenses
- FR-3.2: Lookup by location and household size
- FR-3.3: Comparison view (actual vs allowed)

### FR-4: Financial Snapshot
- FR-4.1: Income entry (Form 433-A aligned)
- FR-4.2: Expense entry with National Standards comparison
- FR-4.3: Asset entry with quick sale value calculation
- FR-4.4: Disposable income calculation
- FR-4.5: Snapshot history and comparison

### FR-5: OIC Calculator
- FR-5.1: Reasonable Collection Potential (RCP) calculation
- FR-5.2: Age-adjusted future income calculation
- FR-5.3: Lump sum vs periodic payment options
- FR-5.4: Application fee calculation
- FR-5.5: Form 656/433-A data mapping

### FR-6: Installment Agreement Calculator
- FR-6.1: Agreement type determination
- FR-6.2: Monthly payment calculator
- FR-6.3: Payoff timeline projection
- FR-6.4: Total cost comparison

### FR-7: Relief Program Comparison
- FR-7.1: Eligibility matrix for all programs
- FR-7.2: Side-by-side comparison
- FR-7.3: AI-powered recommendation
- FR-7.4: Professional help triggers

### FR-8: IRS Correspondence Tracker
- FR-8.1: Notice entry and logging
- FR-8.2: Deadline tracking and alerts
- FR-8.3: Response status tracking
- FR-8.4: Document attachment

## Non-Functional Requirements

- OIC calculation accuracy within 5% of IRS pre-qualifier
- Financial snapshot save < 1s
- National Standards lookup < 200ms

## Dependencies

- Foundation spec complete
- IRS National Standards data loaded
- Tax brackets data loaded
