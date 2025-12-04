import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get public token from request body
    const body = await request.json()
    const { public_token } = body

    if (!public_token) {
      return NextResponse.json({ error: 'Missing public_token' }, { status: 400 })
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    })

    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    // Get institution information
    let institutionName: string | null = null
    try {
      const itemResponse = await plaidClient.itemGet({
        access_token: accessToken,
      })

      const institutionId = itemResponse.data.item.institution_id

      if (institutionId) {
        const institutionResponse = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: ['US'],
        })
        institutionName = institutionResponse.data.institution.name
      }
    } catch (error) {
      console.error('Error fetching institution info:', error)
      // Continue without institution name if it fails
    }

    // Store in plaid_items table
    const { error: dbError } = await supabase.from('plaid_items').insert({
      user_id: user.id,
      item_id: itemId,
      access_token: accessToken,
      institution_name: institutionName,
    })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Failed to store Plaid item' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      item_id: itemId,
      institution_name: institutionName,
    })
  } catch (error) {
    console.error('Error exchanging token:', error)
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 })
  }
}
