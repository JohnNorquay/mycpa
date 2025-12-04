import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { syncTransactions } from '@/lib/plaid/sync'

/**
 * GET /api/cron/sync-transactions
 *
 * Vercel Cron job that runs daily at 6 AM to sync all users' Plaid transactions
 *
 * This endpoint:
 * 1. Verifies the cron secret for security
 * 2. Fetches all plaid_items from the database
 * 3. Syncs transactions for each item
 * 4. Returns summary of synced items
 *
 * Note: This uses the service role key to bypass RLS since it runs without a user session
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Invalid cron secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // No-op for cron job
          },
        },
      }
    )

    // Get all plaid items
    const { data: plaidItems, error: itemsError } = await supabase
      .from('plaid_items')
      .select('id, user_id, institution_name')

    if (itemsError) {
      console.error('Error fetching plaid items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch plaid items' }, { status: 500 })
    }

    if (!plaidItems || plaidItems.length === 0) {
      return NextResponse.json({ synced: 0, items: [] })
    }

    // Sync each item
    const results = []
    let successCount = 0
    let errorCount = 0

    for (const item of plaidItems) {
      try {
        const syncResult = await syncTransactions(supabase, item.id, item.user_id)

        if (syncResult.error) {
          errorCount++
          console.error(`Error syncing item ${item.id}:`, syncResult.error)
        } else {
          successCount++
        }

        results.push({
          plaid_item_id: item.id,
          user_id: item.user_id,
          institution_name: item.institution_name,
          ...syncResult,
        })

        // Update last_synced timestamp
        const { error: updateError } = await supabase
          .from('plaid_items')
          .update({ last_synced: new Date().toISOString() })
          .eq('id', item.id)

        if (updateError && !updateError.message.includes('column "last_synced"')) {
          console.error('Error updating last_synced:', updateError)
        }
      } catch (error) {
        errorCount++
        console.error(`Exception syncing item ${item.id}:`, error)
        results.push({
          plaid_item_id: item.id,
          user_id: item.user_id,
          institution_name: item.institution_name,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      synced: plaidItems.length,
      success: successCount,
      errors: errorCount,
      items: results,
    })
  } catch (error) {
    console.error('Error in cron sync job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
