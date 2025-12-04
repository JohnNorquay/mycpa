'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Tables, InsertTables, UpdateTables } from '@/types'
import { z } from 'zod'

export type TaxDebt = Tables<'tax_debt'>
export type TaxDebtPayment = Tables<'tax_debt_payments'>

// Zod schemas for validation
const taxDebtSchema = z.object({
  tax_year: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  debt_type: z
    .enum(['income_tax', 'penalty_failure_to_file', 'penalty_failure_to_pay', 'interest', 'other'])
    .nullable(),
  original_amount: z.number().min(0),
  current_balance: z.number().min(0),
  interest_rate: z.number().min(0).max(100).default(0),
  penalty_rate: z.number().min(0).max(100).nullable(),
  source: z
    .enum(['w2_shortage', '1099_unreported', 'business', 'estimated_tax', 'other'])
    .nullable(),
  collection_status: z
    .enum([
      'normal',
      'notice_sent',
      'lien_filed',
      'levy_pending',
      'levy_active',
      'garnishment',
      'currently_not_collectible',
    ])
    .default('normal'),
  statute_expiration_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
})

const updateTaxDebtSchema = taxDebtSchema.partial()

const paymentSchema = z.object({
  tax_debt_id: z.string().uuid(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().min(0.01),
  payment_method: z.string().max(100).nullable(),
  applied_to: z.enum(['principal', 'interest', 'penalty', 'mixed']).nullable(),
  confirmation_number: z.string().max(100).nullable(),
})

/**
 * Get all tax debts for the current user
 */
export async function getTaxDebts(): Promise<ActionResult<TaxDebt[]>> {
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
      .from('tax_debt')
      .select('*')
      .eq('user_id', user.id)
      .order('tax_year', { ascending: false })

    if (error) {
      console.error('Error fetching tax debts:', error)
      return {
        success: false,
        error: 'Failed to fetch tax debts',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error in getTaxDebts:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get a specific tax debt by ID
 */
export async function getTaxDebt(id: string): Promise<ActionResult<TaxDebt | null>> {
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
      .from('tax_debt')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching tax debt:', error)
      return {
        success: false,
        error: 'Failed to fetch tax debt',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in getTaxDebt:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Create a new tax debt
 */
export async function createTaxDebt(
  debtData: Omit<TaxDebt, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<ActionResult<TaxDebt>> {
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
    const validationResult = taxDebtSchema.safeParse(debtData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid tax debt data',
      }
    }

    const { data, error } = await supabase
      .from('tax_debt')
      .insert({
        user_id: user.id,
        ...validationResult.data,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tax debt:', error)
      return {
        success: false,
        error: 'Failed to create tax debt',
      }
    }

    revalidatePath('/dashboard/tax-debt')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in createTaxDebt:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update a tax debt
 */
export async function updateTaxDebt(
  id: string,
  debtData: Partial<Omit<TaxDebt, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ActionResult<TaxDebt>> {
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
    const validationResult = updateTaxDebtSchema.safeParse(debtData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid tax debt data',
      }
    }

    const { data, error } = await supabase
      .from('tax_debt')
      .update({
        ...validationResult.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating tax debt:', error)
      return {
        success: false,
        error: 'Failed to update tax debt',
      }
    }

    revalidatePath('/dashboard/tax-debt')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in updateTaxDebt:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a tax debt
 */
export async function deleteTaxDebt(id: string): Promise<ActionResult<void>> {
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

    const { error } = await supabase.from('tax_debt').delete().eq('id', id).eq('user_id', user.id)

    if (error) {
      console.error('Error deleting tax debt:', error)
      return {
        success: false,
        error: 'Failed to delete tax debt',
      }
    }

    revalidatePath('/dashboard/tax-debt')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('Unexpected error in deleteTaxDebt:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Record a payment for a tax debt
 */
export async function recordPayment(
  paymentData: Omit<TaxDebtPayment, 'id' | 'created_at'>
): Promise<ActionResult<TaxDebtPayment>> {
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
    const validationResult = paymentSchema.safeParse(paymentData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid payment data',
      }
    }

    // Verify the tax debt belongs to the user
    const { data: taxDebt, error: debtError } = await supabase
      .from('tax_debt')
      .select('id, current_balance')
      .eq('id', validationResult.data.tax_debt_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (debtError || !taxDebt) {
      return {
        success: false,
        error: 'Tax debt not found',
      }
    }

    // Record the payment
    const { data: payment, error: paymentError } = await supabase
      .from('tax_debt_payments')
      .insert(validationResult.data)
      .select()
      .single()

    if (paymentError) {
      console.error('Error recording payment:', paymentError)
      return {
        success: false,
        error: 'Failed to record payment',
      }
    }

    // Update the current balance
    const newBalance = Math.max(0, taxDebt.current_balance - validationResult.data.amount)

    const { error: updateError } = await supabase
      .from('tax_debt')
      .update({
        current_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validationResult.data.tax_debt_id)

    if (updateError) {
      console.error('Error updating tax debt balance:', updateError)
      // Payment was recorded but balance wasn't updated
      // Could consider rollback here, but for now just log the error
    }

    revalidatePath('/dashboard/tax-debt')

    return {
      success: true,
      data: payment,
    }
  } catch (error) {
    console.error('Unexpected error in recordPayment:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get all payments for a specific tax debt
 */
export async function getPaymentsForDebt(
  taxDebtId: string
): Promise<ActionResult<TaxDebtPayment[]>> {
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

    // Verify the tax debt belongs to the user
    const { data: taxDebt, error: debtError } = await supabase
      .from('tax_debt')
      .select('id')
      .eq('id', taxDebtId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (debtError || !taxDebt) {
      return {
        success: false,
        error: 'Tax debt not found',
      }
    }

    const { data, error } = await supabase
      .from('tax_debt_payments')
      .select('*')
      .eq('tax_debt_id', taxDebtId)
      .order('payment_date', { ascending: false })

    if (error) {
      console.error('Error fetching payments:', error)
      return {
        success: false,
        error: 'Failed to fetch payments',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error in getPaymentsForDebt:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Calculate total tax debt across all years
 */
export async function getTotalTaxDebt(): Promise<ActionResult<{ total: number; count: number }>> {
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
      .from('tax_debt')
      .select('current_balance')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error calculating total debt:', error)
      return {
        success: false,
        error: 'Failed to calculate total debt',
      }
    }

    const total = data?.reduce((sum, debt) => sum + debt.current_balance, 0) || 0
    const count = data?.length || 0

    return {
      success: true,
      data: { total, count },
    }
  } catch (error) {
    console.error('Unexpected error in getTotalTaxDebt:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
