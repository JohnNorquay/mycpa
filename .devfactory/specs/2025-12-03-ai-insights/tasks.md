# Implementation Tasks: AI Insights

## Task Groups Overview

| Group | Name              | Tasks | Dependencies       |
| ----- | ----------------- | ----- | ------------------ |
| 1     | Chat System       | 5     | All Previous Specs |
| 2     | Spending Analysis | 4     | Bank Integration   |
| 3     | Tax Optimization  | 4     | Tax Planning       |
| 4     | Monthly Summaries | 5     | All Previous       |
| 5     | Testing           | 3     | All                |

---

## Task Group 1: Chat System

**Assigned Agent:** `integration-engineer`

- [ ] **1.1** Create chat utility
  - `lib/ai/chat.ts`
  - Claude Sonnet integration
  - Streaming response support
  - System prompt with guidelines
  - **depends_on**: []

- [ ] **1.2** Create context builder
  - `lib/ai/context-builder.ts`
  - Gather user profile, tax debt, transactions
  - Cash flow and tax projections
  - Context trimming for token limits
  - **depends_on**: []
  - **parallel_with**: ["1.1"]

- [ ] **1.3** Create chat server actions
  - `actions/ai-chat.ts`
  - `streamChat()` - streaming response
  - `getSuggestedQuestions()` - contextual suggestions
  - **depends_on**: ["1.1", "1.2"]

- [ ] **1.4** Create chat interface component
  - `components/features/insights/chat-interface.tsx`
  - Message history display
  - Streaming response rendering
  - Suggested questions UI
  - **depends_on**: ["1.3"]

- [ ] **1.5** Create chat page
  - `app/(dashboard)/insights/chat/page.tsx`
  - Full-page chat experience
  - Disclaimer about not being professional advice
  - **depends_on**: ["1.4"]

---

## Task Group 2: Spending Analysis

**Assigned Agent:** `integration-engineer`

- [ ] **2.1** Create spending analyzer utility
  - `lib/ai/spending-analyzer.ts`
  - Category breakdown calculation
  - Month-over-month comparison
  - Savings rate calculation
  - **depends_on**: []

- [ ] **2.2** Create trend detection
  - Identify increasing/decreasing categories
  - Calculate percentage changes
  - Generate trend descriptions
  - **depends_on**: ["2.1"]

- [ ] **2.3** Create anomaly detection
  - Unusual transaction amounts
  - New merchant large purchases
  - New subscription detection
  - Missing expected transactions
  - **depends_on**: ["2.1"]
  - **parallel_with**: ["2.2"]

- [ ] **2.4** Create spending dashboard components
  - `components/features/insights/spending-dashboard.tsx`
  - Category breakdown chart
  - Trend badges
  - Anomaly alerts
  - **depends_on**: ["2.2", "2.3"]

---

## Task Group 3: Tax Optimization

**Assigned Agent:** `integration-engineer`

- [ ] **3.1** Create tax optimizer utility
  - `lib/ai/tax-optimizer.ts`
  - Retirement contribution opportunities
  - Deduction bunching analysis
  - Withholding adjustment calculations
  - **depends_on**: []

- [ ] **3.2** Create suggestion generation
  - IRA contribution suggestions
  - W4 adjustment recommendations
  - Estimated payment reminders
  - Tax debt strategy updates
  - **depends_on**: ["3.1"]

- [ ] **3.3** Create suggestion server actions
  - `actions/tax-suggestions.ts`
  - `getTaxSuggestions()` - generate all suggestions
  - Priority sorting
  - **depends_on**: ["3.2"]

- [ ] **3.4** Create tax suggestions UI
  - `components/features/insights/tax-suggestions.tsx`
  - Suggestion cards with priority badges
  - Action buttons/links
  - Potential savings display
  - **depends_on**: ["3.3"]

---

## Task Group 4: Monthly Summaries

**Assigned Agent:** `integration-engineer`

- [ ] **4.1** Create summary generator utility
  - `lib/ai/summary-generator.ts`
  - Financial snapshot calculation
  - Income and spending aggregation
  - Notable transaction selection
  - **depends_on**: []

- [ ] **4.2** Create AI narrative generation
  - Prompt for natural language summary
  - Use Haiku for efficiency
  - Incorporate key metrics
  - **depends_on**: ["4.1", "1.1"]

- [ ] **4.3** Create Inngest summary function
  - `inngest/functions/generate-monthly-summary.ts`
  - Cron job: 1st of each month at 6 AM
  - Process all users
  - Save summaries to database
  - **depends_on**: ["4.2"]

- [ ] **4.4** Create summary server actions
  - `actions/summaries.ts`
  - `getMonthlySummaries()` - list summaries
  - `getMonthlySummary(month)` - single summary
  - **depends_on**: ["4.3"]

- [ ] **4.5** Create summary UI components
  - `components/features/insights/monthly-summary.tsx`
  - Financial snapshot display
  - AI narrative section
  - Action items list
  - **depends_on**: ["4.4"]

---

## Task Group 5: Testing

**Assigned Agent:** `testing-engineer`

- [ ] **5.1** Test chat system
  - Verify streaming responses work
  - Test context injection accuracy
  - Verify no hallucinated numbers
  - **depends_on**: ["1.5"]

- [ ] **5.2** Test spending analysis
  - Verify category calculations
  - Test trend detection accuracy
  - Test anomaly detection
  - **depends_on**: ["2.4"]
  - **parallel_with**: ["5.1"]

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
  - **depends_on**: ["5.1", "5.2", "3.4", "4.5"]

---

## Completion Checklist

- [ ] Chat system with streaming responses
- [ ] Context injection working
- [ ] Spending analysis accurate
- [ ] Trend and anomaly detection working
- [ ] Tax suggestions generating
- [ ] Monthly summaries auto-generating
- [ ] All tests passing

---

## Parallel Execution Summary

### Dependency Graph

```
PHASE 1 (No dependencies - Maximum Parallelism):
├── 1.1 Create chat utility
├── 1.2 Create context builder
├── 2.1 Create spending analyzer utility
├── 3.1 Create tax optimizer utility
└── 4.1 Create summary generator utility

PHASE 2 (After Phase 1):
├── 1.3 Create chat server actions       ← depends_on: [1.1, 1.2]
├── 2.2 Create trend detection           ← depends_on: [2.1]
├── 2.3 Create anomaly detection         ← depends_on: [2.1]
├── 3.2 Create suggestion generation     ← depends_on: [3.1]
└── 4.2 Create AI narrative generation   ← depends_on: [4.1, 1.1]

PHASE 3 (After Phase 2):
├── 1.4 Create chat interface component  ← depends_on: [1.3]
├── 2.4 Create spending dashboard        ← depends_on: [2.2, 2.3]
├── 3.3 Create suggestion server actions ← depends_on: [3.2]
└── 4.3 Create Inngest summary function  ← depends_on: [4.2]

PHASE 4 (After Phase 3):
├── 1.5 Create chat page                 ← depends_on: [1.4]
├── 3.4 Create tax suggestions UI        ← depends_on: [3.3]
└── 4.4 Create summary server actions    ← depends_on: [4.3]

PHASE 5 (After Phase 4):
├── 4.5 Create summary UI components     ← depends_on: [4.4]
├── 5.1 Test chat system                 ← depends_on: [1.5]
└── 5.2 Test spending analysis           ← depends_on: [2.4]

PHASE 6 (Final):
└── 5.3 Manual verification              ← depends_on: [5.1, 5.2, 3.4, 4.5]
```

### Parallel Execution Waves

| Wave | Tasks (can run simultaneously) | Count |
| ---- | ------------------------------ | ----- |
| 1    | 1.1, 1.2, 2.1, 3.1, 4.1        | 5     |
| 2    | 1.3, 2.2, 2.3, 3.2, 4.2        | 5     |
| 3    | 1.4, 2.4, 3.3, 4.3             | 4     |
| 4    | 1.5, 3.4, 4.4                  | 3     |
| 5    | 4.5, 5.1, 5.2                  | 3     |
| 6    | 5.3                            | 1     |

### Critical Path

```
1.1 ──────────────────────┐
                          ├→ 1.3 → 1.4 → 1.5 → 5.1 ─────────────────┐
1.2 ──────────────────────┘                                          │
                                                                     │
2.1 → 2.2 + 2.3 → 2.4 → 5.2 ─────────────────────────────────────────┼→ 5.3
                                                                     │
3.1 → 3.2 → 3.3 → 3.4 ───────────────────────────────────────────────┤
                                                                     │
4.1 ──┐                                                              │
      ├→ 4.2 → 4.3 → 4.4 → 4.5 ──────────────────────────────────────┘
1.1 ──┘
```

**Critical Path Length**: 6 sequential phases (vs 21 tasks if sequential = 3.5x speedup potential)
