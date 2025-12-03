# Implementation Tasks: Cash Flow

## Task Groups Overview

| Group | Name | Tasks | Dependencies |
|-------|------|-------|--------------|
| 1 | Recurring Detection | 5 | Bank Integration |
| 2 | Projection Engine | 4 | Group 1 |
| 3 | Cash Flow Calendar | 5 | Group 2 |
| 4 | Dashboard Integration | 4 | Group 2 |
| 5 | Alert System | 5 | Group 2 |
| 6 | Testing | 3 | All |

---

## Task Group 1: Recurring Detection

**Assigned Agent:** `integration-engineer`

- [ ] **1.1** Create recurring detection utility
  - `lib/cash-flow/recurring-detector.ts`
  - Group transactions by normalized merchant
  - Analyze timing patterns (weekly, bi-weekly, monthly)
  - Calculate amount variance

- [ ] **1.2** Create pattern analysis functions
  - Interval calculation between transactions
  - Frequency detection (weekly=7±1, biweekly=14±1, monthly=30±3)
  - Expected day calculation (day of month or day of week)

- [ ] **1.3** Create confidence scoring
  - High: 6+ occurrences, <5% timing/amount variance
  - Medium: 3-5 occurrences, <20% variance
  - Low: 3 occurrences, higher variance

- [ ] **1.4** Create recurring transaction server actions
  - `actions/recurring.ts`
  - `getRecurringItems()` - list all recurring
  - `updateRecurringItem()` - edit expected amount/date
  - `pauseRecurringItem()` - temporarily disable
  - `runRecurringDetection()` - trigger analysis

- [ ] **1.5** Create Inngest function for auto-detection
  - `inngest/functions/detect-recurring.ts`
  - Trigger on `plaid/sync.completed`
  - Save detected patterns to database
  - Update existing patterns if merchant matches

---

## Task Group 2: Projection Engine

**Assigned Agent:** `integration-engineer`

- [ ] **2.1** Create projection engine utility
  - `lib/cash-flow/projection-engine.ts`
  - Generate daily projections from start to end date
  - Calculate running balance per day
  - Track lowest balance and date

- [ ] **2.2** Create "where will I be" function
  - Input: current balance, target date, recurring items
  - Output: projected balance with confidence intervals
  - Best case / expected / worst case

- [ ] **2.3** Create helper functions
  - `getExpectedTransactionsForDate()` - recurring items due on date
  - `calculateNextExpected()` - next occurrence based on frequency
  - `calculateHistoricalVariance()` - for confidence intervals

- [ ] **2.4** Create cash flow server actions
  - `actions/cash-flow.ts`
  - `getCashFlowProjection(startDate, endDate)`
  - `getBalanceOnDate(date)`
  - `getCurrentBalance()` - sum of account balances

---

## Task Group 3: Cash Flow Calendar

**Assigned Agent:** `ui-designer`

- [ ] **3.1** Create calendar component
  - `components/features/cash-flow/cash-flow-calendar.tsx`
  - Monthly grid layout
  - Navigate between months
  - Today marker

- [ ] **3.2** Create calendar day cell component
  - Income indicator (green up arrow)
  - Expense indicator (red down arrow)
  - Payday highlighting
  - Large bill warning icon

- [ ] **3.3** Create day detail panel
  - `components/features/cash-flow/day-detail-panel.tsx`
  - Slide-out panel on day click
  - List of expected transactions
  - Running balance display

- [ ] **3.4** Create cash flow page
  - `app/(dashboard)/cash-flow/page.tsx`
  - Calendar view
  - Sidebar with projections
  - "Where will I be" quick query

- [ ] **3.5** Create recurring management page
  - `app/(dashboard)/cash-flow/recurring/page.tsx`
  - List all detected recurring items
  - Edit/pause/resume actions
  - Re-run detection button

---

## Task Group 4: Dashboard Integration

**Assigned Agent:** `ui-designer`

- [ ] **4.1** Create cash flow widget
  - `components/features/cash-flow/cash-flow-widget.tsx`
  - Current balance
  - Month-to-date income/expenses
  - Projected month-end balance

- [ ] **4.2** Create balance trajectory chart
  - `components/features/cash-flow/balance-trajectory.tsx`
  - Mini line chart (next 30 days)
  - Mark low points
  - Mark paydays

- [ ] **4.3** Create quick projection display
  - "By the 15th: $X,XXX"
  - "By month-end: $X,XXX"
  - Color coding (green/yellow/red)

- [ ] **4.4** Create next events display
  - Next expected paycheck
  - Next large bill (>$500)
  - Days until next paycheck

---

## Task Group 5: Alert System

**Assigned Agent:** `integration-engineer`

- [ ] **5.1** Create alert generator utility
  - `lib/cash-flow/alert-generator.ts`
  - Check for negative balance projections
  - Check for low balance (configurable threshold)
  - Check for missed expected transactions
  - Check for unusual variance

- [ ] **5.2** Create alert types
  - `negative_balance` - balance going negative
  - `low_balance` - below threshold (default $500)
  - `missed_expected` - overdue recurring transaction
  - `unusual_variance` - amount significantly different
  - `upcoming_large_expense` - large bill in 7 days

- [ ] **5.3** Create alert server actions
  - `actions/alerts.ts`
  - `getActiveAlerts()`
  - `dismissAlert(id)`
  - `snoozeAlert(id, until)`
  - `updateAlertThreshold(amount)`

- [ ] **5.4** Create Inngest function for daily alerts
  - `inngest/functions/generate-alerts.ts`
  - Run daily at 8 AM
  - Process all users with recurring items
  - Create/update alerts

- [ ] **5.5** Create alert display components
  - `components/features/cash-flow/alert-list.tsx`
  - `components/features/cash-flow/alert-card.tsx`
  - Priority indicators (high/medium/low)
  - Dismiss/snooze actions
  - Link to relevant dates

---

## Task Group 6: Testing

**Assigned Agent:** `testing-engineer`

- [ ] **6.1** Test recurring detection
  - Test with mock transaction data
  - Verify weekly, bi-weekly, monthly detection
  - Test confidence scoring accuracy

- [ ] **6.2** Test projection engine
  - Verify balance calculations
  - Test "where will I be" accuracy
  - Test edge cases (end of month, leap year)

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

---

## Completion Checklist

- [ ] Recurring detection working
- [ ] Projections calculating correctly
- [ ] Calendar displays expected transactions
- [ ] Dashboard widget functional
- [ ] Alerts generating and displaying
- [ ] All tests passing
