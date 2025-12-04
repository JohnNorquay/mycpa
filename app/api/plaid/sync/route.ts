import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncTransactions } from '@/lib/plaid/sync'

/**
 * POST /api/plaid/sync
 *
 * Manual sync endpoint for Plaid transactions
 *
 * Request body (optional):
 * - plaid_item_id?: string - Specific item to sync (if omitted, syncs all items)
 *
 * Returns:
 * - items: Array of sync results with plaid_item_id and sync stats
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const { plaid_item_id } = body

    // Get plaid items to sync
    let query = supabase.from('plaid_items').select('id, institution_name').eq('user_id', user.id)

    if (plaid_item_id) {
      query = query.eq('id', plaid_item_id)
    }

    const { data: plaidItems, error: itemsError } = await query

    if (itemsError) {
      console.error('Error fetching plaid items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch plaid items' }, { status: 500 })
    }

    if (!plaidItems || plaidItems.length === 0) {
      return NextResponse.json({ error: 'No plaid items found' }, { status: 404 })
    }

    // Sync each item
    const results = []
    for (const item of plaidItems) {
      const syncResult = await syncTransactions(supabase, item.id, user.id)

      results.push({
        plaid_item_id: item.id,
        institution_name: item.institution_name,
        ...syncResult,
      })

      // Update last_synced timestamp on the plaid_item
      await supabase
        .from('plaid_items')
        .update({ last_synced: new Date().toISOString() })
        .eq('id', item.id)
    }

    return NextResponse.json({
      success: true,
      synced: results.length,
      items: results,
    })
  } catch (error) {
    console.error('Error in sync endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
