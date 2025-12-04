'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Tables, InsertTables, UpdateTables } from '@/types'
import { z } from 'zod'

export type FinancialSnapshot = Tables<'financial_snapshot'>
export type AllowableExpense = Tables<'irs_allowable_expenses'>

// Zod schemas for validation
const financialSnapshotSchema = z.object({
  relief_application_id: z.string().uuid().nullable(),
  snapshot_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default(() => new Date().toISOString().split('T')[0]!),
  monthly_gross_income: z.number().min(0).nullable(),
  monthly_net_income: z.number().min(0).nullable(),
  monthly_allowable_expenses: z.number().min(0).nullable(),
  monthly_disposable_income: z.number().nullable(),
  total_asset_equity: z.number().min(0).nullable(),
  home_equity: z.number().min(0).nullable(),
  vehicle_equity: z.number().min(0).nullable(),
  bank_balance: z.number().min(0).nullable(),
  investment_value: z.number().min(0).nullable(),
  reasonable_collection_potential: z.number().min(0).nullable(),
  future_income_months: z.number().int().min(0).max(120).nullable(),
  notes: z.string().max(2000).nullable(),
})

const updateSnapshotSchema = financialSnapshotSchema.partial()

const allowableExpenseSchema = z.object({
  financial_snapshot_id: z.string().uuid().nullable(),
  category: z.string().min(1).max(100),
  irs_allowable_amount: z.number().min(0).nullable(),
  actual_amount: z.number().min(0).nullable(),
  variance: z.number().nullable(),
  justification: z.string().max(1000).nullable(),
})

/**
 * Get all financial snapshots for the current user
 */
export async function getFinancialSnapshots(): Promise<ActionResult<FinancialSnapshot[]>> {
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
      .from('financial_snapshot')
      .select('*')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: false })

    if (error) {
      console.error('Error fetching financial snapshots:', error)
      return {
        success: false,
        error: 'Failed to fetch financial snapshots',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error in getFinancialSnapshots:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get a specific financial snapshot by ID
 */
export async function getFinancialSnapshot(
  id: string
): Promise<ActionResult<FinancialSnapshot | null>> {
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
      .from('financial_snapshot')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching financial snapshot:', error)
      return {
        success: false,
        error: 'Failed to fetch financial snapshot',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in getFinancialSnapshot:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get the most recent financial snapshot
 */
export async function getLatestFinancialSnapshot(): Promise<
  ActionResult<FinancialSnapshot | null>
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

    const { data, error } = await supabase
      .from('financial_snapshot')
      .select('*')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching latest financial snapshot:', error)
      return {
        success: false,
        error: 'Failed to fetch latest financial snapshot',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in getLatestFinancialSnapshot:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Create a new financial snapshot
 */
export async function createFinancialSnapshot(
  snapshotData: Omit<FinancialSnapshot, 'id' | 'user_id' | 'created_at'>
): Promise<ActionResult<FinancialSnapshot>> {
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
    const validationResult = financialSnapshotSchema.safeParse(snapshotData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid snapshot data',
      }
    }

    // Calculate disposable income if not provided
    let disposableIncome = validationResult.data.monthly_disposable_income
    if (
      disposableIncome === null &&
      validationResult.data.monthly_net_income !== null &&
      validationResult.data.monthly_allowable_expenses !== null
    ) {
      disposableIncome =
        validationResult.data.monthly_net_income - validationResult.data.monthly_allowable_expenses
    }

    const { data, error } = await supabase
      .from('financial_snapshot')
      .insert({
        user_id: user.id,
        ...validationResult.data,
        monthly_disposable_income: disposableIncome,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating financial snapshot:', error)
      return {
        success: false,
        error: 'Failed to create financial snapshot',
      }
    }

    revalidatePath('/dashboard/financial')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in createFinancialSnapshot:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update a financial snapshot
 */
export async function updateFinancialSnapshot(
  id: string,
  snapshotData: Partial<Omit<FinancialSnapshot, 'id' | 'user_id' | 'created_at'>>
): Promise<ActionResult<FinancialSnapshot>> {
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
    const validationResult = updateSnapshotSchema.safeParse(snapshotData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid snapshot data',
      }
    }

    // Get existing snapshot to calculate disposable income if needed
    const { data: existing } = await supabase
      .from('financial_snapshot')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      return {
        success: false,
        error: 'Financial snapshot not found',
      }
    }

    // Calculate disposable income
    const netIncome = validationResult.data.monthly_net_income ?? existing.monthly_net_income
    const allowableExpenses =
      validationResult.data.monthly_allowable_expenses ?? existing.monthly_allowable_expenses

    let disposableIncome = validationResult.data.monthly_disposable_income
    if (disposableIncome === undefined && netIncome !== null && allowableExpenses !== null) {
      disposableIncome = netIncome - allowableExpenses
    }

    const { data, error } = await supabase
      .from('financial_snapshot')
      .update({
        ...validationResult.data,
        monthly_disposable_income: disposableIncome,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating financial snapshot:', error)
      return {
        success: false,
        error: 'Failed to update financial snapshot',
      }
    }

    revalidatePath('/dashboard/financial')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in updateFinancialSnapshot:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a financial snapshot
 */
export async function deleteFinancialSnapshot(id: string): Promise<ActionResult<void>> {
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
      .from('financial_snapshot')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting financial snapshot:', error)
      return {
        success: false,
        error: 'Failed to delete financial snapshot',
      }
    }

    revalidatePath('/dashboard/financial')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('Unexpected error in deleteFinancialSnapshot:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Calculate disposable income from snapshot data
 */
export function calculateDisposableIncome(
  monthlyNetIncome: number,
  monthlyAllowableExpenses: number
): number {
  return monthlyNetIncome - monthlyAllowableExpenses
}

/**
 * Calculate reasonable collection potential (RCP)
 * RCP = (Monthly Disposable Income × Future Income Months) + Total Asset Equity
 */
export function calculateReasonableCollectionPotential(
  monthlyDisposableIncome: number,
  futureIncomeMonths: number,
  totalAssetEquity: number
): number {
  return monthlyDisposableIncome * futureIncomeMonths + totalAssetEquity
}

/**
 * Get allowable expenses for a snapshot
 */
export async function getAllowableExpenses(
  snapshotId: string
): Promise<ActionResult<AllowableExpense[]>> {
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

    // Verify the snapshot belongs to the user
    const { data: snapshot } = await supabase
      .from('financial_snapshot')
      .select('id')
      .eq('id', snapshotId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!snapshot) {
      return {
        success: false,
        error: 'Financial snapshot not found',
      }
    }

    const { data, error } = await supabase
      .from('irs_allowable_expenses')
      .select('*')
      .eq('financial_snapshot_id', snapshotId)
      .eq('user_id', user.id)
      .order('category')

    if (error) {
      console.error('Error fetching allowable expenses:', error)
      return {
        success: false,
        error: 'Failed to fetch allowable expenses',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error in getAllowableExpenses:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Create or update an allowable expense
 */
export async function upsertAllowableExpense(
  expenseData: Omit<AllowableExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<ActionResult<AllowableExpense>> {
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
    const validationResult = allowableExpenseSchema.safeParse(expenseData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid expense data',
      }
    }

    // Calculate variance if not provided
    let variance = validationResult.data.variance
    if (
      variance === null &&
      validationResult.data.actual_amount !== null &&
      validationResult.data.irs_allowable_amount !== null
    ) {
      variance = validationResult.data.actual_amount - validationResult.data.irs_allowable_amount
    }

    const { data, error } = await supabase
      .from('irs_allowable_expenses')
      .upsert({
        user_id: user.id,
        ...validationResult.data,
        variance,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting allowable expense:', error)
      return {
        success: false,
        error: 'Failed to save allowable expense',
      }
    }

    revalidatePath('/dashboard/financial')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in upsertAllowableExpense:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
