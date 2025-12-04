'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Tables, InsertTables, UpdateTables } from '@/types'
import { z } from 'zod'

export type IRSCorrespondence = Tables<'irs_correspondence'>

// Zod schema for validation
const correspondenceSchema = z.object({
  tax_debt_id: z.string().uuid().nullable(),
  notice_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notice_type: z.string().min(1).max(200),
  notice_number: z.string().max(100).nullable(),
  response_deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  status: z
    .enum(['received', 'in_review', 'response_sent', 'resolved', 'escalated'])
    .default('received'),
  document_id: z.string().uuid().nullable(),
  notes: z.string().max(2000).nullable(),
})

const updateCorrespondenceSchema = correspondenceSchema.partial()

/**
 * Get all IRS correspondence for the current user
 */
export async function getCorrespondence(): Promise<ActionResult<IRSCorrespondence[]>> {
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
      .from('irs_correspondence')
      .select('*')
      .eq('user_id', user.id)
      .order('notice_date', { ascending: false })

    if (error) {
      console.error('Error fetching correspondence:', error)
      return {
        success: false,
        error: 'Failed to fetch correspondence',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error in getCorrespondence:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get a specific correspondence by ID
 */
export async function getCorrespondenceById(
  id: string
): Promise<ActionResult<IRSCorrespondence | null>> {
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
      .from('irs_correspondence')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching correspondence:', error)
      return {
        success: false,
        error: 'Failed to fetch correspondence',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in getCorrespondenceById:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get correspondence with upcoming deadlines
 */
export async function getUpcomingDeadlines(
  daysAhead: number = 30
): Promise<ActionResult<IRSCorrespondence[]>> {
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
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    const { data, error } = await supabase
      .from('irs_correspondence')
      .select('*')
      .eq('user_id', user.id)
      .not('response_deadline', 'is', null)
      .gte('response_deadline', today.toISOString().split('T')[0])
      .lte('response_deadline', futureDate.toISOString().split('T')[0])
      .in('status', ['received', 'in_review'])
      .order('response_deadline', { ascending: true })

    if (error) {
      console.error('Error fetching upcoming deadlines:', error)
      return {
        success: false,
        error: 'Failed to fetch upcoming deadlines',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error in getUpcomingDeadlines:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get overdue correspondence (past deadline)
 */
export async function getOverdueCorrespondence(): Promise<ActionResult<IRSCorrespondence[]>> {
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

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('irs_correspondence')
      .select('*')
      .eq('user_id', user.id)
      .not('response_deadline', 'is', null)
      .lt('response_deadline', today)
      .in('status', ['received', 'in_review'])
      .order('response_deadline', { ascending: true })

    if (error) {
      console.error('Error fetching overdue correspondence:', error)
      return {
        success: false,
        error: 'Failed to fetch overdue correspondence',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error in getOverdueCorrespondence:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get correspondence for a specific tax debt
 */
export async function getCorrespondenceForDebt(
  taxDebtId: string
): Promise<ActionResult<IRSCorrespondence[]>> {
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
    const { data: taxDebt } = await supabase
      .from('tax_debt')
      .select('id')
      .eq('id', taxDebtId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!taxDebt) {
      return {
        success: false,
        error: 'Tax debt not found',
      }
    }

    const { data, error } = await supabase
      .from('irs_correspondence')
      .select('*')
      .eq('tax_debt_id', taxDebtId)
      .order('notice_date', { ascending: false })

    if (error) {
      console.error('Error fetching correspondence for debt:', error)
      return {
        success: false,
        error: 'Failed to fetch correspondence',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Unexpected error in getCorrespondenceForDebt:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Create new IRS correspondence
 */
export async function createCorrespondence(
  correspondenceData: Omit<IRSCorrespondence, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<ActionResult<IRSCorrespondence>> {
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
    const validationResult = correspondenceSchema.safeParse(correspondenceData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid correspondence data',
      }
    }

    // If tax_debt_id is provided, verify it belongs to the user
    if (validationResult.data.tax_debt_id) {
      const { data: taxDebt } = await supabase
        .from('tax_debt')
        .select('id')
        .eq('id', validationResult.data.tax_debt_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!taxDebt) {
        return {
          success: false,
          error: 'Tax debt not found',
        }
      }
    }

    const { data, error } = await supabase
      .from('irs_correspondence')
      .insert({
        user_id: user.id,
        ...validationResult.data,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating correspondence:', error)
      return {
        success: false,
        error: 'Failed to create correspondence',
      }
    }

    revalidatePath('/dashboard/correspondence')
    revalidatePath('/dashboard/tax-debt')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in createCorrespondence:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update IRS correspondence
 */
export async function updateCorrespondence(
  id: string,
  correspondenceData: Partial<
    Omit<IRSCorrespondence, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  >
): Promise<ActionResult<IRSCorrespondence>> {
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
    const validationResult = updateCorrespondenceSchema.safeParse(correspondenceData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid correspondence data',
      }
    }

    // If tax_debt_id is being updated, verify it belongs to the user
    if (validationResult.data.tax_debt_id) {
      const { data: taxDebt } = await supabase
        .from('tax_debt')
        .select('id')
        .eq('id', validationResult.data.tax_debt_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!taxDebt) {
        return {
          success: false,
          error: 'Tax debt not found',
        }
      }
    }

    const { data, error } = await supabase
      .from('irs_correspondence')
      .update({
        ...validationResult.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating correspondence:', error)
      return {
        success: false,
        error: 'Failed to update correspondence',
      }
    }

    revalidatePath('/dashboard/correspondence')
    revalidatePath('/dashboard/tax-debt')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in updateCorrespondence:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete IRS correspondence
 */
export async function deleteCorrespondence(id: string): Promise<ActionResult<void>> {
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
      .from('irs_correspondence')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting correspondence:', error)
      return {
        success: false,
        error: 'Failed to delete correspondence',
      }
    }

    revalidatePath('/dashboard/correspondence')
    revalidatePath('/dashboard/tax-debt')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('Unexpected error in deleteCorrespondence:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update correspondence status
 */
export async function updateCorrespondenceStatus(
  id: string,
  status: IRSCorrespondence['status']
): Promise<ActionResult<IRSCorrespondence>> {
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
      .from('irs_correspondence')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating correspondence status:', error)
      return {
        success: false,
        error: 'Failed to update correspondence status',
      }
    }

    revalidatePath('/dashboard/correspondence')
    revalidatePath('/dashboard/tax-debt')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in updateCorrespondenceStatus:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get count of items requiring attention (received or in_review with upcoming/past deadlines)
 */
export async function getCorrespondenceRequiringAttention(): Promise<
  ActionResult<{
    overdue: number
    upcoming: number
    total: number
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

    const today = new Date().toISOString().split('T')[0]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const futureDateStr = futureDate.toISOString().split('T')[0]

    // Get overdue count
    const { count: overdueCount, error: overdueError } = await supabase
      .from('irs_correspondence')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('response_deadline', 'is', null)
      .lt('response_deadline', today)
      .in('status', ['received', 'in_review'])

    // Get upcoming count
    const { count: upcomingCount, error: upcomingError } = await supabase
      .from('irs_correspondence')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('response_deadline', 'is', null)
      .gte('response_deadline', today)
      .lte('response_deadline', futureDateStr)
      .in('status', ['received', 'in_review'])

    if (overdueError || upcomingError) {
      console.error('Error counting correspondence:', overdueError || upcomingError)
      return {
        success: false,
        error: 'Failed to count correspondence requiring attention',
      }
    }

    const overdue = overdueCount || 0
    const upcoming = upcomingCount || 0

    return {
      success: true,
      data: {
        overdue,
        upcoming,
        total: overdue + upcoming,
      },
    }
  } catch (error) {
    console.error('Unexpected error in getCorrespondenceRequiringAttention:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
