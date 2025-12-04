import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface CategoryResult {
  category: string
  is_tax_deductible: boolean
  confidence: number
}

export interface MerchantCacheEntry {
  merchant_name: string
  category: string
  is_tax_deductible: boolean
  confidence: number
  created_at: string
  updated_at: string
}

/**
 * Get cached category for a merchant from the database
 * We'll store these in a new table called merchant_category_cache
 */
async function getCachedCategory(
  userId: string,
  merchantName: string
): Promise<CategoryResult | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('merchant_category_cache')
    .select('category, is_tax_deductible, confidence')
    .eq('user_id', userId)
    .eq('merchant_name', merchantName.toLowerCase())
    .single()

  if (error || !data) {
    return null
  }

  return {
    category: data.category,
    is_tax_deductible: data.is_tax_deductible,
    confidence: data.confidence,
  }
}

/**
 * Cache a merchant's category in the database for future use
 */
async function setCachedCategory(
  userId: string,
  merchantName: string,
  result: CategoryResult
): Promise<void> {
  const supabase = await createClient()

  await supabase.from('merchant_category_cache').upsert(
    {
      user_id: userId,
      merchant_name: merchantName.toLowerCase(),
      category: result.category,
      is_tax_deductible: result.is_tax_deductible,
      confidence: result.confidence,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,merchant_name',
    }
  )
}

/**
 * Categorize a single transaction using Claude Haiku
 * First checks cache, then calls Claude API if needed
 */
export async function categorizeTransaction(tx: Tables<'transactions'>): Promise<CategoryResult> {
  // Check cache first
  if (tx.merchant_name) {
    const cached = await getCachedCategory(tx.user_id, tx.merchant_name)
    if (cached && cached.confidence >= 0.8) {
      return cached
    }
  }

  // Call Claude API with retry logic
  let retries = 3
  let lastError: Error | null = null

  while (retries > 0) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Categorize this transaction for tax purposes:
Merchant: ${tx.merchant_name || 'Unknown'}
Amount: $${Math.abs(tx.amount)}
Date: ${tx.date}

Common categories: Business Expenses, Office Supplies, Meals & Entertainment, Travel, Auto & Mileage, Home Office, Professional Services, Marketing & Advertising, Insurance, Utilities, Personal, Other

Respond with ONLY valid JSON in this exact format:
{"category": "category name", "is_tax_deductible": true or false, "confidence": 0.0-1.0}`,
          },
        ],
      })

      // Parse the response
      const content = response.content[0]
      if (!content || content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      // Extract JSON from the response (Claude might add markdown formatting)
      let jsonText = content.text.trim()
      // Remove markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

      const result = JSON.parse(jsonText) as CategoryResult

      // Validate the result
      if (
        typeof result.category !== 'string' ||
        typeof result.is_tax_deductible !== 'boolean' ||
        typeof result.confidence !== 'number' ||
        result.confidence < 0 ||
        result.confidence > 1
      ) {
        throw new Error('Invalid response format from Claude')
      }

      // Cache the result if confidence is high enough and we have a merchant name
      if (tx.merchant_name && result.confidence >= 0.7) {
        await setCachedCategory(tx.user_id, tx.merchant_name, result)
      }

      return result
    } catch (error) {
      lastError = error as Error
      retries--

      // Check if it's a rate limit error
      if (error instanceof Anthropic.APIError && error.status === 429) {
        // Wait before retrying (exponential backoff)
        const waitTime = (4 - retries) * 2000
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      } else if (retries === 0) {
        // No more retries left
        break
      } else {
        // Wait a bit before retrying other errors
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }

  // If we get here, all retries failed
  console.error('Failed to categorize transaction:', lastError)

  // Return a default categorization
  return {
    category: 'Uncategorized',
    is_tax_deductible: false,
    confidence: 0.0,
  }
}

/**
 * Categorize multiple transactions in batch
 * Processes in chunks to avoid overwhelming the API
 */
export async function categorizeBatch(
  transactions: Tables<'transactions'>[],
  batchSize: number = 5
): Promise<Map<string, CategoryResult>> {
  const results = new Map<string, CategoryResult>()

  // Process in chunks
  for (let i = 0; i < transactions.length; i += batchSize) {
    const chunk = transactions.slice(i, i + batchSize)

    // Process chunk in parallel
    const chunkResults = await Promise.all(
      chunk.map(async (tx) => {
        const result = await categorizeTransaction(tx)
        return { id: tx.id, result }
      })
    )

    // Store results
    chunkResults.forEach(({ id, result }) => {
      results.set(id, result)
    })

    // Wait between chunks to respect rate limits
    if (i + batchSize < transactions.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return results
}

/**
 * Update user's correction to the cache
 * When a user manually corrects a category, we should update the cache
 */
export async function updateCategoryCache(
  userId: string,
  merchantName: string,
  category: string,
  isTaxDeductible: boolean
): Promise<void> {
  await setCachedCategory(userId, merchantName, {
    category,
    is_tax_deductible: isTaxDeductible,
    confidence: 1.0, // User corrections have 100% confidence
  })
}
