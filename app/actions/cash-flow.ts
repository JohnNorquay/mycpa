'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Tables } from '@/types'
import { z } from 'zod'
import {
  generateCashFlowProjection,
  calculateBalanceOnDate,
  type CashFlowProjection,
  type BalanceProjection,
} from '@/lib/cash-flow/projection-engine'

export type Account = Tables<'accounts'>
export type RecurringTransaction = Tables<'recurring_transactions'>
export type Transaction = Tables<'transactions'>

// Zod schemas for validation
const dateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const targetDateSchema = z.object({
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

/**
 * Get current total balance across all accounts
 */
export async function getCurrentBalance(): Promise<
  ActionResult<{
    totalBalance: number
    availableBalance: number
    accounts: Account[]
  }>
> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching accounts:', error)
      return {
        success: false,
        error: 'Failed to fetch account balances',
      }
    }

    const totalBalance =
      accounts?.reduce((sum, account) => sum + (account.current_balance || 0), 0) || 0

    const availableBalance =
      accounts?.reduce(
        (sum, account) => sum + (account.available_balance || account.current_balance || 0),
        0
      ) || 0

    return {
      success: true,
      data: {
        totalBalance,
        availableBalance,
        accounts: accounts || [],
      },
    }
  } catch (error) {
    console.error('Unexpected error in getCurrentBalance:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get cash flow projection for a date range
 */
export async function getCashFlowProjection(
  startDate: string,
  endDate: string
): Promise<ActionResult<CashFlowProjection>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Validate dates
    const validationResult = dateRangeSchema.safeParse({ startDate, endDate })
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid date range',
      }
    }

    // Get current balance
    const balanceResult = await getCurrentBalance()
    if (!balanceResult.success) {
      return {
        success: false,
        error: balanceResult.error,
      }
    }

    const currentBalance = balanceResult.data.totalBalance

    // Get active recurring transactions
    const { data: recurringItems, error: recurringError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (recurringError) {
      console.error('Error fetching recurring items:', recurringError)
      return {
        success: false,
        error: 'Failed to fetch recurring transactions',
      }
    }

    // Generate projection
    const projection = generateCashFlowProjection(
      currentBalance,
      recurringItems || [],
      new Date(startDate),
      new Date(endDate)
    )

    return {
      success: true,
      data: projection,
    }
  } catch (error) {
    console.error('Unexpected error in getCashFlowProjection:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get projected balance on a specific date
 * "Where will I be" function
 */
export async function getBalanceOnDate(
  targetDate: string
): Promise<ActionResult<BalanceProjection>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Validate date
    const validationResult = targetDateSchema.safeParse({ targetDate })
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid target date',
      }
    }

    // Get current balance
    const balanceResult = await getCurrentBalance()
    if (!balanceResult.success) {
      return {
        success: false,
        error: balanceResult.error,
      }
    }

    const currentBalance = balanceResult.data.totalBalance

    // Get active recurring transactions
    const { data: recurringItems, error: recurringError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (recurringError) {
      console.error('Error fetching recurring items:', recurringError)
      return {
        success: false,
        error: 'Failed to fetch recurring transactions',
      }
    }

    // Get historical transactions for variance calculation (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const { data: historicalTransactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', twelveMonthsAgo.toISOString().split('T')[0])
      .eq('is_removed', false)

    if (transactionsError) {
      console.error('Error fetching historical transactions:', transactionsError)
      // Continue without historical data
    }

    // Group historical transactions by recurring item
    const historicalByRecurring = new Map<string, Transaction[]>()
    if (historicalTransactions) {
      for (const transaction of historicalTransactions) {
        for (const item of recurringItems || []) {
          // Match by merchant name (normalized comparison)
          if (
            transaction.merchant_name &&
            transaction.merchant_name.toLowerCase().includes(item.merchant_name.toLowerCase())
          ) {
            const group = historicalByRecurring.get(item.id) || []
            group.push(transaction)
            historicalByRecurring.set(item.id, group)
          }
        }
      }
    }

    // Calculate projection
    const projection = calculateBalanceOnDate(
      currentBalance,
      recurringItems || [],
      new Date(targetDate),
      historicalByRecurring
    )

    return {
      success: true,
      data: projection,
    }
  } catch (error) {
    console.error('Unexpected error in getBalanceOnDate:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get cash flow summary for the current month
 */
export async function getCurrentMonthCashFlow(): Promise<
  ActionResult<{
    income: number
    expenses: number
    netCashFlow: number
    projectedEndBalance: number
  }>
> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Calculate first and last day of current month
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const startDate = firstDay.toISOString().split('T')[0] || ''
    const endDate = lastDay.toISOString().split('T')[0] || ''

    if (!startDate || !endDate) {
      return {
        success: false,
        error: 'Failed to calculate date range',
      }
    }

    // Get projection for the month
    const projectionResult = await getCashFlowProjection(startDate, endDate)
    if (!projectionResult.success) {
      return {
        success: false,
        error: projectionResult.error,
      }
    }

    const projection = projectionResult.data

    return {
      success: true,
      data: {
        income: projection.totalIncome,
        expenses: projection.totalExpenses,
        netCashFlow: projection.totalIncome - projection.totalExpenses,
        projectedEndBalance:
          projection.projections[projection.projections.length - 1]?.runningBalance || 0,
      },
    }
  } catch (error) {
    console.error('Unexpected error in getCurrentMonthCashFlow:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get upcoming recurring transactions (next 30 days)
 */
export async function getUpcomingRecurringTransactions(): Promise<
  ActionResult<
    Array<{
      id: string
      merchantName: string
      expectedAmount: number
      nextExpected: string
      isIncome: boolean
      daysUntil: number
    }>
  >
> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    const { data: recurringItems, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .lte('next_expected', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('next_expected', { ascending: true })

    if (error) {
      console.error('Error fetching upcoming recurring transactions:', error)
      return {
        success: false,
        error: 'Failed to fetch upcoming transactions',
      }
    }

    const upcoming = (recurringItems || []).map((item) => {
      const nextDate = new Date(item.next_expected || '')
      const daysUntil = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: item.id,
        merchantName: item.merchant_name,
        expectedAmount: item.expected_amount || 0,
        nextExpected: item.next_expected || '',
        isIncome: item.is_income,
        daysUntil,
      }
    })

    return {
      success: true,
      data: upcoming,
    }
  } catch (error) {
    console.error('Unexpected error in getUpcomingRecurringTransactions:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
