import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/transactions
 *
 * Fetch paginated transactions with optional filters
 *
 * Query params:
 * - page: number (default 1)
 * - limit: number (default 50, max 100)
 * - dateFrom: ISO date string
 * - dateTo: ISO date string
 * - category: string
 * - accountId: string (UUID)
 * - search: string (search merchant_name)
 */
export async function GET(request: NextRequest) {
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const category = searchParams.get('category')
    const accountId = searchParams.get('accountId')
    const search = searchParams.get('search')

    // Calculate offset
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('transactions')
      .select(
        `
        id,
        date,
        amount,
        merchant_name,
        category,
        is_tax_deductible,
        is_recurring,
        notes,
        account:accounts (
          name,
          type
        )
      `,
        { count: 'exact' }
      )
      .eq('user_id', user.id)
      .eq('is_removed', false)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (dateFrom) {
      query = query.gte('date', dateFrom)
    }
    if (dateTo) {
      query = query.lte('date', dateTo)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (accountId) {
      query = query.eq('account_id', accountId)
    }
    if (search) {
      query = query.ilike('merchant_name', `%${search}%`)
    }

    const { data: transactions, error, count } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
    }

    const totalCount = count || 0
    const hasMore = offset + limit < totalCount

    return NextResponse.json({
      transactions: transactions || [],
      page,
      limit,
      totalCount,
      hasMore,
    })
  } catch (error) {
    console.error('Error in transactions endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
