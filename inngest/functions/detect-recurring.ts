import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { detectRecurringPatterns, calculateNextExpected } from '@/lib/cash-flow/recurring-detector'

/**
 * Background function to automatically detect recurring transaction patterns
 * Triggered after transaction sync completes
 */
export const detectRecurring = inngest.createFunction(
  {
    id: 'detect-recurring-transactions',
    name: 'Detect Recurring Transaction Patterns',
    retries: 3,
  },
  { event: 'transactions/sync.completed' },
  async ({ event, step }) => {
    const { userId } = event.data

    // Step 1: Fetch all transactions for the user (last 12 months)
    const transactions = await step.run('fetch-transactions', async () => {
      const supabase = await createClient()

      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', twelveMonthsAgo.toISOString().split('T')[0])
        .eq('is_removed', false)
        .order('date', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`)
      }

      return data || []
    })

    if (transactions.length < 3) {
      return {
        success: true,
        message: 'Not enough transactions to detect patterns',
        detected: 0,
        updated: 0,
      }
    }

    // Step 2: Detect recurring patterns
    const patterns = await step.run('detect-patterns', async () => {
      return detectRecurringPatterns(transactions, 3)
    })

    if (patterns.length === 0) {
      return {
        success: true,
        message: 'No recurring patterns detected',
        detected: 0,
        updated: 0,
      }
    }

    // Step 3: Save or update patterns in database
    const { detected, updated } = await step.run('save-patterns', async () => {
      const supabase = await createClient()
      let detectedCount = 0
      let updatedCount = 0

      for (const pattern of patterns) {
        // Check if this merchant already has a recurring pattern
        const { data: existing, error: existingError } = await supabase
          .from('recurring_transactions')
          .select('id, merchant_name, frequency, is_active')
          .eq('user_id', userId)
          .eq('merchant_name', pattern.merchantName)
          .maybeSingle()

        if (existingError && existingError.code !== 'PGRST116') {
          console.error('Error checking existing pattern:', existingError)
          continue
        }

        if (existing) {
          // Update existing pattern
          // Only update if:
          // 1. The pattern is still active
          // 2. The frequency matches (don't change user's manual settings)
          // 3. Or if the existing pattern was auto-detected and we have new data

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
          } else {
            console.error('Error updating pattern:', updateError)
          }
        } else {
          // Create new pattern
          // Only create patterns with medium or high confidence
          if (pattern.confidence === 'low') {
            continue
          }

          const { error: insertError } = await supabase.from('recurring_transactions').insert({
            user_id: userId,
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
          } else {
            console.error('Error inserting pattern:', insertError)
          }
        }
      }

      return { detected: detectedCount, updated: updatedCount }
    })

    // Step 4: Update next_expected dates for active recurring items
    await step.run('update-next-expected-dates', async () => {
      const supabase = await createClient()

      // Get all active recurring items
      const { data: activeItems, error: fetchError } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (fetchError || !activeItems) {
        console.error('Error fetching active recurring items:', fetchError)
        return
      }

      // Check if any need their next_expected updated
      const today = new Date()
      for (const item of activeItems) {
        if (!item.next_expected || !item.frequency) continue

        const nextExpected = new Date(item.next_expected)

        // If next_expected is in the past, calculate the new next_expected
        if (nextExpected < today) {
          const newNextExpected = calculateNextExpected(today, item.frequency, item.expected_day)

          await supabase
            .from('recurring_transactions')
            .update({
              next_expected: newNextExpected.toISOString().split('T')[0],
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.id)
        }
      }
    })

    return {
      success: true,
      message: `Detected ${detected} new recurring patterns and updated ${updated} existing patterns`,
      detected,
      updated,
      totalPatterns: patterns.length,
    }
  }
)

// Export as an array for easy registration
export const recurringDetectionFunctions = [detectRecurring]
