'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'
import { z } from 'zod'

// Zod schemas for validation
const categorySchema = z.object({
  name: z.string().min(1).max(100),
  parent_id: z.string().uuid().nullable().optional(),
  is_tax_deductible: z.boolean().default(false),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
})

const updateCategorySchema = categorySchema.partial()

const categoryRuleSchema = z.object({
  category_name: z.string().min(1),
  merchant_pattern: z.string().min(1),
  match_type: z.enum(['contains', 'starts_with', 'ends_with', 'exact']).default('contains'),
  priority: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
})

interface Category {
  id: string
  name: string
  parent_id: string | null
  is_tax_deductible: boolean
  icon: string | null
  color: string | null
}

interface CategoryRule {
  id: string
  category_name: string
  merchant_pattern: string
  match_type: string
  priority: number
  is_active: boolean
}

/**
 * Get all categories for the current user
 */
export async function getCategories(): Promise<ActionResult<{ categories: Category[] }>> {
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

    // Get categories (system default + user custom)
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
      return { success: false, error: 'Failed to fetch categories' }
    }

    return { success: true, data: { categories: categories || [] } }
  } catch (error) {
    console.error('Error in getCategories:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create a new custom category
 */
export async function createCategory(
  input: z.infer<typeof categorySchema>
): Promise<ActionResult<{ category: Category }>> {
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
    const validatedData = categorySchema.parse(input)

    // Check if category name already exists for this user
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', validatedData.name)
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .single()

    if (existing) {
      return { success: false, error: 'A category with this name already exists' }
    }

    // Create category
    const { data: category, error: insertError } = await supabase
      .from('categories')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating category:', insertError)
      return { success: false, error: 'Failed to create category' }
    }

    revalidatePath('/transactions')
    revalidatePath('/settings/categories')
    return { success: true, data: { category } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid input' }
    }
    console.error('Error in createCategory:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a category
 */
export async function updateCategory(
  categoryId: string,
  updates: z.infer<typeof updateCategorySchema>
): Promise<ActionResult<{ category: Category }>> {
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
    const validatedData = updateCategorySchema.parse(updates)

    // Verify category belongs to user (can't edit system categories)
    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('id, user_id')
      .eq('id', categoryId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Category not found' }
    }

    if (existing.user_id !== user.id) {
      return { success: false, error: 'Cannot edit system categories' }
    }

    // Update category
    const { data: category, error: updateError } = await supabase
      .from('categories')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', categoryId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating category:', updateError)
      return { success: false, error: 'Failed to update category' }
    }

    revalidatePath('/transactions')
    revalidatePath('/settings/categories')
    return { success: true, data: { category } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid input' }
    }
    console.error('Error in updateCategory:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: string): Promise<ActionResult<void>> {
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

    // Verify category belongs to user (can't delete system categories)
    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('id, user_id')
      .eq('id', categoryId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Category not found' }
    }

    if (existing.user_id !== user.id) {
      return { success: false, error: 'Cannot delete system categories' }
    }

    // Delete category
    const { error: deleteError } = await supabase.from('categories').delete().eq('id', categoryId)

    if (deleteError) {
      console.error('Error deleting category:', deleteError)
      return { success: false, error: 'Failed to delete category' }
    }

    revalidatePath('/transactions')
    revalidatePath('/settings/categories')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteCategory:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get category rules for the current user
 */
export async function getCategoryRules(): Promise<ActionResult<{ rules: CategoryRule[] }>> {
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

    // Get rules
    const { data: rules, error } = await supabase
      .from('category_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false })

    if (error) {
      console.error('Error fetching category rules:', error)
      return { success: false, error: 'Failed to fetch category rules' }
    }

    return { success: true, data: { rules: rules || [] } }
  } catch (error) {
    console.error('Error in getCategoryRules:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create a category rule
 */
export async function createCategoryRule(
  input: z.infer<typeof categoryRuleSchema>
): Promise<ActionResult<{ rule: CategoryRule }>> {
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
    const validatedData = categoryRuleSchema.parse(input)

    // Create rule
    const { data: rule, error: insertError } = await supabase
      .from('category_rules')
      .insert({
        ...validatedData,
        user_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating category rule:', insertError)
      return { success: false, error: 'Failed to create category rule' }
    }

    revalidatePath('/settings/categories')
    return { success: true, data: { rule } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Invalid input' }
    }
    console.error('Error in createCategoryRule:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update a category rule
 */
export async function updateCategoryRule(
  ruleId: string,
  updates: Partial<z.infer<typeof categoryRuleSchema>>
): Promise<ActionResult<{ rule: CategoryRule }>> {
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

    // Verify rule belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('category_rules')
      .select('id, user_id')
      .eq('id', ruleId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Rule not found' }
    }

    if (existing.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Update rule
    const { data: rule, error: updateError } = await supabase
      .from('category_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating category rule:', updateError)
      return { success: false, error: 'Failed to update category rule' }
    }

    revalidatePath('/settings/categories')
    return { success: true, data: { rule } }
  } catch (error) {
    console.error('Error in updateCategoryRule:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a category rule
 */
export async function deleteCategoryRule(ruleId: string): Promise<ActionResult<void>> {
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

    // Verify rule belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('category_rules')
      .select('id, user_id')
      .eq('id', ruleId)
      .single()

    if (fetchError || !existing) {
      return { success: false, error: 'Rule not found' }
    }

    if (existing.user_id !== user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Delete rule
    const { error: deleteError } = await supabase.from('category_rules').delete().eq('id', ruleId)

    if (deleteError) {
      console.error('Error deleting category rule:', deleteError)
      return { success: false, error: 'Failed to delete category rule' }
    }

    revalidatePath('/settings/categories')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteCategoryRule:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Apply category rules to existing uncategorized transactions
 */
export async function applyCategorizationRules(): Promise<ActionResult<{ updated: number }>> {
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

    // Get active rules ordered by priority
    const { data: rules, error: rulesError } = await supabase
      .from('category_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (rulesError) {
      console.error('Error fetching rules:', rulesError)
      return { success: false, error: 'Failed to fetch rules' }
    }

    if (!rules || rules.length === 0) {
      return { success: true, data: { updated: 0 } }
    }

    // Get uncategorized transactions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('id, merchant_name')
      .eq('user_id', user.id)
      .is('category', null)
      .eq('is_removed', false)

    if (txError) {
      console.error('Error fetching transactions:', txError)
      return { success: false, error: 'Failed to fetch transactions' }
    }

    if (!transactions || transactions.length === 0) {
      return { success: true, data: { updated: 0 } }
    }

    // Apply rules to transactions
    let updatedCount = 0
    const updates: Array<{ id: string; category: string }> = []

    for (const tx of transactions) {
      const merchantName = (tx.merchant_name || '').toLowerCase()

      for (const rule of rules) {
        const pattern = rule.merchant_pattern.toLowerCase()
        let matches = false

        switch (rule.match_type) {
          case 'exact':
            matches = merchantName === pattern
            break
          case 'starts_with':
            matches = merchantName.startsWith(pattern)
            break
          case 'ends_with':
            matches = merchantName.endsWith(pattern)
            break
          case 'contains':
          default:
            matches = merchantName.includes(pattern)
            break
        }

        if (matches) {
          updates.push({ id: tx.id, category: rule.category_name })
          break // First matching rule wins
        }
      }
    }

    // Batch update transactions
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ category: update.category })
        .eq('id', update.id)

      if (!updateError) {
        updatedCount++
      }
    }

    revalidatePath('/transactions')
    return { success: true, data: { updated: updatedCount } }
  } catch (error) {
    console.error('Error in applyCategorizationRules:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
