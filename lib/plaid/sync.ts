import { createClient } from '@/lib/supabase/server'
import { plaidClient } from './client'
import { Database } from '@/types/database'
import { Transaction as PlaidTransaction, RemovedTransaction } from 'plaid'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type DbTransaction = Database['public']['Tables']['transactions']['Insert']
type DbAccount = Database['public']['Tables']['accounts']['Insert']

export interface SyncResult {
  added: number
  modified: number
  removed: number
  hasMore: boolean
  error?: string
}

/**
 * Syncs transactions for a Plaid item using the Transactions Sync API
 * This function handles:
 * - Pagination using cursor-based sync
 * - Transaction deduplication using transaction_id as unique key
 * - Modified transactions (updates)
 * - Removed transactions (soft delete with is_removed flag)
 */
export async function syncTransactions(
  supabase: SupabaseClient,
  plaidItemId: string,
  userId: string
): Promise<SyncResult> {
  const result: SyncResult = {
    added: 0,
    modified: 0,
    removed: 0,
    hasMore: false,
  }

  try {
    // Get the Plaid item from database
    const { data: plaidItem, error: itemError } = await supabase
      .from('plaid_items')
      .select('*')
      .eq('id', plaidItemId)
      .eq('user_id', userId)
      .single()

    if (itemError || !plaidItem) {
      throw new Error('Plaid item not found')
    }

    const accessToken = plaidItem.access_token
    let cursor = plaidItem.cursor || undefined

    // Fetch transactions using Plaid's Transactions Sync API
    // This API returns added, modified, and removed transactions
    let hasMore = true
    const MAX_ITERATIONS = 10 // Prevent infinite loops

    for (let i = 0; i < MAX_ITERATIONS && hasMore; i++) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor,
      })

      const { added, modified, removed, next_cursor, has_more } = response.data

      // Process added transactions
      for (const transaction of added) {
        await processAddedTransaction(supabase, transaction, plaidItem.id, userId)
        result.added++
      }

      // Process modified transactions
      for (const transaction of modified) {
        await processModifiedTransaction(supabase, transaction, plaidItem.id, userId)
        result.modified++
      }

      // Process removed transactions
      for (const removedTxn of removed) {
        await processRemovedTransaction(supabase, removedTxn, userId)
        result.removed++
      }

      // Update cursor for next iteration
      cursor = next_cursor
      hasMore = has_more

      // Update cursor in database after each batch
      await supabase.from('plaid_items').update({ cursor: next_cursor }).eq('id', plaidItemId)
    }

    result.hasMore = hasMore

    // Sync accounts and update balances
    await syncAccounts(supabase, accessToken, plaidItem.id, userId)

    return result
  } catch (error) {
    console.error('Error syncing transactions:', error)
    result.error = error instanceof Error ? error.message : 'Unknown error'
    return result
  }
}

/**
 * Process an added transaction from Plaid
 * Uses upsert (insert or update on conflict) to handle deduplication
 */
async function processAddedTransaction(
  supabase: SupabaseClient,
  transaction: PlaidTransaction,
  plaidItemId: string,
  userId: string
): Promise<void> {
  // Get or create account
  const accountId = await ensureAccount(supabase, transaction.account_id, plaidItemId, userId)

  // Prepare transaction data
  const dbTransaction: DbTransaction = {
    user_id: userId,
    account_id: accountId,
    transaction_id: transaction.transaction_id,
    date: transaction.date,
    amount: transaction.amount,
    merchant_name: transaction.merchant_name || transaction.name,
    category: transaction.personal_finance_category?.primary || null,
    category_confidence: null,
    is_tax_deductible: false,
    is_recurring: false,
    is_removed: false,
  }

  // Upsert transaction (insert or update if exists)
  const { error } = await supabase.from('transactions').upsert(dbTransaction, {
    onConflict: 'account_id,transaction_id',
    ignoreDuplicates: false,
  })

  if (error) {
    console.error('Error upserting transaction:', error)
    throw error
  }
}

/**
 * Process a modified transaction from Plaid
 * Updates existing transaction data
 */
async function processModifiedTransaction(
  supabase: SupabaseClient,
  transaction: PlaidTransaction,
  plaidItemId: string,
  userId: string
): Promise<void> {
  // Get account
  const accountId = await ensureAccount(supabase, transaction.account_id, plaidItemId, userId)

  // Update transaction
  const { error } = await supabase
    .from('transactions')
    .update({
      date: transaction.date,
      amount: transaction.amount,
      merchant_name: transaction.merchant_name || transaction.name,
      category: transaction.personal_finance_category?.primary || null,
      is_removed: false, // Unmark as removed if it was previously removed
      updated_at: new Date().toISOString(),
    })
    .eq('account_id', accountId)
    .eq('transaction_id', transaction.transaction_id)

  if (error) {
    console.error('Error updating transaction:', error)
    throw error
  }
}

/**
 * Process a removed transaction from Plaid
 * Marks transaction as removed (soft delete) instead of deleting
 */
async function processRemovedTransaction(
  supabase: SupabaseClient,
  removedTxn: RemovedTransaction,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({
      is_removed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('transaction_id', removedTxn.transaction_id)

  if (error) {
    console.error('Error marking transaction as removed:', error)
    throw error
  }
}

/**
 * Ensures an account exists in the database
 * Returns the account UUID
 */
async function ensureAccount(
  supabase: SupabaseClient,
  plaidAccountId: string,
  plaidItemId: string,
  userId: string
): Promise<string> {
  // Check if account already exists
  const { data: existingAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('account_id', plaidAccountId)
    .eq('plaid_item_id', plaidItemId)
    .single()

  if (existingAccount) {
    return existingAccount.id
  }

  // Create new account
  const accountData: DbAccount = {
    user_id: userId,
    plaid_item_id: plaidItemId,
    account_id: plaidAccountId,
    name: 'Account', // Will be updated by syncAccounts
    type: null,
    subtype: null,
    current_balance: null,
    available_balance: null,
  }

  const { data: newAccount, error } = await supabase
    .from('accounts')
    .insert(accountData)
    .select('id')
    .single()

  if (error || !newAccount) {
    throw new Error('Failed to create account')
  }

  return newAccount.id
}

/**
 * Sync account information and balances
 */
async function syncAccounts(
  supabase: SupabaseClient,
  accessToken: string,
  plaidItemId: string,
  userId: string
): Promise<void> {
  try {
    // Get account balances from Plaid
    const response = await plaidClient.accountsBalanceGet({
      access_token: accessToken,
    })

    const accounts = response.data.accounts

    for (const account of accounts) {
      // Upsert account data
      const { error } = await supabase.from('accounts').upsert(
        {
          user_id: userId,
          plaid_item_id: plaidItemId,
          account_id: account.account_id,
          name: account.name,
          type: account.type,
          subtype: account.subtype,
          current_balance: account.balances.current,
          available_balance: account.balances.available,
          last_synced: new Date().toISOString(),
        },
        {
          onConflict: 'plaid_item_id,account_id',
          ignoreDuplicates: false,
        }
      )

      if (error) {
        console.error('Error upserting account:', error)
      }
    }
  } catch (error) {
    console.error('Error syncing accounts:', error)
    // Don't throw - account sync is not critical
  }
}
