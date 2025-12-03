# Software Requirements Document: Tax Planning

## Overview

**Feature Name:** Tax Planning & Projections
**Spec ID:** 2025-12-03-tax-planning
**Priority:** High
**Estimated Effort:** L (5-8 days)

## Executive Summary

Implement comprehensive year-round tax planning tools including federal and Wisconsin state tax calculation engines, real-time tax liability projections, deduction tracking with threshold alerts, and estimated tax calculator for 1099/self-employment income.

## Goals

1. Calculate projected federal tax liability in real-time
2. Calculate Wisconsin state tax liability
3. Track deductions and show itemize vs standard comparison
4. Calculate estimated quarterly tax payments for 1099 income
5. Alert users to withholding adjustments needed

## Functional Requirements

### FR-1: Federal Tax Calculation Engine
- Progressive tax bracket calculation
- All filing statuses (Single, MFJ, MFS, HoH, QW)
- Multiple income types (W2, 1099, interest, dividends, capital gains)
- Self-employment tax calculation
- Standard vs itemized deduction comparison
- Basic tax credits (Child Tax Credit, EIC)

### FR-2: Wisconsin State Tax Engine
- Wisconsin 4-bracket system (3.5%, 4.4%, 5.3%, 7.65%)
- Wisconsin standard deduction with phase-out
- Wisconsin-specific credits
- Combined federal + state view

### FR-3: Tax Projection Dashboard
- YTD income by type
- Projected full-year tax liability
- Withholding status (over/under)
- Marginal rate display
- Standard vs itemized recommendation

### FR-4: Deduction Tracker
- Categories: Charitable, Medical, SALT, Mortgage, Home Office, Mileage
- Progress toward itemizing threshold
- SALT cap warning ($10,000)
- Auto-pull from tax-deductible transactions

### FR-5: Estimated Tax Calculator
- Quarterly payment schedule
- Safe harbor calculation
- Underpayment penalty estimator
- W4 adjustment recommendations

## Non-Functional Requirements

- Tax calculation < 500ms
- Dashboard loads < 1s
- Calculations match IRS/DOR tables exactly
- Tax brackets stored in database for easy annual updates

## Dependencies

- Bank Integration complete (for deduction tracking)
- Tax bracket reference data loaded
- User profile with filing status
