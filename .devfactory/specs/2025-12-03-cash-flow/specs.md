# Technical Specification: Cash Flow

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cash Flow Module                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │    Recurring    │  │   Cash Flow     │  │  Projection │  │
│  │    Detection    │──▶   Calendar      │──▶   Engine    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│           │                    │                   │        │
│           ▼                    ▼                   ▼        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                     Alerts System                        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Transaction History (Plaid)                  │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
app/(dashboard)/
├── cash-flow/
│   ├── page.tsx                   # Cash flow calendar
│   └── recurring/page.tsx         # Manage recurring items

components/features/cash-flow/
├── recurring-detector.tsx
├── recurring-list.tsx
├── recurring-form.tsx
├── cash-flow-calendar.tsx
├── day-detail-panel.tsx
├── projection-chart.tsx
├── balance-trajectory.tsx
├── where-will-i-be.tsx
├── cash-flow-widget.tsx
├── alert-list.tsx
└── alert-card.tsx

lib/
├── cash-flow/
│   ├── recurring-detector.ts
│   ├── projection-engine.ts
│   └── alert-generator.ts

actions/
├── recurring.ts
├── cash-flow.ts
└── alerts.ts

inngest/functions/
├── detect-recurring.ts
└── generate-alerts.ts
```

## Recurring Detection Algorithm

```typescript
// lib/cash-flow/recurring-detector.ts

interface RecurringPattern {
  merchantName: string
  normalizedMerchant: string
  amount: number
  amountVariance: number
  frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'annual'
  expectedDay: number           // Day of month (1-31) or day of week (0-6)
  lastOccurrence: Date
  nextExpected: Date
  occurrenceCount: number
  confidence: 'high' | 'medium' | 'low'
  isIncome: boolean
  isActive: boolean
}

interface DetectionResult {
  patterns: RecurringPattern[]
  analyzed: number
  detected: number
}

export async function detectRecurringTransactions(
  userId: string,
  lookbackMonths: number = 6
): Promise<DetectionResult> {
  // Group transactions by normalized merchant
  const grouped = await groupByMerchant(userId, lookbackMonths)

  const patterns: RecurringPattern[] = []

  for (const [merchant, transactions] of Object.entries(grouped)) {
    // Need at least 3 occurrences
    if (transactions.length < 3) continue

    // Analyze timing patterns
    const timingPattern = analyzeTimingPattern(transactions)
    if (!timingPattern) continue

    // Analyze amount consistency
    const amountPattern = analyzeAmountPattern(transactions)

    // Calculate confidence
    const confidence = calculateConfidence(
      transactions.length,
      timingPattern.variance,
      amountPattern.variance
    )

    patterns.push({
      merchantName: transactions[0].merchant_name,
      normalizedMerchant: merchant,
      amount: amountPattern.average,
      amountVariance: amountPattern.variance,
      frequency: timingPattern.frequency,
      expectedDay: timingPattern.expectedDay,
      lastOccurrence: transactions[0].date,
      nextExpected: calculateNextExpected(timingPattern),
      occurrenceCount: transactions.length,
      confidence,
      isIncome: amountPattern.average > 0,
      isActive: true
    })
  }

  return {
    patterns,
    analyzed: Object.keys(grouped).length,
    detected: patterns.length
  }
}

function analyzeTimingPattern(transactions: Transaction[]): TimingPattern | null {
  const intervals = calculateIntervals(transactions)

  // Check for weekly (6-8 days)
  if (isWithinRange(intervals, 7, 1)) {
    return { frequency: 'weekly', variance: calcVariance(intervals, 7), expectedDay: getDayOfWeek(transactions) }
  }

  // Check for bi-weekly (13-15 days)
  if (isWithinRange(intervals, 14, 1)) {
    return { frequency: 'biweekly', variance: calcVariance(intervals, 14), expectedDay: getDayOfWeek(transactions) }
  }

  // Check for monthly (28-32 days)
  if (isWithinRange(intervals, 30, 3)) {
    return { frequency: 'monthly', variance: calcVariance(intervals, 30), expectedDay: getDayOfMonth(transactions) }
  }

  // Check for quarterly (85-95 days)
  if (isWithinRange(intervals, 90, 5)) {
    return { frequency: 'quarterly', variance: calcVariance(intervals, 90), expectedDay: getDayOfMonth(transactions) }
  }

  return null
}

function calculateConfidence(
  occurrences: number,
  timingVariance: number,
  amountVariance: number
): 'high' | 'medium' | 'low' {
  if (occurrences >= 6 && timingVariance < 0.05 && amountVariance < 0.05) {
    return 'high'
  }
  if (occurrences >= 3 && timingVariance < 0.2 && amountVariance < 0.2) {
    return 'medium'
  }
  return 'low'
}
```

## Projection Engine

```typescript
// lib/cash-flow/projection-engine.ts

interface ProjectionInput {
  currentBalance: number
  startDate: Date
  endDate: Date
  recurringItems: RecurringPattern[]
  pendingTransactions?: Transaction[]
}

interface DailyProjection {
  date: Date
  expectedIncome: number
  expectedExpenses: number
  transactions: ExpectedTransaction[]
  runningBalance: number
  confidence: 'high' | 'medium' | 'low'
}

interface ProjectionResult {
  projections: DailyProjection[]
  endBalance: number
  lowestBalance: number
  lowestBalanceDate: Date
  alerts: ProjectionAlert[]
}

export function generateProjections(input: ProjectionInput): ProjectionResult {
  const projections: DailyProjection[] = []
  let runningBalance = input.currentBalance
  let lowestBalance = runningBalance
  let lowestBalanceDate = input.startDate

  const alerts: ProjectionAlert[] = []
  const currentDate = new Date(input.startDate)

  while (currentDate <= input.endDate) {
    const dayTransactions = getExpectedTransactionsForDate(
      currentDate,
      input.recurringItems
    )

    const dayIncome = dayTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)

    const dayExpenses = dayTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    runningBalance = runningBalance + dayIncome - dayExpenses

    if (runningBalance < lowestBalance) {
      lowestBalance = runningBalance
      lowestBalanceDate = new Date(currentDate)
    }

    // Check for negative balance alert
    if (runningBalance < 0) {
      alerts.push({
        type: 'negative_balance',
        date: new Date(currentDate),
        amount: runningBalance,
        message: `Projected negative balance of $${Math.abs(runningBalance).toFixed(2)}`
      })
    }

    projections.push({
      date: new Date(currentDate),
      expectedIncome: dayIncome,
      expectedExpenses: dayExpenses,
      transactions: dayTransactions,
      runningBalance,
      confidence: calculateDayConfidence(dayTransactions)
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return {
    projections,
    endBalance: runningBalance,
    lowestBalance,
    lowestBalanceDate,
    alerts
  }
}

export function whereWillIBe(
  currentBalance: number,
  targetDate: Date,
  recurringItems: RecurringPattern[]
): BalanceProjection {
  const result = generateProjections({
    currentBalance,
    startDate: new Date(),
    endDate: targetDate,
    recurringItems
  })

  const targetProjection = result.projections.find(
    p => p.date.toDateString() === targetDate.toDateString()
  )

  // Calculate confidence intervals
  const variance = calculateHistoricalVariance(recurringItems)

  return {
    expectedBalance: targetProjection?.runningBalance ?? currentBalance,
    bestCase: targetProjection ? targetProjection.runningBalance + variance : currentBalance,
    worstCase: targetProjection ? targetProjection.runningBalance - variance : currentBalance,
    confidence: targetProjection?.confidence ?? 'low',
    transactionsBetween: result.projections.flatMap(p => p.transactions)
  }
}
```

## Cash Flow Calendar Component

```typescript
// components/features/cash-flow/cash-flow-calendar.tsx

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isPayday: boolean
  expectedIncome: number
  expectedExpenses: number
  confirmedIncome: number
  confirmedExpenses: number
  runningBalance: number
  hasLargeBill: boolean
}

export function CashFlowCalendar({
  month,
  projections,
  recurringItems,
  onDayClick
}: CashFlowCalendarProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} className="text-center text-sm text-muted-foreground py-2">
          {day}
        </div>
      ))}

      {/* Calendar days */}
      {calendarDays.map(day => (
        <CalendarDayCell
          key={day.date.toISOString()}
          day={day}
          onClick={() => onDayClick(day)}
        />
      ))}
    </div>
  )
}

function CalendarDayCell({ day, onClick }: { day: CalendarDay; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 min-h-[80px] border rounded-lg text-left",
        day.isToday && "ring-2 ring-primary",
        day.isPayday && "bg-green-50 dark:bg-green-900/20",
        !day.isCurrentMonth && "opacity-50"
      )}
    >
      <div className="font-medium">{day.date.getDate()}</div>

      {day.expectedIncome > 0 && (
        <div className="flex items-center text-xs text-green-600">
          <ArrowUpIcon className="h-3 w-3 mr-1" />
          ${formatCompact(day.expectedIncome)}
        </div>
      )}

      {day.expectedExpenses > 0 && (
        <div className="flex items-center text-xs text-red-600">
          <ArrowDownIcon className="h-3 w-3 mr-1" />
          ${formatCompact(day.expectedExpenses)}
        </div>
      )}

      {day.hasLargeBill && (
        <AlertCircleIcon className="h-3 w-3 text-yellow-500" />
      )}
    </button>
  )
}
```

## Dashboard Widget

```typescript
// components/features/cash-flow/cash-flow-widget.tsx

interface CashFlowWidgetProps {
  currentBalance: number
  monthToDateIncome: number
  monthToDateExpenses: number
  remainingIncome: number
  remainingExpenses: number
  projectedMonthEnd: number
  nextPayday: { date: Date; amount: number } | null
  nextLargeBill: { date: Date; amount: number; name: string } | null
}

export function CashFlowWidget(props: CashFlowWidgetProps) {
  const balanceColor = props.projectedMonthEnd >= 0
    ? props.projectedMonthEnd > 500 ? 'text-green-500' : 'text-yellow-500'
    : 'text-red-500'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Balance */}
        <div>
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-bold">${formatCurrency(props.currentBalance)}</p>
        </div>

        {/* Month Progress */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Income (MTD)</p>
            <p className="text-green-600">+${formatCurrency(props.monthToDateIncome)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Expenses (MTD)</p>
            <p className="text-red-600">-${formatCurrency(props.monthToDateExpenses)}</p>
          </div>
        </div>

        {/* Projections */}
        <div>
          <p className="text-sm text-muted-foreground">Projected Month-End</p>
          <p className={cn("text-xl font-semibold", balanceColor)}>
            ${formatCurrency(props.projectedMonthEnd)}
          </p>
        </div>

        {/* Next Events */}
        {props.nextPayday && (
          <div className="flex items-center text-sm">
            <CalendarIcon className="h-4 w-4 mr-2 text-green-500" />
            <span>Next paycheck: {formatDate(props.nextPayday.date)} (+${formatCurrency(props.nextPayday.amount)})</span>
          </div>
        )}

        {props.nextLargeBill && (
          <div className="flex items-center text-sm">
            <CalendarIcon className="h-4 w-4 mr-2 text-red-500" />
            <span>{props.nextLargeBill.name}: {formatDate(props.nextLargeBill.date)} (-${formatCurrency(props.nextLargeBill.amount)})</span>
          </div>
        )}

        {/* Mini Chart */}
        <BalanceTrajectoryMini projections={next30DaysProjections} />
      </CardContent>
    </Card>
  )
}
```

## Alert System

```typescript
// lib/cash-flow/alert-generator.ts

type AlertType =
  | 'negative_balance'
  | 'low_balance'
  | 'missed_expected'
  | 'unusual_variance'
  | 'upcoming_large_expense'

interface CashFlowAlert {
  id: string
  userId: string
  type: AlertType
  priority: 'high' | 'medium' | 'low'
  title: string
  message: string
  date: Date
  amount?: number
  relatedTransactionId?: string
  dismissed: boolean
  dismissedAt?: Date
  createdAt: Date
}

export async function generateAlerts(userId: string): Promise<CashFlowAlert[]> {
  const alerts: CashFlowAlert[] = []

  // Get current state
  const balance = await getCurrentBalance(userId)
  const recurring = await getActiveRecurringItems(userId)
  const projections = generateProjections({
    currentBalance: balance,
    startDate: new Date(),
    endDate: addDays(new Date(), 30),
    recurringItems: recurring
  })

  // Check for negative balance projection
  const negativeDay = projections.projections.find(p => p.runningBalance < 0)
  if (negativeDay) {
    alerts.push({
      id: generateId(),
      userId,
      type: 'negative_balance',
      priority: 'high',
      title: 'Projected Negative Balance',
      message: `Your balance is projected to go negative on ${formatDate(negativeDay.date)}`,
      date: negativeDay.date,
      amount: negativeDay.runningBalance,
      dismissed: false,
      createdAt: new Date()
    })
  }

  // Check for low balance (user-configurable threshold, default $500)
  const threshold = await getUserAlertThreshold(userId) ?? 500
  const lowDay = projections.projections.find(p => p.runningBalance < threshold && p.runningBalance >= 0)
  if (lowDay) {
    alerts.push({
      id: generateId(),
      userId,
      type: 'low_balance',
      priority: 'medium',
      title: 'Low Balance Warning',
      message: `Balance projected to drop below $${threshold} on ${formatDate(lowDay.date)}`,
      date: lowDay.date,
      amount: lowDay.runningBalance,
      dismissed: false,
      createdAt: new Date()
    })
  }

  // Check for missed expected transactions
  const overdue = await getOverdueExpectedTransactions(userId)
  for (const tx of overdue) {
    alerts.push({
      id: generateId(),
      userId,
      type: 'missed_expected',
      priority: tx.amount > 1000 ? 'high' : 'medium',
      title: 'Expected Transaction Missing',
      message: `Expected ${tx.isIncome ? 'income' : 'expense'} of $${Math.abs(tx.amount)} from ${tx.merchantName} was due on ${formatDate(tx.expectedDate)}`,
      date: tx.expectedDate,
      amount: tx.amount,
      dismissed: false,
      createdAt: new Date()
    })
  }

  // Check for upcoming large expenses (next 7 days)
  const upcomingLarge = projections.projections
    .filter(p => isWithinDays(p.date, 7))
    .flatMap(p => p.transactions)
    .filter(t => t.amount < -500)

  for (const tx of upcomingLarge) {
    alerts.push({
      id: generateId(),
      userId,
      type: 'upcoming_large_expense',
      priority: 'low',
      title: 'Large Expense Coming Up',
      message: `${tx.merchantName}: $${Math.abs(tx.amount)} due on ${formatDate(tx.expectedDate)}`,
      date: tx.expectedDate,
      amount: tx.amount,
      dismissed: false,
      createdAt: new Date()
    })
  }

  return alerts
}
```

## Server Actions

```typescript
// actions/recurring.ts
'use server'

export async function getRecurringItems(): Promise<RecurringTransaction[]> {
  const session = await getSession()
  if (!session) throw new AuthError()

  return await db
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', session.user.id)
    .order('next_expected', { ascending: true })
}

export async function updateRecurringItem(
  id: string,
  data: Partial<RecurringTransaction>
): Promise<void> {
  const session = await getSession()
  if (!session) throw new AuthError()

  await db
    .from('recurring_transactions')
    .update(data)
    .eq('id', id)
    .eq('user_id', session.user.id)
}

export async function pauseRecurringItem(id: string): Promise<void> {
  return updateRecurringItem(id, { is_active: false })
}

export async function runRecurringDetection(): Promise<DetectionResult> {
  const session = await getSession()
  if (!session) throw new AuthError()

  const result = await detectRecurringTransactions(session.user.id)

  // Save detected patterns
  for (const pattern of result.patterns) {
    await db
      .from('recurring_transactions')
      .upsert({
        user_id: session.user.id,
        merchant_name: pattern.merchantName,
        normalized_merchant: pattern.normalizedMerchant,
        amount: pattern.amount,
        frequency: pattern.frequency,
        expected_day: pattern.expectedDay,
        is_income: pattern.isIncome,
        confidence: pattern.confidence,
        occurrence_count: pattern.occurrenceCount,
        last_occurrence: pattern.lastOccurrence,
        next_expected: pattern.nextExpected,
        is_active: true
      }, { onConflict: 'user_id,normalized_merchant' })
  }

  return result
}

// actions/cash-flow.ts
'use server'

export async function getCashFlowProjection(
  startDate: Date,
  endDate: Date
): Promise<ProjectionResult> {
  const session = await getSession()
  if (!session) throw new AuthError()

  const balance = await getCurrentBalance(session.user.id)
  const recurring = await db
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('is_active', true)

  return generateProjections({
    currentBalance: balance,
    startDate,
    endDate,
    recurringItems: recurring.data ?? []
  })
}

export async function getBalanceOnDate(targetDate: Date): Promise<BalanceProjection> {
  const session = await getSession()
  if (!session) throw new AuthError()

  const balance = await getCurrentBalance(session.user.id)
  const recurring = await db
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('is_active', true)

  return whereWillIBe(balance, targetDate, recurring.data ?? [])
}
```

## Inngest Functions

```typescript
// inngest/functions/detect-recurring.ts
import { inngest } from '../client'

export const detectRecurringFunction = inngest.createFunction(
  { id: 'detect-recurring-transactions' },
  { event: 'plaid/sync.completed' },
  async ({ event, step }) => {
    const { userId } = event.data

    const result = await step.run('detect-patterns', async () => {
      return await detectRecurringTransactions(userId)
    })

    await step.run('save-patterns', async () => {
      // Save to database
      for (const pattern of result.patterns) {
        await savePattern(userId, pattern)
      }
    })

    return { detected: result.detected }
  }
)

// inngest/functions/generate-alerts.ts
export const generateAlertsFunction = inngest.createFunction(
  { id: 'generate-cash-flow-alerts' },
  { cron: '0 8 * * *' }, // Daily at 8 AM
  async ({ step }) => {
    const users = await step.run('get-users', async () => {
      return await getUsersWithRecurring()
    })

    for (const user of users) {
      await step.run(`generate-alerts-${user.id}`, async () => {
        const alerts = await generateAlerts(user.id)
        await saveAlerts(alerts)
      })
    }

    return { processed: users.length }
  }
)
```

## API Routes

```typescript
// app/api/cash-flow/projection/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const targetDate = searchParams.get('date')

  if (targetDate) {
    const projection = await getBalanceOnDate(new Date(targetDate))
    return NextResponse.json(projection)
  }

  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + 1)

  const projections = await getCashFlowProjection(startDate, endDate)
  return NextResponse.json(projections)
}
```

## Key Components Summary

| Component | Purpose |
|-----------|---------|
| `recurring-detector.ts` | Pattern analysis for recurring transactions |
| `projection-engine.ts` | Future balance calculations |
| `alert-generator.ts` | Cash flow alert creation |
| `cash-flow-calendar.tsx` | Monthly calendar view |
| `cash-flow-widget.tsx` | Dashboard summary widget |
| `where-will-i-be.tsx` | Date-based balance query |
| `balance-trajectory.tsx` | 30-day projection chart |
