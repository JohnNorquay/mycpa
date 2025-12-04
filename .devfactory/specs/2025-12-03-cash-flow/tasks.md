# Implementation Tasks: Cash Flow

## Task Groups Overview

| Group | Name                  | Tasks | Dependencies     |
| ----- | --------------------- | ----- | ---------------- |
| 1     | Recurring Detection   | 5     | Bank Integration |
| 2     | Projection Engine     | 4     | Group 1          |
| 3     | Cash Flow Calendar    | 5     | Group 2          |
| 4     | Dashboard Integration | 4     | Group 2          |
| 5     | Alert System          | 5     | Group 2          |
| 6     | Testing               | 3     | All              |

---

## Task Group 1: Recurring Detection

**Assigned Agent:** `integration-engineer`

- [ ] **1.1** Create recurring detection utility
  - `lib/cash-flow/recurring-detector.ts`
  - Group transactions by normalized merchant
  - Analyze timing patterns (weekly, bi-weekly, monthly)
  - Calculate amount variance
  - **depends_on**: []

- [ ] **1.2** Create pattern analysis functions
  - Interval calculation between transactions
  - Frequency detection (weekly=7±1, biweekly=14±1, monthly=30±3)
  - Expected day calculation (day of month or day of week)
  - **depends_on**: ["1.1"]

- [ ] **1.3** Create confidence scoring
  - High: 6+ occurrences, <5% timing/amount variance
  - Medium: 3-5 occurrences, <20% variance
  - Low: 3 occurrences, higher variance
  - **depends_on**: ["1.2"]

- [ ] **1.4** Create recurring transaction server actions
  - `actions/recurring.ts`
  - `getRecurringItems()` - list all recurring
  - `updateRecurringItem()` - edit expected amount/date
  - `pauseRecurringItem()` - temporarily disable
  - `runRecurringDetection()` - trigger analysis
  - **depends_on**: ["1.3"]

- [ ] **1.5** Create Inngest function for auto-detection
  - `inngest/functions/detect-recurring.ts`
  - Trigger on `plaid/sync.completed`
  - Save detected patterns to database
  - Update existing patterns if merchant matches
  - **depends_on**: ["1.4"]

---

## Task Group 2: Projection Engine

**Assigned Agent:** `integration-engineer`

- [ ] **2.1** Create projection engine utility
  - `lib/cash-flow/projection-engine.ts`
  - Generate daily projections from start to end date
  - Calculate running balance per day
  - Track lowest balance and date
  - **depends_on**: ["1.4"]

- [ ] **2.2** Create "where will I be" function
  - Input: current balance, target date, recurring items
  - Output: projected balance with confidence intervals
  - Best case / expected / worst case
  - **depends_on**: ["2.1"]

- [ ] **2.3** Create helper functions
  - `getExpectedTransactionsForDate()` - recurring items due on date
  - `calculateNextExpected()` - next occurrence based on frequency
  - `calculateHistoricalVariance()` - for confidence intervals
  - **depends_on**: ["2.1"]
  - **parallel_with**: ["2.2"]

- [ ] **2.4** Create cash flow server actions
  - `actions/cash-flow.ts`
  - `getCashFlowProjection(startDate, endDate)`
  - `getBalanceOnDate(date)`
  - `getCurrentBalance()` - sum of account balances
  - **depends_on**: ["2.2", "2.3"]

---

## Task Group 3: Cash Flow Calendar

**Assigned Agent:** `ui-designer`

- [ ] **3.1** Create calendar component
  - `components/features/cash-flow/cash-flow-calendar.tsx`
  - Monthly grid layout
  - Navigate between months
  - Today marker
  - **depends_on**: ["2.4"]

- [ ] **3.2** Create calendar day cell component
  - Income indicator (green up arrow)
  - Expense indicator (red down arrow)
  - Payday highlighting
  - Large bill warning icon
  - **depends_on**: ["3.1"]

- [ ] **3.3** Create day detail panel
  - `components/features/cash-flow/day-detail-panel.tsx`
  - Slide-out panel on day click
  - List of expected transactions
  - Running balance display
  - **depends_on**: ["3.1"]
  - **parallel_with**: ["3.2"]

- [ ] **3.4** Create cash flow page
  - `app/(dashboard)/cash-flow/page.tsx`
  - Calendar view
  - Sidebar with projections
  - "Where will I be" quick query
  - **depends_on**: ["3.2", "3.3"]

- [ ] **3.5** Create recurring management page
  - `app/(dashboard)/cash-flow/recurring/page.tsx`
  - List all detected recurring items
  - Edit/pause/resume actions
  - Re-run detection button
  - **depends_on**: ["1.4"]
  - **parallel_with**: ["3.1", "3.2", "3.3", "3.4"]

---

## Task Group 4: Dashboard Integration

**Assigned Agent:** `ui-designer`

- [ ] **4.1** Create cash flow widget
  - `components/features/cash-flow/cash-flow-widget.tsx`
  - Current balance
  - Month-to-date income/expenses
  - Projected month-end balance
  - **depends_on**: ["2.4"]

- [ ] **4.2** Create balance trajectory chart
  - `components/features/cash-flow/balance-trajectory.tsx`
  - Mini line chart (next 30 days)
  - Mark low points
  - Mark paydays
  - **depends_on**: ["2.4"]
  - **parallel_with**: ["4.1"]

- [ ] **4.3** Create quick projection display
  - "By the 15th: $X,XXX"
  - "By month-end: $X,XXX"
  - Color coding (green/yellow/red)
  - **depends_on**: ["2.4"]
  - **parallel_with**: ["4.1", "4.2"]

- [ ] **4.4** Create next events display
  - Next expected paycheck
  - Next large bill (>$500)
  - Days until next paycheck
  - **depends_on**: ["2.4"]
  - **parallel_with**: ["4.1", "4.2", "4.3"]

---

## Task Group 5: Alert System

**Assigned Agent:** `integration-engineer`

- [ ] **5.1** Create alert generator utility
  - `lib/cash-flow/alert-generator.ts`
  - Check for negative balance projections
  - Check for low balance (configurable threshold)
  - Check for missed expected transactions
  - Check for unusual variance
  - **depends_on**: ["2.4"]

- [ ] **5.2** Create alert types
  - `negative_balance` - balance going negative
  - `low_balance` - below threshold (default $500)
  - `missed_expected` - overdue recurring transaction
  - `unusual_variance` - amount significantly different
  - `upcoming_large_expense` - large bill in 7 days
  - **depends_on**: ["5.1"]

- [ ] **5.3** Create alert server actions
  - `actions/alerts.ts`
  - `getActiveAlerts()`
  - `dismissAlert(id)`
  - `snoozeAlert(id, until)`
  - `updateAlertThreshold(amount)`
  - **depends_on**: ["5.2"]

- [ ] **5.4** Create Inngest function for daily alerts
  - `inngest/functions/generate-alerts.ts`
  - Run daily at 8 AM
  - Process all users with recurring items
  - Create/update alerts
  - **depends_on**: ["5.3"]

- [ ] **5.5** Create alert display components
  - `components/features/cash-flow/alert-list.tsx`
  - `components/features/cash-flow/alert-card.tsx`
  - Priority indicators (high/medium/low)
  - Dismiss/snooze actions
  - Link to relevant dates
  - **depends_on**: ["5.3"]
  - **parallel_with**: ["5.4"]

---

## Task Group 6: Testing

**Assigned Agent:** `testing-engineer`

- [ ] **6.1** Test recurring detection
  - Test with mock transaction data
  - Verify weekly, bi-weekly, monthly detection
  - Test confidence scoring accuracy
  - **depends_on**: ["1.5"]

- [ ] **6.2** Test projection engine
  - Verify balance calculations
  - Test "where will I be" accuracy
  - Test edge cases (end of month, leap year)
  - **depends_on**: ["2.4"]
  - **parallel_with**: ["6.1"]

- [ ] **6.3** Manual verification
  - [ ] Recurring transactions detected from history
  - [ ] Calendar shows expected income/expenses
  - [ ] Day details panel works
  - [ ] Month-end projection is reasonable
  - [ ] "Where will I be" returns correct projection
  - [ ] Alerts trigger for negative balance
  - [ ] Alerts trigger for missed transactions
  - [ ] Dashboard widget shows accurate data
  - [ ] User can edit/pause recurring items
  - **depends_on**: ["6.1", "6.2", "3.4", "4.4", "5.5"]

---

## Completion Checklist

- [ ] Recurring detection working
- [ ] Projections calculating correctly
- [ ] Calendar displays expected transactions
- [ ] Dashboard widget functional
- [ ] Alerts generating and displaying
- [ ] All tests passing

---

## Parallel Execution Summary

### Dependency Graph

```
PHASE 1 (No dependencies):
└── 1.1 Create recurring detection utility

PHASE 2 (After Phase 1):
└── 1.2 Create pattern analysis functions  ← depends_on: [1.1]

PHASE 3 (After Phase 2):
└── 1.3 Create confidence scoring          ← depends_on: [1.2]

PHASE 4 (After Phase 3):
└── 1.4 Create recurring server actions    ← depends_on: [1.3]

PHASE 5 (After Phase 4):
├── 1.5 Inngest auto-detection             ← depends_on: [1.4]
├── 2.1 Create projection engine           ← depends_on: [1.4]
└── 3.5 Recurring management page          ← depends_on: [1.4]

PHASE 6 (After Phase 5):
├── 2.2 "Where will I be" function         ← depends_on: [2.1]
├── 2.3 Helper functions                   ← depends_on: [2.1]
└── 6.1 Test recurring detection           ← depends_on: [1.5]

PHASE 7 (After Phase 6):
└── 2.4 Cash flow server actions           ← depends_on: [2.2, 2.3]

PHASE 8 (After Phase 7):
├── 3.1 Calendar component                 ← depends_on: [2.4]
├── 4.1 Cash flow widget                   ← depends_on: [2.4]
├── 4.2 Balance trajectory chart           ← depends_on: [2.4]
├── 4.3 Quick projection display           ← depends_on: [2.4]
├── 4.4 Next events display                ← depends_on: [2.4]
├── 5.1 Alert generator utility            ← depends_on: [2.4]
└── 6.2 Test projection engine             ← depends_on: [2.4]

PHASE 9 (After Phase 8):
├── 3.2 Calendar day cell component        ← depends_on: [3.1]
├── 3.3 Day detail panel                   ← depends_on: [3.1]
└── 5.2 Alert types                        ← depends_on: [5.1]

PHASE 10 (After Phase 9):
├── 3.4 Cash flow page                     ← depends_on: [3.2, 3.3]
└── 5.3 Alert server actions               ← depends_on: [5.2]

PHASE 11 (After Phase 10):
├── 5.4 Inngest daily alerts               ← depends_on: [5.3]
└── 5.5 Alert display components           ← depends_on: [5.3]

PHASE 12 (Final):
└── 6.3 Manual verification                ← depends_on: [6.1, 6.2, 3.4, 4.4, 5.5]
```

### Parallel Execution Waves

| Wave | Tasks (can run simultaneously)    | Count |
| ---- | --------------------------------- | ----- |
| 1    | 1.1                               | 1     |
| 2    | 1.2                               | 1     |
| 3    | 1.3                               | 1     |
| 4    | 1.4                               | 1     |
| 5    | 1.5, 2.1, 3.5                     | 3     |
| 6    | 2.2, 2.3, 6.1                     | 3     |
| 7    | 2.4                               | 1     |
| 8    | 3.1, 4.1, 4.2, 4.3, 4.4, 5.1, 6.2 | 7     |
| 9    | 3.2, 3.3, 5.2                     | 3     |
| 10   | 3.4, 5.3                          | 2     |
| 11   | 5.4, 5.5                          | 2     |
| 12   | 6.3                               | 1     |

### Critical Path

```
1.1 → 1.2 → 1.3 → 1.4 → 2.1 → 2.2/2.3 → 2.4 → 3.1 → 3.2/3.3 → 3.4 ─┐
                        ↓                   ↓                        │
                      1.5 → 6.1            5.1 → 5.2 → 5.3 → 5.5 ────┼→ 6.3
                                            ↓                        │
                                     4.1-4.4 (parallel) ─────────────┘
```

**Critical Path Length**: 12 sequential phases (vs 26 tasks if sequential = 2.2x speedup potential)

Note: This spec has a more linear dependency chain due to the nature of recurring detection → projection → visualization flow.
