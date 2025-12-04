import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'

/**
 * POST /api/plaid/disconnect
 *
 * Disconnects a Plaid item and removes associated data
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
    const body = await request.json()
    const { plaid_item_id } = body

    if (!plaid_item_id) {
      return NextResponse.json({ error: 'Missing plaid_item_id' }, { status: 400 })
    }

    // Get the plaid item to verify ownership and get access token
    const { data: plaidItem, error: itemError } = await supabase
      .from('plaid_items')
      .select('id, access_token')
      .eq('id', plaid_item_id)
      .eq('user_id', user.id)
      .single()

    if (itemError || !plaidItem) {
      return NextResponse.json({ error: 'Plaid item not found' }, { status: 404 })
    }

    // Remove the item from Plaid (optional, but good practice)
    try {
      await plaidClient.itemRemove({
        access_token: plaidItem.access_token,
      })
    } catch (plaidError) {
      console.error('Error removing item from Plaid:', plaidError)
      // Continue with deletion even if Plaid removal fails
    }

    // Delete associated transactions first (foreign key constraint)
    const { error: txError } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', user.id)
      .in('account_id', supabase.from('accounts').select('id').eq('plaid_item_id', plaid_item_id))

    if (txError) {
      console.error('Error deleting transactions:', txError)
    }

    // Delete associated accounts
    const { error: accountsError } = await supabase
      .from('accounts')
      .delete()
      .eq('plaid_item_id', plaid_item_id)

    if (accountsError) {
      console.error('Error deleting accounts:', accountsError)
    }

    // Delete the plaid item
    const { error: deleteError } = await supabase
      .from('plaid_items')
      .delete()
      .eq('id', plaid_item_id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting plaid item:', deleteError)
      return NextResponse.json({ error: 'Failed to disconnect account' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Account disconnected successfully',
    })
  } catch (error) {
    console.error('Error in disconnect endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
