# Requirements: Cash Flow

## Initial Request

Build a cash flow forecasting system that learns recurring income and expense patterns, provides real-time balance projections, and answers "where will I be on the 15th?" at any point in the month.

## Product Context

### Mission Alignment
Addresses a core user pain point: no visibility into cash flow timing. Enables proactive financial management rather than reactive "check balance and hope."

### Roadmap Context
- Current Phase: Phase 3 (extended) - Cash Flow Forecasting
- Feature Priority: High - user-requested feature
- Related Features: Depends on Bank Integration; feeds Dashboard insights

### Technical Context
- Stack: Next.js 14, Supabase, TypeScript
- Data Source: Transaction history from Plaid sync
- Calculations: Pattern detection, date-based projections

## Clarification Q&A

No additional clarification needed - requirements defined during roadmap update.

## Visual Assets

No visual assets provided. Calendar-style visualization with income/expense overlays.

## Functional Requirements

### 18. Recurring Transaction Detection

1. **Pattern Analysis Engine**:
   - Analyze transaction history (3+ months)
   - Group by normalized merchant name
   - Detect frequency patterns: weekly, bi-weekly, semi-monthly, monthly, quarterly, annual
2. **Recurring Transaction Attributes**:
   - Merchant name
   - Category
   - Expected amount (average)
   - Amount variance (standard deviation)
   - Frequency (weekly, bi-weekly, monthly, etc.)
   - Expected day of month (or day of week for weekly)
   - Last occurrence date
   - Next expected date
   - Is income (boolean)
   - Is active (boolean - can be paused/stopped)
3. **Detection Criteria**:
   - Minimum 3 occurrences
   - Consistent timing (within 3 days variance)
   - Consistent amount (within 20% variance)
4. **Confidence Scoring**:
   - High: 6+ occurrences, <5% variance
   - Medium: 3-5 occurrences, <20% variance
   - Low: 3 occurrences, higher variance
5. **Manual Override**:
   - User can mark any transaction as recurring
   - User can edit expected amount/date
   - User can pause or stop tracking
6. **Income vs Expense Classification**:
   - Positive amounts = income
   - Detect paycheck patterns specifically
   - Flag large regular deposits (salary, freelance payments)

### 19. Cash Flow Calendar

1. **Calendar View**:
   - Monthly calendar layout
   - Current month default, navigate to future months
2. **Transaction Display**:
   - Expected income: green indicators
   - Expected expenses: red indicators
   - Actual (confirmed): solid color
   - Pending (expected): striped/faded
3. **Daily Details**:
   - Click day to see list of expected transactions
   - Show expected vs actual for past days
   - Running balance for each day
4. **Balance Projection Line**:
   - Overlay showing projected balance curve
   - Highlight when balance goes negative
   - Start from current actual balance
5. **Visual Indicators**:
   - Today marker
   - Paydays highlighted
   - Large bills (>$500) emphasized
6. **Missed/Late Detection**:
   - Show warning for expected transactions not yet seen
   - Flag transactions that arrived late or early

### 20. Month-End Forecasting Engine

1. **Current State Calculation**:
   - Current balance (sum of all connected accounts)
   - Or single account selection for focused view
2. **Future Projection Algorithm**:
   - Start with current balance
   - Add expected income by date
   - Subtract expected expenses by date
   - Calculate running balance for each future day
3. **Confidence Intervals**:
   - Use historical variance to show range
   - Best case: all income on time, expenses at minimum
   - Expected case: historical averages
   - Worst case: income late, expenses at maximum
4. **"Where Will I Be" Query**:
   - Input: target date
   - Output: projected balance (with confidence range)
   - Show breakdown of expected in/out between now and then
5. **Month-End Projection**:
   - Calculate balance for last day of month
   - Show month-to-date actuals + remaining projections
6. **Scenario Modeling**:
   - "What if this expense doesn't hit?"
   - "What if I get paid 2 days late?"
   - Adjust projections temporarily to explore

### 21. Cash Flow Dashboard

1. **Summary Widget** (for main dashboard):
   - Current total balance
   - Month-to-date income received
   - Month-to-date expenses paid
   - Remaining expected income
   - Remaining expected expenses
   - Projected month-end balance
2. **Quick Projection**:
   - "By the 15th: $X,XXX"
   - "By month-end: $X,XXX"
   - Color coding: green (positive), yellow (low), red (negative)
3. **Trend Indicator**:
   - Compared to last month same point
   - Arrow up/down with percentage
4. **Next Major Events**:
   - Next expected paycheck (date + amount)
   - Next large bill (date + amount)
   - Days until next paycheck
5. **Balance Trajectory Chart**:
   - Mini line chart showing next 30 days
   - Mark critical points (low balance, paydays)

### 22. Cash Flow Alerts

1. **Projected Negative Balance**:
   - Alert when projection shows balance going negative
   - Show date and amount of shortfall
   - Trigger threshold: balance < $0 (or user-configured buffer)
2. **Missed Expected Transaction**:
   - Expected income/expense didn't arrive on time
   - "Expected $3,500 paycheck on Dec 15, not yet received"
   - Trigger: 2+ days past expected date
3. **Unusual Variance**:
   - Transaction amount significantly different from expected
   - E.g., "Electric bill $245 vs expected $120"
   - Trigger: >30% variance from average
4. **Upcoming Large Expense**:
   - Reminder for large bills in next 7 days
   - Threshold: user-configurable (default $500)
5. **Low Balance Warning**:
   - Projected balance dropping below threshold
   - User-configurable threshold (default $500)
6. **Alert Delivery**:
   - In-app notifications (bell icon)
   - Dashboard prominence
   - Email optional (future enhancement)
7. **Alert Management**:
   - View all active alerts
   - Dismiss/acknowledge alerts
   - Snooze alerts

## Non-Functional Requirements

### Performance
- Recurring detection runs in < 5s on initial analysis
- Projection calculation < 500ms
- Calendar renders < 1s

### Accuracy
- Month-end predictions within 5% after 2 months of data
- Recurring detection catches 90%+ of patterns
- Track prediction accuracy over time

### Usability
- Calendar intuitive without instruction
- Projections clearly show confidence/uncertainty
- Alerts actionable, not noisy

## Integration Points

1. **Bank Integration**: Reads transaction data
2. **Dashboard**: Widgets on main dashboard
3. **Tax Debt Core**: Financial snapshot can reference cash flow
4. **AI Insights**: Cash flow feeds into recommendations

## Out of Scope

1. Bill pay/scheduling
2. Automatic transfers
3. SMS/push notifications (email only future enhancement)
4. Multi-currency
5. Budget enforcement/limits

## Dependencies

1. Bank Integration complete (transactions synced)
2. At least 3 months transaction history for pattern detection
3. Account balances available from Plaid

## Success Criteria

- [ ] System detects recurring transactions automatically
- [ ] User can view cash flow calendar with expected transactions
- [ ] Projections show balance for any future date
- [ ] Dashboard widget shows month-end projection
- [ ] Alerts trigger for negative balance projections
- [ ] Alerts trigger for missed expected transactions
- [ ] Predictions are within 5% accuracy after 2 months
- [ ] User can manually adjust/override recurring patterns

## Open Questions

None. Requirements complete and ready for specification.

## Next Steps

Ready to proceed to formal specification via `/create-spec`.

---

*This requirements document was created through lite shape-spec process, leveraging comprehensive product planning already completed.*
