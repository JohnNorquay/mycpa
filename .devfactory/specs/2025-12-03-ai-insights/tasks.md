# Implementation Tasks: AI Insights

## Task Groups Overview

| Group | Name | Tasks | Dependencies |
|-------|------|-------|--------------|
| 1 | Chat System | 5 | All Previous Specs |
| 2 | Spending Analysis | 4 | Bank Integration |
| 3 | Tax Optimization | 4 | Tax Planning |
| 4 | Monthly Summaries | 5 | All Previous |
| 5 | Testing | 3 | All |

---

## Task Group 1: Chat System

**Assigned Agent:** `integration-engineer`

- [ ] **1.1** Create chat utility
  - `lib/ai/chat.ts`
  - Claude Sonnet integration
  - Streaming response support
  - System prompt with guidelines

- [ ] **1.2** Create context builder
  - `lib/ai/context-builder.ts`
  - Gather user profile, tax debt, transactions
  - Cash flow and tax projections
  - Context trimming for token limits

- [ ] **1.3** Create chat server actions
  - `actions/ai-chat.ts`
  - `streamChat()` - streaming response
  - `getSuggestedQuestions()` - contextual suggestions

- [ ] **1.4** Create chat interface component
  - `components/features/insights/chat-interface.tsx`
  - Message history display
  - Streaming response rendering
  - Suggested questions UI

- [ ] **1.5** Create chat page
  - `app/(dashboard)/insights/chat/page.tsx`
  - Full-page chat experience
  - Disclaimer about not being professional advice

---

## Task Group 2: Spending Analysis

**Assigned Agent:** `integration-engineer`

- [ ] **2.1** Create spending analyzer utility
  - `lib/ai/spending-analyzer.ts`
  - Category breakdown calculation
  - Month-over-month comparison
  - Savings rate calculation

- [ ] **2.2** Create trend detection
  - Identify increasing/decreasing categories
  - Calculate percentage changes
  - Generate trend descriptions

- [ ] **2.3** Create anomaly detection
  - Unusual transaction amounts
  - New merchant large purchases
  - New subscription detection
  - Missing expected transactions

- [ ] **2.4** Create spending dashboard components
  - `components/features/insights/spending-dashboard.tsx`
  - Category breakdown chart
  - Trend badges
  - Anomaly alerts

---

## Task Group 3: Tax Optimization

**Assigned Agent:** `integration-engineer`

- [ ] **3.1** Create tax optimizer utility
  - `lib/ai/tax-optimizer.ts`
  - Retirement contribution opportunities
  - Deduction bunching analysis
  - Withholding adjustment calculations

- [ ] **3.2** Create suggestion generation
  - IRA contribution suggestions
  - W4 adjustment recommendations
  - Estimated payment reminders
  - Tax debt strategy updates

- [ ] **3.3** Create suggestion server actions
  - `actions/tax-suggestions.ts`
  - `getTaxSuggestions()` - generate all suggestions
  - Priority sorting

- [ ] **3.4** Create tax suggestions UI
  - `components/features/insights/tax-suggestions.tsx`
  - Suggestion cards with priority badges
  - Action buttons/links
  - Potential savings display

---

## Task Group 4: Monthly Summaries

**Assigned Agent:** `integration-engineer`

- [ ] **4.1** Create summary generator utility
  - `lib/ai/summary-generator.ts`
  - Financial snapshot calculation
  - Income and spending aggregation
  - Notable transaction selection

- [ ] **4.2** Create AI narrative generation
  - Prompt for natural language summary
  - Use Haiku for efficiency
  - Incorporate key metrics

- [ ] **4.3** Create Inngest summary function
  - `inngest/functions/generate-monthly-summary.ts`
  - Cron job: 1st of each month at 6 AM
  - Process all users
  - Save summaries to database

- [ ] **4.4** Create summary server actions
  - `actions/summaries.ts`
  - `getMonthlySummaries()` - list summaries
  - `getMonthlySummary(month)` - single summary

- [ ] **4.5** Create summary UI components
  - `components/features/insights/monthly-summary.tsx`
  - Financial snapshot display
  - AI narrative section
  - Action items list

---

## Task Group 5: Testing

**Assigned Agent:** `testing-engineer`

- [ ] **5.1** Test chat system
  - Verify streaming responses work
  - Test context injection accuracy
  - Verify no hallucinated numbers

- [ ] **5.2** Test spending analysis
  - Verify category calculations
  - Test trend detection accuracy
  - Test anomaly detection

- [ ] **5.3** Manual verification
  - [ ] Can ask questions in chat
  - [ ] Responses reference actual user data
  - [ ] Suggested questions are relevant
  - [ ] Spending analysis shows correct totals
  - [ ] Trends are identified correctly
  - [ ] Anomalies are detected
  - [ ] Tax suggestions are personalized
  - [ ] Monthly summary generates correctly
  - [ ] AI narrative is accurate and helpful
  - [ ] No hallucinated numbers in responses

---

## Completion Checklist

- [ ] Chat system with streaming responses
- [ ] Context injection working
- [ ] Spending analysis accurate
- [ ] Trend and anomaly detection working
- [ ] Tax suggestions generating
- [ ] Monthly summaries auto-generating
- [ ] All tests passing
