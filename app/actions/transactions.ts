'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'
import { z } from 'zod'

// Zod schemas for validation
const updateTransactionSchema = z.object({
  category: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_tax_deductible: z.boolean().optional(),
  is_recurring: z.boolean().optional(),
})

const splitItemSchema = z.object({
  amount: z.number().positive(),
  category: z.string(),
  description: z.string().optional(),
})

const splitTransactionSchema = z.object({
  transactionId: z.string().uuid(),
  splits: z.array(splitItemSchema).min(2),
})

/**
 * Update a transaction's category, notes, or flags
 */
export async function updateTransaction(
  transactionId: string,
  updates: z.infer<typeof updateTransactionSchema>
): Promise<ActionResult<{ id: string }>> {
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

    // Validate input
    const validatedData = updateTransactionSchema.parse(updates)

    // Verify transaction belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('transactions')
      .select('id, user_id')
      .eq('id', transactionId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Transaction not found' }
    }

    if (existing.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Update transaction
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return { success: false, error: 'Failed to update transaction' }
    }

    revalidatePath('/transactions')
    return { success: true, data: { id: transactionId } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Invalid input' }
    }
    console.error('Error in updateTransaction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Split a transaction into multiple parts
 */
export async function splitTransaction(
  input: z.infer<typeof splitTransactionSchema>
): Promise<ActionResult<{ splitIds: string[] }>> {
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

    // Validate input
    const validatedData = splitTransactionSchema.parse(input)

    // Fetch original transaction
    const { data: original, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', validatedData.transactionId)
      .single()

    if (fetchError || !original) {
      return { success: false, error: 'Transaction not found' }
    }

    if (original.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Verify splits sum to original amount
    const originalAmount = Math.abs(original.amount)
    const splitTotal = validatedData.splits.reduce((sum, s) => sum + s.amount, 0)
    const sign = original.amount < 0 ? -1 : 1

    if (Math.abs(originalAmount - splitTotal) > 0.01) {
      return {
        success: false,
        error: `Splits must sum to original amount (${originalAmount.toFixed(2)})`,
      }
    }

    // Create split transactions
    const splitInserts = validatedData.splits.map((split, index) => ({
      user_id: user.id,
      account_id: original.account_id,
      plaid_transaction_id: original.plaid_transaction_id
        ? `${original.plaid_transaction_id}_split_${index}`
        : null,
      date: original.date,
      amount: split.amount * sign,
      merchant_name: original.merchant_name,
      category: split.category || null,
      notes: split.description || null,
      is_tax_deductible: original.is_tax_deductible,
      is_recurring: original.is_recurring,
      is_removed: false,
      parent_transaction_id: original.id,
    }))

    const { data: newTransactions, error: insertError } = await supabase
      .from('transactions')
      .insert(splitInserts)
      .select('id')

    if (insertError) {
      console.error('Error creating split transactions:', insertError)
      return { success: false, error: 'Failed to create split transactions' }
    }

    // Mark original as removed (but keep for reference)
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        is_removed: true,
        notes: `Split into ${validatedData.splits.length} transactions`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validatedData.transactionId)

    if (updateError) {
      console.error('Error marking original as split:', updateError)
      // Don't fail the whole operation - splits were created successfully
    }

    revalidatePath('/transactions')
    return {
      success: true,
      data: { splitIds: newTransactions?.map((t) => t.id) || [] },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Invalid input' }
    }
    console.error('Error in splitTransaction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a transaction (soft delete)
 */
export async function deleteTransaction(transactionId: string): Promise<ActionResult<void>> {
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

    // Verify transaction belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('transactions')
      .select('id, user_id')
      .eq('id', transactionId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Transaction not found' }
    }

    if (existing.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Soft delete
    const { error: updateError } = await supabase
      .from('transactions')
      .update({
        is_removed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)

    if (updateError) {
      console.error('Error deleting transaction:', updateError)
      return { success: false, error: 'Failed to delete transaction' }
    }

    revalidatePath('/transactions')
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error in deleteTransaction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Bulk update transactions category
 */
export async function bulkUpdateCategory(
  transactionIds: string[],
  category: string
): Promise<ActionResult<{ updated: number }>> {
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

    if (transactionIds.length === 0) {
      return { success: false, error: 'No transactions selected' }
    }

    if (transactionIds.length > 100) {
      return { success: false, error: 'Maximum 100 transactions per bulk update' }
    }

    // Update transactions that belong to the user
    const { data, error: updateError } = await supabase
      .from('transactions')
      .update({
        category,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .in('id', transactionIds)
      .select('id')

    if (updateError) {
      console.error('Error bulk updating transactions:', updateError)
      return { success: false, error: 'Failed to update transactions' }
    }

    revalidatePath('/transactions')
    return { success: true, data: { updated: data?.length || 0 } }
  } catch (error) {
    console.error('Error in bulkUpdateCategory:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Bulk mark transactions as tax deductible
 */
export async function bulkMarkTaxDeductible(
  transactionIds: string[],
  isTaxDeductible: boolean
): Promise<ActionResult<{ updated: number }>> {
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

    if (transactionIds.length === 0) {
      return { success: false, error: 'No transactions selected' }
    }

    if (transactionIds.length > 100) {
      return { success: false, error: 'Maximum 100 transactions per bulk update' }
    }

    // Update transactions that belong to the user
    const { data, error: updateError } = await supabase
      .from('transactions')
      .update({
        is_tax_deductible: isTaxDeductible,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .in('id', transactionIds)
      .select('id')

    if (updateError) {
      console.error('Error bulk updating tax deductible:', updateError)
      return { success: false, error: 'Failed to update transactions' }
    }

    revalidatePath('/transactions')
    return { success: true, data: { updated: data?.length || 0 } }
  } catch (error) {
    console.error('Error in bulkMarkTaxDeductible:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
