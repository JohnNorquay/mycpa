# Product Mission

## Pitch

**CPA Bot** is a personal financial assistant that helps individuals manage their finances, resolve IRS tax debt, and optimize taxes year-round by providing intelligent automation, IRS relief program analysis, and AI-powered financial insights—all without needing expensive professional help for routine matters.

## Users

### Primary Customer

- **Johnny5**: A Wisconsin-based individual with personal finance management needs, potential 1099 contract work, and outstanding IRS tax debt requiring resolution.

### User Persona

**Johnny5** (Self-Managing Taxpayer with IRS Debt)
- **Role:** Individual taxpayer, potential 1099 contractor
- **Location:** Wisconsin, US
- **Technical Background:** Experienced with Next.js, FastAPI, Supabase, API integrations
- **Pain Points:**
  - Outstanding tax debt from previous company requiring resolution
  - Uncertainty about which IRS relief program (OIC, payment plan, CNC) is best for their situation
  - Complex calculations for Offer in Compromise eligibility
  - Manual tracking of IRS correspondence and deadlines
  - Time-consuming tax document organization
  - Lack of year-round tax planning leading to surprises at tax time
  - Difficulty categorizing transactions for tax purposes
  - No visibility into cash flow timing—when money comes in vs goes out
  - Uncertainty about month-end financial position at any point in the month
- **Goals:**
  - Resolve IRS tax debt through the most advantageous relief program
  - Automate financial tracking and categorization
  - Stay compliant and avoid future tax debt
  - Maximize deductions and minimize tax liability
  - Have organized, OCR-processed tax documents ready for filing
  - Get intelligent, personalized financial insights
  - Know exactly where they stand financially at any point in the month
  - Predict month-end balance based on expected income and expenses
- **Success Criteria:**
  - Clear understanding of debt resolution options with recommended strategy
  - Accurate OIC/payment plan calculations matching IRS methodology
  - Never miss an IRS deadline or correspondence response
  - 95%+ transaction categorization accuracy
  - All tax documents organized and searchable
  - Confident tax projections throughout the year
  - Accurate cash flow predictions within 5% of actual month-end balance

## The Problem

### Tax Debt Resolution is Complex, Opaque, and Expensive

Individuals with IRS tax debt face a maze of relief programs (Offer in Compromise, Installment Agreements, Currently Not Collectible, Penalty Abatement) with complex eligibility requirements and calculations. Professional help costs $3,000-$10,000+ for OIC applications, and many taxpayers either overpay by not knowing their options or make mistakes that harm their negotiating position.

**Current Solutions:**
- Hire an enrolled agent, CPA, or tax attorney ($3,000-$15,000+)
- Use the IRS's basic online pre-qualifier tool (limited, no strategy guidance)
- Attempt self-resolution with IRS forms and publications (complex, error-prone)
- Ignore the debt (leads to liens, levies, garnishments)

**Why They Fall Short:**
- Professional help is expensive and often unnecessary for straightforward cases
- IRS tools provide no strategy comparison or personalized recommendations
- Self-resolution requires understanding complex RCP calculations, IRS National Standards, and form preparation
- Most people don't know which program is best for their specific situation

**Our Solution:**
CPA Bot provides a comprehensive IRS debt resolution toolkit that calculates Reasonable Collection Potential (using the same methodology as the IRS), compares relief program options side-by-side, tracks all correspondence and deadlines, and guides users through the application process—while clearly indicating when professional help is warranted.

### Year-Round Tax Management is Reactive, Not Proactive

Most individuals only think about taxes at filing time, missing optimization opportunities and facing surprise liabilities.

**Current Solutions:**
- Spreadsheets and manual tracking
- Mint/personal finance apps (RIP Mint, others lack tax focus)
- Annual CPA consultation
- Tax filing software's basic projections

**Why They Fall Short:**
- Manual tracking is time-consuming and incomplete
- Most apps focus on budgeting, not tax optimization
- Annual consultations miss mid-year opportunities
- Filing software only works at tax time

**Our Solution:**
CPA Bot provides continuous, AI-powered tax projection and optimization throughout the year, automatically categorizing transactions for tax purposes, tracking deductions, and alerting users to optimization opportunities like retirement contributions, tax-loss harvesting timing, and estimated payment requirements.

### Cash Flow is Unpredictable and Stressful

Most people don't know where they'll stand financially at month-end until they get there. Income arrives on specific dates, bills are due on others, and unexpected expenses throw off any mental math.

**Current Solutions:**
- Mental tracking ("I get paid Friday, rent is due the 1st...")
- Spreadsheets with manual entry
- Checking bank balance and hoping
- Overdraft protection as a safety net

**Why They Fall Short:**
- Mental math is error-prone and stressful
- Spreadsheets require constant maintenance
- Current balance doesn't account for pending transactions or upcoming bills
- Reactive rather than proactive—problems discovered too late

**Our Solution:**
CPA Bot learns your recurring income and expense patterns, tracks expected vs actual transactions, and provides a real-time cash flow forecast showing your projected balance at any future date. At any point in the month, you can see: what's come in, what's gone out, what's still expected, and where you'll land at month-end.

## Differentiators

### IRS Debt Resolution Intelligence

Unlike generic financial apps or expensive tax professionals, CPA Bot provides sophisticated IRS relief program analysis including:
- Full Reasonable Collection Potential (RCP) calculation using IRS methodology
- Age-based future income calculations (the IRS uses different multipliers based on age)
- IRS National Standards integration for allowable expense validation
- Side-by-side comparison of OIC vs payment plans vs CNC
- Form pre-population for 656, 433-A, 9465, and 843
- Success probability estimates based on financial profile

This democratizes access to the same analysis that $5,000+ tax resolution firms provide.

### AI-Powered Financial Intelligence

Unlike rule-based categorization systems, CPA Bot uses Claude AI to:
- Understand transaction context and categorize with >95% accuracy
- Provide personalized tax optimization recommendations
- Answer complex "what if" financial questions
- Detect anomalies and potential issues proactively
- Generate natural language insights about spending and tax situations

### Personal-Use Focus with Professional-Grade Features

Unlike business-focused accounting software or oversimplified consumer apps, CPA Bot is purpose-built for individual taxpayers who want sophisticated tools without complexity:
- No business entity overhead—designed for personal finances and 1099 work
- Wisconsin state tax calculations built-in
- Tax-deductible expense tracking integrated into transaction flow
- Document OCR optimized for personal tax forms (W2, 1099s, etc.)

### Predictive Cash Flow Intelligence

Unlike apps that only show current balances or past spending, CPA Bot provides forward-looking cash flow:
- Learns recurring patterns (paychecks, subscriptions, bills) automatically
- Shows projected balance for any future date
- "Where will I be on the 15th? On the 30th?"
- Alerts when projected balance goes negative
- Tracks expected vs actual to improve predictions over time

## Key Features

### Core Features (MVP)

- **IRS Tax Debt Dashboard:** Track outstanding debt by year, type, and collection status with real-time interest calculations and statute of limitations tracking
- **OIC Calculator:** Full Reasonable Collection Potential calculation with asset equity, future income (age-adjusted), and disposable income analysis to determine optimal offer amount
- **Relief Program Comparison:** Side-by-side analysis of Offer in Compromise, Installment Agreements, Currently Not Collectible, and Penalty Abatement with eligibility assessment and strategy recommendations
- **IRS Correspondence Tracker:** Log all notices, track response deadlines, store related documents, and never miss a critical date
- **Bank Account Integration (Plaid):** Automatic transaction sync from checking, savings, and credit cards with 2+ years of history
- **AI Transaction Categorization:** Claude-powered categorization with tax-deductible flagging, split transactions, and merchant normalization
- **Tax Projection Engine:** Real-time federal and Wisconsin state tax calculations with standard vs itemized comparison
- **Document Management:** Secure upload, OCR processing, and automatic classification of tax documents (W2, 1099s, receipts)
- **Financial Snapshot System:** Capture income, expenses, and assets for IRS program applications with National Standards comparison
- **Cash Flow Forecasting:** Real-time projection of future balances based on recurring income/expense patterns, showing where you'll stand at month-end from any point in the month

### Future Features

- **Investment Tracking:** Portfolio overview, cost basis tracking, tax-loss harvesting opportunities
- **Retirement Optimization:** IRA/401(k) contribution recommendations with tax impact modeling
- **Budgeting Tools:** Envelope system, savings goals, spending limits
- **Mobile App:** Native iOS/Android for on-the-go access
- **Tax Filing Integration:** Export data to TurboTax, H&R Block, or direct e-file
- **Email Document Import:** Automatic parsing of financial documents from email

## Success Metrics

### Primary Metrics
- **Debt Resolution Clarity:** User can identify recommended relief program within 30 minutes of data entry
- **OIC Calculation Accuracy:** Within 5% of IRS pre-qualifier tool results
- **Transaction Categorization Accuracy:** >95% correct on first pass
- **Document OCR Accuracy:** >98% field extraction accuracy
- **Tax Projection Accuracy:** Within 5% of actual liability at filing time
- **Cash Flow Forecast Accuracy:** Month-end balance predictions within 5% after 2 months of data

### Secondary Metrics
- **Time Saved:** 80% reduction in manual financial tracking time
- **Deadline Compliance:** Zero missed IRS response deadlines
- **Deduction Discovery:** Identify previously missed deductions
- **User Confidence:** High confidence in tax projections and debt resolution strategy

## Safety & Compliance

### Critical Disclaimers
- This tool provides information and organization, NOT professional tax advice
- Complex tax debt situations require professional representation
- Users should consult with enrolled agent, CPA, or tax attorney before submitting OIC
- Incorrect OIC applications can harm negotiating position

### When to Recommend Professional Help
- Debt over $50,000
- Business tax debt or trust fund recovery penalties
- Criminal investigation concerns
- Previous failed OIC attempts
- Significant assets at risk
- State tax debt complications
- Offers requiring legal justification

### Data Security
- End-to-end encryption for all sensitive documents
- Encrypted database fields for financial data
- Row-level security in Supabase
- Secure API key management
- No SSN storage unless absolutely necessary (and if so, heavily encrypted)
