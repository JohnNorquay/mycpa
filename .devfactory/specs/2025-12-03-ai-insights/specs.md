# Technical Specification: AI Insights

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Insights Module                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │    Q&A Chat     │  │    Spending     │  │    Tax      │  │
│  │    Interface    │  │    Analysis     │  │  Optimizer  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Monthly Summary Generator                   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│     Claude API (Haiku for quick, Sonnet for complex)        │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
app/(dashboard)/
├── insights/
│   ├── page.tsx                   # Insights dashboard
│   ├── chat/page.tsx              # Q&A chat interface
│   ├── spending/page.tsx          # Spending analysis
│   └── summaries/page.tsx         # Monthly summaries

components/features/insights/
├── chat-interface.tsx
├── chat-message.tsx
├── suggested-questions.tsx
├── spending-dashboard.tsx
├── spending-chart.tsx
├── category-breakdown.tsx
├── trend-badge.tsx
├── anomaly-alert.tsx
├── tax-suggestions.tsx
├── suggestion-card.tsx
├── monthly-summary.tsx
├── summary-card.tsx
└── action-items.tsx

lib/
├── ai/
│   ├── chat.ts
│   ├── context-builder.ts
│   ├── spending-analyzer.ts
│   ├── tax-optimizer.ts
│   └── summary-generator.ts

actions/
├── ai-chat.ts
├── spending-analysis.ts
├── tax-suggestions.ts
└── summaries.ts

inngest/functions/
├── generate-monthly-summary.ts
```

## Q&A Chat System

```typescript
// lib/ai/chat.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

interface ChatContext {
  profile: UserProfileSummary
  taxDebt?: TaxDebtSummary
  recentTransactions: TransactionSummary[]
  cashFlowProjection: CashFlowSummary
  taxProjection: TaxProjectionSummary
  recurringItems: RecurringSummary[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are a helpful financial assistant for CPA Bot. You have access to the user's financial data and can answer questions about their finances, taxes, and spending.

Important guidelines:
1. Be accurate - only reference data that exists in the context provided
2. Be helpful - explain financial concepts when relevant
3. Be clear about uncertainty - if you're not sure, say so
4. Always clarify that you're not providing professional tax advice
5. Format responses with markdown when helpful (lists, tables, bold for emphasis)
6. Keep responses concise but complete

When discussing amounts, always format them as currency ($X,XXX.XX).
When discussing dates, use readable formats (e.g., "December 15, 2024").`

export async function* streamChatResponse(
  messages: ChatMessage[],
  context: ChatContext
): AsyncGenerator<string> {
  const contextPrompt = buildContextPrompt(context)

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: SYSTEM_PROMPT + '\n\n' + contextPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}

function buildContextPrompt(context: ChatContext): string {
  return `Here is the user's current financial data:

## Profile
- Filing Status: ${context.profile.filingStatus}
- Location: ${context.profile.city}, ${context.profile.state}
- Household Size: ${context.profile.householdSize}

## Tax Debt
${context.taxDebt ? `
- Total Debt: $${context.taxDebt.totalDebt.toLocaleString()}
- Oldest Year: ${context.taxDebt.oldestYear}
- Collection Status: ${context.taxDebt.collectionStatus}
` : 'No tax debt on file.'}

## Recent Spending (Last 30 Days)
- Total Spent: $${context.recentTransactions.reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0).toLocaleString()}
- Top Categories: ${context.recentTransactions.slice(0, 3).map(c => c.category).join(', ')}

## Cash Flow
- Current Balance: $${context.cashFlowProjection.currentBalance.toLocaleString()}
- Projected Month-End: $${context.cashFlowProjection.projectedMonthEnd.toLocaleString()}
- Next Paycheck: ${context.cashFlowProjection.nextPayday ? `$${context.cashFlowProjection.nextPayday.amount.toLocaleString()} on ${context.cashFlowProjection.nextPayday.date}` : 'Not detected'}

## Tax Projection (${new Date().getFullYear()})
- Projected Federal Tax: $${context.taxProjection.federalTax.toLocaleString()}
- Projected State Tax: $${context.taxProjection.stateTax.toLocaleString()}
- Current Withholding: $${context.taxProjection.totalWithholding.toLocaleString()}
- Expected Refund/Owed: ${context.taxProjection.amountOwed > 0 ? `Owe $${context.taxProjection.amountOwed.toLocaleString()}` : `Refund $${Math.abs(context.taxProjection.amountOwed).toLocaleString()}`}

## Recurring Transactions
${context.recurringItems.map(r => `- ${r.merchantName}: $${Math.abs(r.amount).toLocaleString()} ${r.frequency}`).join('\n')}
`
}

export function getSuggestedQuestions(context: ChatContext): string[] {
  const suggestions: string[] = []

  // Cash flow questions
  if (context.cashFlowProjection.projectedMonthEnd < 500) {
    suggestions.push("Will I be okay financially by the end of the month?")
  }
  suggestions.push("When is my next paycheck coming?")

  // Tax questions
  if (context.taxProjection.amountOwed > 1000) {
    suggestions.push("How can I reduce the taxes I'll owe?")
  }
  suggestions.push("Should I itemize or take the standard deduction?")

  // Tax debt questions
  if (context.taxDebt) {
    suggestions.push("What are my options for resolving my tax debt?")
    suggestions.push("Should I consider an Offer in Compromise?")
  }

  // Spending questions
  suggestions.push("What am I spending the most money on?")
  suggestions.push("How does this month's spending compare to last month?")

  return suggestions.slice(0, 4)
}
```

## Context Builder

```typescript
// lib/ai/context-builder.ts

export async function buildChatContext(userId: string): Promise<ChatContext> {
  const [
    profile,
    taxDebt,
    transactions,
    cashFlow,
    taxProjection,
    recurring
  ] = await Promise.all([
    getUserProfileSummary(userId),
    getTaxDebtSummary(userId),
    getRecentTransactionsSummary(userId, 30),
    getCashFlowSummary(userId),
    getTaxProjectionSummary(userId),
    getRecurringSummary(userId)
  ])

  return {
    profile,
    taxDebt,
    recentTransactions: transactions,
    cashFlowProjection: cashFlow,
    taxProjection,
    recurringItems: recurring
  }
}

// Limit context size to stay under token limits
export function trimContext(context: ChatContext): ChatContext {
  return {
    ...context,
    recentTransactions: context.recentTransactions.slice(0, 50),
    recurringItems: context.recurringItems.slice(0, 20)
  }
}
```

## Spending Analyzer

```typescript
// lib/ai/spending-analyzer.ts

interface SpendingAnalysis {
  totalSpent: number
  totalIncome: number
  savingsRate: number
  categoryBreakdown: CategorySpend[]
  trends: SpendingTrend[]
  anomalies: SpendingAnomaly[]
  comparisonToPrevious: MonthComparison
}

interface CategorySpend {
  category: string
  amount: number
  percentage: number
  transactionCount: number
  trend: 'increasing' | 'decreasing' | 'stable'
  trendPercentage: number
}

interface SpendingTrend {
  category: string
  direction: 'up' | 'down'
  percentage: number
  description: string
}

interface SpendingAnomaly {
  type: 'unusual_amount' | 'new_merchant' | 'new_subscription' | 'missing_expected'
  transaction?: Transaction
  description: string
  severity: 'info' | 'warning' | 'alert'
}

export async function analyzeSpending(
  userId: string,
  month: Date
): Promise<SpendingAnalysis> {
  const startOfMonth = startOfMonth(month)
  const endOfMonth = endOfMonth(month)

  // Get transactions for current and previous month
  const currentMonthTx = await getTransactions(userId, startOfMonth, endOfMonth)
  const prevMonthTx = await getTransactions(userId,
    subMonths(startOfMonth, 1),
    subMonths(endOfMonth, 1)
  )

  // Calculate totals
  const totalSpent = currentMonthTx
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const totalIncome = currentMonthTx
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const savingsRate = totalIncome > 0
    ? (totalIncome - totalSpent) / totalIncome
    : 0

  // Category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(currentMonthTx, prevMonthTx)

  // Detect trends
  const trends = detectTrends(currentMonthTx, prevMonthTx)

  // Detect anomalies
  const anomalies = await detectAnomalies(userId, currentMonthTx)

  // Month over month comparison
  const comparisonToPrevious = compareMonths(currentMonthTx, prevMonthTx)

  return {
    totalSpent,
    totalIncome,
    savingsRate,
    categoryBreakdown,
    trends,
    anomalies,
    comparisonToPrevious
  }
}

function detectAnomalies(
  userId: string,
  transactions: Transaction[]
): SpendingAnomaly[] {
  const anomalies: SpendingAnomaly[] = []

  // Get historical averages by merchant
  const merchantAverages = await getMerchantAverages(userId)

  for (const tx of transactions) {
    const avg = merchantAverages[tx.normalized_merchant]

    // Check for unusual amount (>50% higher than average)
    if (avg && Math.abs(tx.amount) > avg.averageAmount * 1.5) {
      anomalies.push({
        type: 'unusual_amount',
        transaction: tx,
        description: `${tx.merchant_name} charge of $${Math.abs(tx.amount).toFixed(2)} is ${Math.round((Math.abs(tx.amount) / avg.averageAmount - 1) * 100)}% higher than your average of $${avg.averageAmount.toFixed(2)}`,
        severity: Math.abs(tx.amount) > avg.averageAmount * 2 ? 'warning' : 'info'
      })
    }

    // Check for new merchant with large amount
    if (!avg && Math.abs(tx.amount) > 100) {
      anomalies.push({
        type: 'new_merchant',
        transaction: tx,
        description: `First-time purchase at ${tx.merchant_name} for $${Math.abs(tx.amount).toFixed(2)}`,
        severity: 'info'
      })
    }
  }

  // Check for new recurring subscriptions
  const newSubscriptions = detectNewSubscriptions(transactions)
  for (const sub of newSubscriptions) {
    anomalies.push({
      type: 'new_subscription',
      transaction: sub,
      description: `Possible new subscription detected: ${sub.merchant_name} for $${Math.abs(sub.amount).toFixed(2)}/month`,
      severity: 'info'
    })
  }

  return anomalies
}
```

## Tax Optimizer

```typescript
// lib/ai/tax-optimizer.ts

interface TaxSuggestion {
  id: string
  type: 'retirement' | 'deduction' | 'withholding' | 'estimated' | 'debt'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  potentialSavings?: number
  deadline?: Date
  actionUrl?: string
}

export async function generateTaxSuggestions(userId: string): Promise<TaxSuggestion[]> {
  const suggestions: TaxSuggestion[] = []

  const profile = await getUserProfile(userId)
  const taxProjection = await getTaxProjection(userId)
  const deductions = await getDeductionSummary(userId)
  const taxDebt = await getTaxDebtSummary(userId)

  // Retirement contribution opportunity
  const iraLimit = 7000 // 2024 limit (8000 if 50+)
  const currentContributions = await getIRAContributions(userId)
  const remainingIRARoom = iraLimit - currentContributions

  if (remainingIRARoom > 0 && taxProjection.marginalRate >= 0.22) {
    const potentialSavings = remainingIRARoom * taxProjection.marginalRate
    suggestions.push({
      id: 'ira-contribution',
      type: 'retirement',
      priority: 'high',
      title: 'IRA Contribution Opportunity',
      description: `You can still contribute $${remainingIRARoom.toLocaleString()} to a Traditional IRA before April 15. This could reduce your taxes by approximately $${potentialSavings.toLocaleString()}.`,
      potentialSavings,
      deadline: new Date(new Date().getFullYear() + 1, 3, 15), // April 15 next year
      actionUrl: '/tax-center/retirement'
    })
  }

  // Deduction bunching
  if (deductions.itemizedAdvantage > -2000 && deductions.itemizedAdvantage < 0) {
    suggestions.push({
      id: 'deduction-bunching',
      type: 'deduction',
      priority: 'medium',
      title: 'Consider Bunching Deductions',
      description: `You're $${Math.abs(deductions.itemizedAdvantage).toLocaleString()} short of benefiting from itemizing. Consider bunching two years of charitable donations into one year to exceed the standard deduction.`,
      actionUrl: '/tax-center/deductions'
    })
  }

  // Withholding adjustment
  if (taxProjection.amountOwed > 2000) {
    const payPeriodsRemaining = estimatePayPeriodsRemaining()
    const adjustmentPerPaycheck = Math.ceil(taxProjection.amountOwed / payPeriodsRemaining)

    suggestions.push({
      id: 'withholding-increase',
      type: 'withholding',
      priority: 'high',
      title: 'Increase Your Withholding',
      description: `You're projected to owe $${taxProjection.amountOwed.toLocaleString()} at tax time. Consider increasing your W-4 withholding by $${adjustmentPerPaycheck} per paycheck to avoid a large bill.`,
      actionUrl: '/tax-center/estimated-tax'
    })
  } else if (taxProjection.amountOwed < -3000) {
    suggestions.push({
      id: 'withholding-decrease',
      type: 'withholding',
      priority: 'low',
      title: 'Reduce Your Withholding',
      description: `You're on track for a $${Math.abs(taxProjection.amountOwed).toLocaleString()} refund. Consider adjusting your W-4 to keep more money in each paycheck instead of giving the IRS an interest-free loan.`,
      actionUrl: '/tax-center/estimated-tax'
    })
  }

  // Estimated payment reminder
  const nextEstimatedDue = getNextEstimatedPaymentDate()
  if (nextEstimatedDue && taxProjection.income1099 > 5000) {
    const daysUntilDue = differenceInDays(nextEstimatedDue, new Date())
    if (daysUntilDue <= 30) {
      suggestions.push({
        id: 'estimated-payment-due',
        type: 'estimated',
        priority: 'high',
        title: 'Estimated Tax Payment Due Soon',
        description: `Your Q${getQuarter(nextEstimatedDue)} estimated tax payment is due ${formatDate(nextEstimatedDue)}. Based on your 1099 income, consider paying approximately $${calculateQuarterlyPayment(taxProjection).toLocaleString()}.`,
        deadline: nextEstimatedDue,
        actionUrl: '/tax-center/estimated-tax'
      })
    }
  }

  // Tax debt strategy check
  if (taxDebt && taxDebt.totalDebt > 10000) {
    suggestions.push({
      id: 'tax-debt-review',
      type: 'debt',
      priority: 'medium',
      title: 'Review Your Tax Debt Strategy',
      description: `With $${taxDebt.totalDebt.toLocaleString()} in tax debt, make sure you're using the best resolution strategy. The OIC calculator can help determine if you qualify for a settlement.`,
      actionUrl: '/tax-debt/compare'
    })
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}
```

## Monthly Summary Generator

```typescript
// lib/ai/summary-generator.ts

interface MonthlySummary {
  id: string
  userId: string
  month: Date
  generatedAt: Date

  // Financial snapshot
  startingBalance: number
  endingBalance: number
  netChange: number

  // Income
  totalIncome: number
  incomeBySource: Record<string, number>

  // Spending
  totalSpent: number
  topCategories: { category: string; amount: number }[]

  // Notable items
  notableTransactions: Transaction[]
  anomalies: SpendingAnomaly[]

  // Cash flow
  cashFlowHealth: 'positive' | 'neutral' | 'negative'

  // Tax status
  taxProjection: { federalOwed: number; stateOwed: number }

  // Tax debt (if applicable)
  taxDebtProgress?: { paymentsMade: number; balanceChange: number }

  // AI narrative
  narrative: string

  // Action items
  actionItems: string[]
}

export async function generateMonthlySummary(
  userId: string,
  month: Date
): Promise<MonthlySummary> {
  // Gather all data
  const [
    balances,
    transactions,
    taxProjection,
    taxDebt,
    recurring
  ] = await Promise.all([
    getBalanceHistory(userId, month),
    getMonthTransactions(userId, month),
    getTaxProjectionSummary(userId),
    getTaxDebtSummary(userId),
    getRecurringSummary(userId)
  ])

  const spending = await analyzeSpending(userId, month)

  // Calculate financial snapshot
  const startingBalance = balances.startOfMonth
  const endingBalance = balances.endOfMonth
  const netChange = endingBalance - startingBalance

  // Income breakdown
  const incomeTransactions = transactions.filter(t => t.amount > 0)
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
  const incomeBySource = groupByCategory(incomeTransactions)

  // Top spending categories
  const topCategories = spending.categoryBreakdown.slice(0, 5)

  // Notable transactions
  const notableTransactions = transactions
    .filter(t => Math.abs(t.amount) > 500)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 5)

  // Cash flow health
  const cashFlowHealth = netChange > 500 ? 'positive'
    : netChange < -500 ? 'negative'
    : 'neutral'

  // Generate AI narrative
  const narrative = await generateNarrative({
    month,
    totalIncome,
    totalSpent: spending.totalSpent,
    netChange,
    topCategories,
    anomalies: spending.anomalies,
    cashFlowHealth,
    taxProjection,
    taxDebt
  })

  // Generate action items
  const actionItems = generateActionItems({
    cashFlowHealth,
    taxProjection,
    taxDebt,
    anomalies: spending.anomalies
  })

  return {
    id: generateId(),
    userId,
    month,
    generatedAt: new Date(),
    startingBalance,
    endingBalance,
    netChange,
    totalIncome,
    incomeBySource,
    totalSpent: spending.totalSpent,
    topCategories,
    notableTransactions,
    anomalies: spending.anomalies,
    cashFlowHealth,
    taxProjection: {
      federalOwed: taxProjection.amountOwed,
      stateOwed: taxProjection.stateOwed
    },
    taxDebtProgress: taxDebt ? {
      paymentsMade: await getDebtPaymentsForMonth(userId, month),
      balanceChange: await getDebtBalanceChange(userId, month)
    } : undefined,
    narrative,
    actionItems
  }
}

async function generateNarrative(data: NarrativeInput): Promise<string> {
  const prompt = `Write a brief, friendly financial summary for ${format(data.month, 'MMMM yyyy')}.

Key facts:
- Total income: $${data.totalIncome.toLocaleString()}
- Total spent: $${data.totalSpent.toLocaleString()}
- Net change: ${data.netChange >= 0 ? '+' : ''}$${data.netChange.toLocaleString()}
- Top spending: ${data.topCategories.map(c => `${c.category} ($${c.amount.toLocaleString()})`).join(', ')}
- Cash flow health: ${data.cashFlowHealth}
${data.anomalies.length > 0 ? `- Notable: ${data.anomalies[0].description}` : ''}
${data.taxProjection.federalOwed > 0 ? `- Tax outlook: May owe $${data.taxProjection.federalOwed.toLocaleString()}` : `- Tax outlook: On track for $${Math.abs(data.taxProjection.federalOwed).toLocaleString()} refund`}

Write 2-3 sentences summarizing the month in a helpful, conversational tone. Be specific with numbers. If there are concerns, mention them gently.`

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
```

## Inngest Summary Function

```typescript
// inngest/functions/generate-monthly-summary.ts
import { inngest } from '../client'

export const generateMonthlySummaryFunction = inngest.createFunction(
  {
    id: 'generate-monthly-summary',
    throttle: { limit: 100, period: '1h' }
  },
  { cron: '0 6 1 * *' }, // 6 AM on the 1st of each month
  async ({ step }) => {
    const previousMonth = subMonths(new Date(), 1)

    // Get all users
    const users = await step.run('get-users', async () => {
      return await getAllActiveUsers()
    })

    // Generate summaries
    for (const user of users) {
      await step.run(`generate-${user.id}`, async () => {
        const summary = await generateMonthlySummary(user.id, previousMonth)
        await saveMonthlySummary(summary)
      })
    }

    return { generated: users.length, month: format(previousMonth, 'yyyy-MM') }
  }
)
```

## Server Actions

```typescript
// actions/ai-chat.ts
'use server'

export async function streamChat(
  messages: ChatMessage[]
): AsyncGenerator<string> {
  const session = await getSession()
  if (!session) throw new AuthError()

  const context = await buildChatContext(session.user.id)
  const trimmedContext = trimContext(context)

  yield* streamChatResponse(messages, trimmedContext)
}

export async function getSuggestedQuestions(): Promise<string[]> {
  const session = await getSession()
  if (!session) throw new AuthError()

  const context = await buildChatContext(session.user.id)
  return getSuggestedQuestions(context)
}

// actions/spending-analysis.ts
'use server'

export async function getSpendingAnalysis(month?: Date): Promise<SpendingAnalysis> {
  const session = await getSession()
  if (!session) throw new AuthError()

  return await analyzeSpending(session.user.id, month ?? new Date())
}

// actions/tax-suggestions.ts
'use server'

export async function getTaxSuggestions(): Promise<TaxSuggestion[]> {
  const session = await getSession()
  if (!session) throw new AuthError()

  return await generateTaxSuggestions(session.user.id)
}

// actions/summaries.ts
'use server'

export async function getMonthlySummaries(limit?: number): Promise<MonthlySummary[]> {
  const session = await getSession()
  if (!session) throw new AuthError()

  return await supabase
    .from('monthly_summaries')
    .select('*')
    .eq('user_id', session.user.id)
    .order('month', { ascending: false })
    .limit(limit ?? 12)
}

export async function getMonthlySummary(month: Date): Promise<MonthlySummary | null> {
  const session = await getSession()
  if (!session) throw new AuthError()

  const { data } = await supabase
    .from('monthly_summaries')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('month', format(month, 'yyyy-MM-01'))
    .single()

  return data
}
```

## UI Components

```typescript
// components/features/insights/chat-interface.tsx

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])

  useEffect(() => {
    loadSuggestedQuestions()
  }, [])

  const loadSuggestedQuestions = async () => {
    const questions = await getSuggestedQuestions()
    setSuggestedQuestions(questions)
  }

  const sendMessage = async (content: string) => {
    const userMessage: ChatMessage = { role: 'user', content }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    let assistantContent = ''
    const assistantMessage: ChatMessage = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMessage])

    try {
      for await (const chunk of streamChat([...messages, userMessage])) {
        assistantContent += chunk
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: assistantContent }
        ])
      }
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <p className="mb-4">Ask me anything about your finances!</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestedQuestions.map((q, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your finances..."
              disabled={isStreaming}
            />
            <Button type="submit" disabled={isStreaming || !input.trim()}>
              Send
            </Button>
          </div>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          This is not professional tax advice. Consult a CPA for complex situations.
        </p>
      </div>
    </div>
  )
}

// components/features/insights/monthly-summary.tsx

export function MonthlySummaryCard({ summary }: { summary: MonthlySummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{format(summary.month, 'MMMM yyyy')} Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Financial Snapshot */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Income</p>
            <p className="text-xl font-semibold text-green-600">
              +${summary.totalIncome.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Spent</p>
            <p className="text-xl font-semibold text-red-600">
              -${summary.totalSpent.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Net Change</p>
            <p className={cn(
              "text-xl font-semibold",
              summary.netChange >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {summary.netChange >= 0 ? '+' : ''}{summary.netChange.toLocaleString()}
            </p>
          </div>
        </div>

        {/* AI Narrative */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm">{summary.narrative}</p>
        </div>

        {/* Top Categories */}
        <div>
          <h4 className="font-medium mb-2">Top Spending Categories</h4>
          <div className="space-y-2">
            {summary.topCategories.map((cat, i) => (
              <div key={i} className="flex justify-between">
                <span>{cat.category}</span>
                <span className="font-medium">${cat.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        {summary.actionItems.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Action Items</h4>
            <ul className="list-disc list-inside space-y-1">
              {summary.actionItems.map((item, i) => (
                <li key={i} className="text-sm">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

## Key Components Summary

| Component | Purpose |
|-----------|---------|
| `chat.ts` | Streaming chat with Claude |
| `context-builder.ts` | Build financial context for AI |
| `spending-analyzer.ts` | Trend and anomaly detection |
| `tax-optimizer.ts` | Tax optimization suggestions |
| `summary-generator.ts` | Monthly summary creation |
| `chat-interface.tsx` | Q&A chat UI |
| `spending-dashboard.tsx` | Spending analysis display |
| `tax-suggestions.tsx` | Tax optimization cards |
| `monthly-summary.tsx` | Summary report display |
