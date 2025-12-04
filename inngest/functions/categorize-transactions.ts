import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { categorizeBatch, updateCategoryCache } from '@/lib/claude/categorize'

/**
 * Background function to categorize transactions in batch
 * Triggered by:
 * 1. transactions/sync.completed - After Plaid sync completes
 * 2. transactions/categorize.batch - Manual trigger for re-categorization
 */
export const categorizeTransactions = inngest.createFunction(
  {
    id: 'categorize-transactions',
    name: 'Categorize Transactions with AI',
    retries: 3,
  },
  [{ event: 'transactions/sync.completed' }, { event: 'transactions/categorize.batch' }],
  async ({ event, step }) => {
    const { userId, transactionIds } = event.data as {
      userId: string
      transactionIds?: string[]
    }

    // Step 1: Fetch uncategorized transactions
    const transactions = await step.run('fetch-uncategorized-transactions', async () => {
      const supabase = await createClient()

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .is('category', null)

      // If specific transaction IDs provided, filter by them
      if (transactionIds && transactionIds.length > 0) {
        query = query.in('id', transactionIds)
      }

      const { data, error } = await query.limit(100) // Process up to 100 at a time

      if (error) {
        throw new Error(`Failed to fetch transactions: ${error.message}`)
      }

      return data || []
    })

    if (transactions.length === 0) {
      return { success: true, message: 'No transactions to categorize' }
    }

    // Step 2: Categorize and update transactions in batches
    const updateCount = await step.run('categorize-and-update', async () => {
      // Categorize the batch
      const results = await categorizeBatch(transactions, 5)

      // Update transactions with categories
      const supabase = await createClient()
      let successCount = 0

      // Convert Map to array for iteration
      for (const [transactionId, result] of results) {
        const { error } = await supabase
          .from('transactions')
          .update({
            category: result.category,
            category_confidence: result.confidence,
            is_tax_deductible: result.is_tax_deductible,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId)

        if (!error) {
          successCount++
        }
      }

      return successCount
    })

    return {
      success: true,
      message: `Categorized ${updateCount} out of ${transactions.length} transactions`,
      categorized: updateCount,
      total: transactions.length,
    }
  }
)

/**
 * Function to handle user category corrections
 * Updates the merchant category cache when a user corrects a category
 */
export const handleCategoryCorrection = inngest.createFunction(
  {
    id: 'handle-category-correction',
    name: 'Handle Category Correction',
  },
  { event: 'transactions/category.corrected' },
  async ({ event, step }) => {
    const { userId, transactionId, merchantName, category, isTaxDeductible } = event.data

    // Update the cache
    await step.run('update-cache', async () => {
      await updateCategoryCache(userId, merchantName, category, isTaxDeductible)
    })

    // Optionally: Find and update other transactions from the same merchant
    await step.run('update-similar-transactions', async () => {
      const supabase = await createClient()

      // Find other uncategorized transactions from the same merchant
      const { data: similarTransactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('merchant_name', merchantName)
        .neq('id', transactionId) // Exclude the current transaction
        .is('category', null)
        .limit(50)

      if (similarTransactions && similarTransactions.length > 0) {
        // Update them with the corrected category
        await supabase
          .from('transactions')
          .update({
            category,
            is_tax_deductible: isTaxDeductible,
            category_confidence: 1.0, // User correction has full confidence
            updated_at: new Date().toISOString(),
          })
          .in(
            'id',
            similarTransactions.map((t) => t.id)
          )

        return similarTransactions.length
      }

      return 0
    })

    return {
      success: true,
      message: 'Category correction applied',
    }
  }
)

// Export all functions as an array for easy registration
export const categorizationFunctions = [categorizeTransactions, handleCategoryCorrection]
