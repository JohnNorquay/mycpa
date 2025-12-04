'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Tables, UpdateTables } from '@/types'
import { z } from 'zod'
import { detectRecurringPatterns, calculateNextExpected } from '@/lib/cash-flow/recurring-detector'
import { inngest } from '@/inngest/client'

export type RecurringTransaction = Tables<'recurring_transactions'>

// Zod schemas for validation
const updateRecurringSchema = z.object({
  expected_amount: z.number().min(0).optional(),
  amount_variance: z.number().min(0).optional(),
  frequency: z
    .enum(['weekly', 'biweekly', 'semimonthly', 'monthly', 'quarterly', 'annual'])
    .optional(),
  expected_day: z.number().int().min(0).max(31).nullable().optional(),
  is_active: z.boolean().optional(),
})

/**
 * Get all recurring transactions for the current user
 */
export async function getRecurringItems(): Promise<ActionResult<RecurringTransaction[]>> {
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

    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('merchant_name', { ascending: true })

    if (error) {
      console.error('Error fetching recurring items:', error)
      return {
        success: false,
        error: 'Failed to fetch recurring items',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error in getRecurringItems:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get active recurring transactions only
 */
export async function getActiveRecurringItems(): Promise<ActionResult<RecurringTransaction[]>> {
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

    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('next_expected', { ascending: true })

    if (error) {
      console.error('Error fetching active recurring items:', error)
      return {
        success: false,
        error: 'Failed to fetch active recurring items',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error in getActiveRecurringItems:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get a specific recurring transaction by ID
 */
export async function getRecurringItem(
  id: string
): Promise<ActionResult<RecurringTransaction | null>> {
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

    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching recurring item:', error)
      return {
        success: false,
        error: 'Failed to fetch recurring item',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in getRecurringItem:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update a recurring transaction
 */
export async function updateRecurringItem(
  id: string,
  updates: Partial<
    Pick<
      RecurringTransaction,
      'expected_amount' | 'amount_variance' | 'frequency' | 'expected_day' | 'is_active'
    >
  >
): Promise<ActionResult<RecurringTransaction>> {
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

    // Validate input
    const validationResult = updateRecurringSchema.safeParse(updates)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid recurring item data',
      }
    }

    // Fetch the current item to recalculate next_expected if needed
    const { data: currentItem, error: fetchError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError || !currentItem) {
      return {
        success: false,
        error: 'Recurring item not found',
      }
    }

    // Recalculate next_expected if frequency or expected_day changed
    let nextExpected = currentItem.next_expected
    if (
      (validationResult.data.frequency || validationResult.data.expected_day !== undefined) &&
      currentItem.last_occurrence
    ) {
      const frequency = validationResult.data.frequency || currentItem.frequency
      const expectedDay =
        validationResult.data.expected_day !== undefined
          ? validationResult.data.expected_day
          : currentItem.expected_day

      if (frequency) {
        const lastOccurrenceDate = new Date(currentItem.last_occurrence)
        const nextDate = calculateNextExpected(lastOccurrenceDate, frequency, expectedDay)
        nextExpected = nextDate.toISOString().split('T')[0]
      }
    }

    const { data, error } = await supabase
      .from('recurring_transactions')
      .update({
        ...validationResult.data,
        next_expected: nextExpected,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating recurring item:', error)
      return {
        success: false,
        error: 'Failed to update recurring item',
      }
    }

    revalidatePath('/dashboard/cash-flow')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in updateRecurringItem:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Pause (deactivate) a recurring transaction
 */
export async function pauseRecurringItem(id: string): Promise<ActionResult<RecurringTransaction>> {
  return updateRecurringItem(id, { is_active: false })
}

/**
 * Resume (activate) a recurring transaction
 */
export async function resumeRecurringItem(id: string): Promise<ActionResult<RecurringTransaction>> {
  return updateRecurringItem(id, { is_active: true })
}

/**
 * Delete a recurring transaction
 */
export async function deleteRecurringItem(id: string): Promise<ActionResult<void>> {
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

    const { error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting recurring item:', error)
      return {
        success: false,
        error: 'Failed to delete recurring item',
      }
    }

    revalidatePath('/dashboard/cash-flow')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('Unexpected error in deleteRecurringItem:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Trigger recurring transaction detection
 * This analyzes all transactions and updates the recurring_transactions table
 */
export async function runRecurringDetection(): Promise<
  ActionResult<{
    detected: number
    updated: number
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

    // Fetch all transactions for the user (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', twelveMonthsAgo.toISOString().split('T')[0])
      .eq('is_removed', false)

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return {
        success: false,
        error: 'Failed to fetch transactions',
      }
    }

    // Detect patterns
    const patterns = detectRecurringPatterns(transactions || [], 3)

    let detectedCount = 0
    let updatedCount = 0

    // Save or update patterns
    for (const pattern of patterns) {
      // Check if this merchant already has a recurring pattern
      const { data: existing, error: existingError } = await supabase
        .from('recurring_transactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('merchant_name', pattern.merchantName)
        .maybeSingle()

      if (existingError && existingError.code !== 'PGRST116') {
        console.error('Error checking existing pattern:', existingError)
        continue
      }

      if (existing) {
        // Update existing pattern
        const { error: updateError } = await supabase
          .from('recurring_transactions')
          .update({
            category: pattern.category,
            expected_amount: pattern.expectedAmount,
            amount_variance: pattern.amountVariance,
            frequency: pattern.frequency,
            expected_day: pattern.expectedDay,
            last_occurrence: pattern.lastOccurrence,
            next_expected: pattern.nextExpected,
            is_income: pattern.isIncome,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (!updateError) {
          updatedCount++
        }
      } else {
        // Create new pattern
        const { error: insertError } = await supabase.from('recurring_transactions').insert({
          user_id: user.id,
          merchant_name: pattern.merchantName,
          category: pattern.category,
          expected_amount: pattern.expectedAmount,
          amount_variance: pattern.amountVariance,
          frequency: pattern.frequency,
          expected_day: pattern.expectedDay,
          last_occurrence: pattern.lastOccurrence,
          next_expected: pattern.nextExpected,
          is_income: pattern.isIncome,
          is_active: true,
        })

        if (!insertError) {
          detectedCount++
        }
      }
    }

    revalidatePath('/dashboard/cash-flow')

    return {
      success: true,
      data: {
        detected: detectedCount,
        updated: updatedCount,
      },
    }
  } catch (error) {
    console.error('Unexpected error in runRecurringDetection:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
