# Software Requirements Document: Cash Flow

## Overview

**Feature Name:** Cash Flow Forecasting
**Spec ID:** 2025-12-03-cash-flow
**Priority:** High
**Estimated Effort:** M (3-5 days)

## Executive Summary

Implement a comprehensive cash flow forecasting system that learns recurring income and expense patterns from transaction history, provides real-time balance projections, and answers "where will I be on the 15th?" at any point in the month.

## Goals

1. Automatically detect recurring transactions (income and expenses)
2. Provide calendar visualization of expected cash flow
3. Project future balances with confidence ranges
4. Alert users to potential cash shortfalls

## Functional Requirements

### FR-1: Recurring Transaction Detection
- Pattern analysis engine for transaction history
- Detect weekly, bi-weekly, monthly, quarterly patterns
- Confidence scoring based on consistency
- Manual override for user corrections

### FR-2: Cash Flow Calendar
- Monthly calendar with income/expense indicators
- Running balance projection per day
- Visual distinction between confirmed and expected
- Today marker and paydays highlighted

### FR-3: Month-End Forecasting
- Current balance as starting point
- Add/subtract expected transactions by date
- Confidence intervals (best/expected/worst case)
- "Where will I be" query interface

### FR-4: Cash Flow Dashboard
- Summary widget for main dashboard
- Quick projections (15th, month-end)
- Balance trajectory mini-chart
- Next major events (payday, large bills)

### FR-5: Cash Flow Alerts
- Projected negative balance warnings
- Missed expected transaction alerts
- Unusual variance notifications
- Low balance threshold alerts

## Non-Functional Requirements

- Recurring detection runs < 5s on initial analysis
- Projection calculation < 500ms
- Month-end predictions within 5% after 2 months of data
- Calendar renders < 1s

## Dependencies

- Bank Integration complete (transactions synced)
- At least 3 months transaction history for pattern detection
- Account balances available from Plaid
