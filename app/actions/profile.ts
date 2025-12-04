'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult, Tables, InsertTables, UpdateTables } from '@/types'
import { z } from 'zod'

export type UserProfile = Tables<'user_profile'>

// Zod schema for profile validation
const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100).nullable(),
  last_name: z.string().min(1, 'Last name is required').max(100).nullable(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .nullable(),
  filing_status: z
    .enum([
      'single',
      'married_filing_jointly',
      'married_filing_separately',
      'head_of_household',
      'qualifying_widow',
    ])
    .nullable(),
  dependents: z.number().int().min(0).max(50).default(0),
  state: z.string().length(2, 'State must be 2 letter code').nullable(),
  county: z.string().min(1).max(100).nullable(),
  employment_status: z
    .enum(['employed', 'self_employed', 'unemployed', 'retired', 'disabled'])
    .nullable(),
  has_health_conditions: z.boolean().default(false),
  health_conditions_notes: z.string().max(1000).nullable(),
})

const updateProfileSchema = profileSchema.partial()

/**
 * Get user profile
 */
export async function getProfile(): Promise<ActionResult<UserProfile | null>> {
  try {
    const supabase = await createClient()

    // Get current user
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

    // Fetch profile
    const { data, error } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching profile:', error)
      return {
        success: false,
        error: 'Failed to fetch profile',
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in getProfile:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  profileData: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ActionResult<UserProfile>> {
  try {
    const supabase = await createClient()

    // Get current user
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
    const validationResult = updateProfileSchema.safeParse(profileData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid profile data',
      }
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('user_profile')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    let result

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_profile')
        .update({
          ...validationResult.data,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('user_profile')
        .insert({
          user_id: user.id,
          ...validationResult.data,
        })
        .select()
        .single()

      result = { data, error }
    }

    if (result.error) {
      console.error('Error updating profile:', result.error)
      return {
        success: false,
        error: 'Failed to update profile',
      }
    }

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    console.error('Unexpected error in updateProfile:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Create initial user profile (typically called after signup)
 */
export async function createProfile(
  profileData: Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<ActionResult<UserProfile>> {
  try {
    const supabase = await createClient()

    // Get current user
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
    const validationResult = profileSchema.safeParse(profileData)
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || 'Invalid profile data',
      }
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profile')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingProfile) {
      return {
        success: false,
        error: 'Profile already exists',
      }
    }

    // Create profile
    const { data, error } = await supabase
      .from('user_profile')
      .insert({
        user_id: user.id,
        ...validationResult.data,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return {
        success: false,
        error: 'Failed to create profile',
      }
    }

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Unexpected error in createProfile:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete user profile
 */
export async function deleteProfile(): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    // Get current user
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

    const { error } = await supabase.from('user_profile').delete().eq('user_id', user.id)

    if (error) {
      console.error('Error deleting profile:', error)
      return {
        success: false,
        error: 'Failed to delete profile',
      }
    }

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    console.error('Unexpected error in deleteProfile:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
