# Requirements: AI Insights

## Initial Request

Build AI-powered financial intelligence features including a natural language Q&A interface, spending analysis with anomaly detection, proactive tax optimization suggestions, and automated monthly summary reports.

## Product Context

### Mission Alignment
The AI layer transforms raw financial data into actionable intelligence, making CPA Bot feel like having a personal financial advisor available 24/7.

### Roadmap Context
- Current Phase: Phase 6 - AI Insights & Intelligence
- Feature Priority: Medium-High - key differentiator
- Related Features: Consumes data from all previous specs

### Technical Context
- Stack: Next.js 14, Claude API (Sonnet for quality)
- Context: All user financial data available to queries
- Streaming: Use streaming responses for chat

## Clarification Q&A

No additional clarification needed - original product spec comprehensive.

## Visual Assets

No visual assets provided. Chat interface and dashboard cards.

## Functional Requirements

### 32. Financial Q&A Interface

1. **Chat Interface**:
   - Chat panel (slide-out or dedicated page)
   - Message history within session
   - Streaming responses for real-time feel
   - Clear/new conversation button
2. **Context Injection**:
   - Automatically include relevant user data:
     - Profile (filing status, location)
     - Tax debt summary (if any)
     - Recent transactions summary
     - Current cash flow projection
     - Tax projection status
   - Context stays under token limits
3. **Example Queries**:
   - "How much did I spend on food last month?"
   - "What's my biggest expense category?"
   - "Am I on track to get a refund this year?"
   - "What would happen if I contribute $5,000 to my IRA?"
   - "Should I itemize or take the standard deduction?"
   - "What's the best option for my tax debt?"
   - "When is my next big bill due?"
4. **Response Formatting**:
   - Markdown support for structured responses
   - Tables for comparisons
   - Bullet points for lists
   - Highlight key numbers
5. **Suggested Follow-ups**:
   - After each response, suggest 2-3 related questions
   - "You might also want to know..."
6. **Data Privacy**:
   - Remind user that conversation uses their financial data
   - No conversation history stored (ephemeral)
   - Claude doesn't retain data
7. **Limitations Display**:
   - Clear that this is not professional tax advice
   - Suggest professional help for complex situations

### 33. Spending Analysis & Trends

1. **Monthly Spending Summary**:
   - Total spending by month (chart)
   - Comparison to previous months
   - Comparison to same month last year
2. **Category Breakdown**:
   - Pie/donut chart of spending by category
   - Month-over-month category comparison
   - Expandable category details
3. **Trend Detection**:
   - Identify increasing/decreasing trends by category
   - "Food spending up 15% over 3 months"
   - Trend badges on categories
4. **Anomaly Detection**:
   - Flag unusual transactions
   - "Electric bill $350 is 2x your average"
   - "New recurring subscription detected: $49/mo"
   - Unusual merchant (first-time large purchase)
5. **Spending Velocity**:
   - Daily spending rate this month
   - Projected month-end spending
   - Comparison to typical month
6. **Merchant Analysis**:
   - Top merchants by spend
   - Merchant spending trends
   - New vs recurring merchants
7. **Income vs Expense Ratio**:
   - Monthly income vs spending
   - Savings rate calculation
   - Trend over time

### 34. Tax Optimization Suggestions

1. **Proactive Recommendations** (dashboard cards):
   - Retirement contribution opportunities
   - Deduction bunching opportunities
   - Tax-loss harvesting timing (if investments tracked)
   - Estimated payment reminders
   - W4 adjustment suggestions
2. **Retirement Optimization**:
   - "Contributing $X to IRA would save $Y in taxes"
   - Show deadline for contributions
   - Traditional vs Roth comparison for your situation
3. **Deduction Bunching**:
   - If close to itemizing threshold
   - "Consider bunching charitable donations in one year"
   - Multi-year strategy suggestion
4. **Timing Recommendations**:
   - "Defer this income to next year" (if beneficial)
   - "Accelerate this deduction" (if beneficial)
   - Quarter-by-quarter suggestions
5. **Withholding Alerts**:
   - "You're on track to owe $X - adjust W4"
   - "You're over-withholding - you could have $X/month more"
6. **Tax Debt Strategy Updates**:
   - If user has tax debt, periodic strategy check
   - "Your income changed - reassess OIC eligibility"
   - "Consider making estimated payment to avoid new debt"
7. **Notification Priority**:
   - High: Action needed soon (deadlines)
   - Medium: Opportunity to save
   - Low: Good to know

### 35. Monthly Summary Reports

1. **Automatic Generation**:
   - Generate on 1st of each month (via cron)
   - Cover previous month's data
2. **Report Sections**:
   - **Financial Snapshot**: Starting balance, ending balance, net change
   - **Income Summary**: Total income, by source
   - **Spending Summary**: Total spending, top categories
   - **Notable Transactions**: Largest expenses, unusual items
   - **Cash Flow Health**: Did you end positive? Trend?
   - **Tax Status**: YTD tax projection, any concerns
   - **Tax Debt Progress** (if applicable): Payments made, balance change
   - **Action Items**: What to do this month
3. **AI-Written Narrative**:
   - Claude generates natural language summary
   - "In November, you spent $4,523, which is 8% less than October..."
   - Personalized insights and observations
4. **Delivery**:
   - Available in app (Insights section)
   - Card on dashboard: "Your November summary is ready"
   - Email notification (future enhancement)
5. **Historical Access**:
   - Archive of past monthly summaries
   - Compare months
6. **Year-End Summary**:
   - December summary includes full-year overview
   - Annual totals by category
   - Year-over-year comparison
   - Tax season readiness checklist

## Non-Functional Requirements

### Performance
- Q&A response starts streaming < 2s
- Spending analysis loads < 1s
- Summary generation < 30s (async)

### Quality
- AI responses are accurate to user's data
- No hallucinated numbers
- Appropriate uncertainty when data incomplete

### Cost Control
- Use Haiku for simple queries
- Use Sonnet for complex analysis
- Cache common query patterns
- Limit context size intelligently

### User Experience
- Streaming responses feel responsive
- Clear loading states
- Graceful error handling

## Integration Points

1. **All Previous Specs**: Consumes data from all modules
2. **Tax Debt Core**: Strategy recommendations
3. **Cash Flow**: Balance projections
4. **Tax Planning**: Optimization suggestions
5. **Transactions**: Spending analysis

## Out of Scope

1. Voice interface
2. Automated actions (just suggestions)
3. Third-party integrations for recommendations
4. Personalized investment advice (not a financial advisor)
5. Chat history persistence (ephemeral sessions)

## Dependencies

1. All previous specs complete (or sufficient data)
2. Claude API configured with Sonnet access
3. Inngest for summary generation
4. Sufficient user data for meaningful insights

## Success Criteria

- [ ] User can ask questions in natural language
- [ ] Responses accurately reflect user's financial data
- [ ] Spending analysis shows trends and anomalies
- [ ] Tax optimization suggestions are personalized
- [ ] Monthly summary generates automatically
- [ ] Summaries include AI-written narrative
- [ ] Retirement contribution optimizer works
- [ ] No hallucinated or incorrect numbers
- [ ] Streaming responses feel responsive

## Open Questions

None. Requirements complete and ready for specification.

## Next Steps

Ready to proceed to formal specification via `/create-spec`.

---

*This requirements document was created through lite shape-spec process, leveraging comprehensive product planning already completed.*
