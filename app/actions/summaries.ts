'use server'

import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

interface FinancialSnapshot {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  savingsRate: number
  topExpenseCategory: {
    name: string
    amount: number
  }
  largestTransaction: {
    description: string
    amount: number
    type: 'income' | 'expense'
  }
  transactionCount: number
}

interface ActionItem {
  id: string
  type: 'tax' | 'savings' | 'spending' | 'debt' | 'reminder'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  dueDate?: string
}

export interface MonthlySummary {
  id: string
  month: string // Format: YYYY-MM
  generatedAt: string
  snapshot: FinancialSnapshot
  aiNarrative: string
  actionItems: ActionItem[]
  previousMonth?: {
    netCashFlow: number
    savingsRate: number
  }
}

/**
 * Get list of monthly summaries for the current user
 */
export async function getMonthlySummaries(
  limit = 12
): Promise<ActionResult<{ summaries: MonthlySummary[] }>> {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get summaries from database
    const { data: summaries, error } = await supabase
      .from('monthly_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('month', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching monthly summaries:', error)
      return { success: false, error: 'Failed to fetch summaries' }
    }

    // Transform database records to MonthlySummary format
    const formattedSummaries: MonthlySummary[] = (summaries || []).map((s) => ({
      id: s.id,
      month: s.month,
      generatedAt: s.generated_at || s.created_at,
      snapshot: s.snapshot as FinancialSnapshot,
      aiNarrative: s.ai_narrative || '',
      actionItems: (s.action_items as ActionItem[]) || [],
      previousMonth: s.previous_month as MonthlySummary['previousMonth'],
    }))

    return { success: true, data: { summaries: formattedSummaries } }
  } catch (error) {
    console.error('Error in getMonthlySummaries:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get a single monthly summary
 */
export async function getMonthlySummary(
  month: string
): Promise<ActionResult<{ summary: MonthlySummary }>> {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get summary from database
    const { data: summary, error } = await supabase
      .from('monthly_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .single()

    if (error) {
      console.error('Error fetching monthly summary:', error)
      return { success: false, error: 'Summary not found' }
    }

    // Get previous month summary for comparison
    const previousMonth = getPreviousMonth(month)
    const { data: prevSummary } = await supabase
      .from('monthly_summaries')
      .select('snapshot')
      .eq('user_id', user.id)
      .eq('month', previousMonth)
      .single()

    const prevSnapshot = prevSummary?.snapshot as FinancialSnapshot | undefined

    const formattedSummary: MonthlySummary = {
      id: summary.id,
      month: summary.month,
      generatedAt: summary.generated_at || summary.created_at,
      snapshot: summary.snapshot as FinancialSnapshot,
      aiNarrative: summary.ai_narrative || '',
      actionItems: (summary.action_items as ActionItem[]) || [],
      previousMonth: prevSnapshot
        ? {
            netCashFlow: prevSnapshot.netCashFlow,
            savingsRate: prevSnapshot.savingsRate,
          }
        : undefined,
    }

    return { success: true, data: { summary: formattedSummary } }
  } catch (error) {
    console.error('Error in getMonthlySummary:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get the most recent monthly summary
 */
export async function getLatestMonthlySummary(): Promise<
  ActionResult<{ summary: MonthlySummary | null }>
> {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get most recent summary
    const { data: summary, error } = await supabase
      .from('monthly_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('month', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      // No summary found is not an error
      if (error.code === 'PGRST116') {
        return { success: true, data: { summary: null } }
      }
      console.error('Error fetching latest summary:', error)
      return { success: false, error: 'Failed to fetch summary' }
    }

    // Get previous month for comparison
    const previousMonth = getPreviousMonth(summary.month)
    const { data: prevSummary } = await supabase
      .from('monthly_summaries')
      .select('snapshot')
      .eq('user_id', user.id)
      .eq('month', previousMonth)
      .single()

    const prevSnapshot = prevSummary?.snapshot as FinancialSnapshot | undefined

    const formattedSummary: MonthlySummary = {
      id: summary.id,
      month: summary.month,
      generatedAt: summary.generated_at || summary.created_at,
      snapshot: summary.snapshot as FinancialSnapshot,
      aiNarrative: summary.ai_narrative || '',
      actionItems: (summary.action_items as ActionItem[]) || [],
      previousMonth: prevSnapshot
        ? {
            netCashFlow: prevSnapshot.netCashFlow,
            savingsRate: prevSnapshot.savingsRate,
          }
        : undefined,
    }

    return { success: true, data: { summary: formattedSummary } }
  } catch (error) {
    console.error('Error in getLatestMonthlySummary:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get available months with summaries
 */
export async function getAvailableSummaryMonths(): Promise<ActionResult<{ months: string[] }>> {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get distinct months
    const { data: summaries, error } = await supabase
      .from('monthly_summaries')
      .select('month')
      .eq('user_id', user.id)
      .order('month', { ascending: false })

    if (error) {
      console.error('Error fetching available months:', error)
      return { success: false, error: 'Failed to fetch months' }
    }

    const months = (summaries || []).map((s) => s.month)
    return { success: true, data: { months } }
  } catch (error) {
    console.error('Error in getAvailableSummaryMonths:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Helper function to get previous month string
function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number)
  if (!year || !monthNum) return month

  const date = new Date(year, monthNum - 1, 1)
  date.setMonth(date.getMonth() - 1)

  const prevYear = date.getFullYear()
  const prevMonth = (date.getMonth() + 1).toString().padStart(2, '0')

  return `${prevYear}-${prevMonth}`
}
