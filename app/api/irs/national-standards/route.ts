import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Get query parameters
    const year = searchParams.get('year')
    const category = searchParams.get('category')
    const householdSize = searchParams.get('household_size')
    const state = searchParams.get('state')
    const county = searchParams.get('county')

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let query = supabase.from('irs_national_standards').select('*')

    // Apply filters
    if (year) {
      query = query.eq('year', parseInt(year, 10))
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (householdSize) {
      query = query.eq('household_size', parseInt(householdSize, 10))
    }

    if (state) {
      query = query.eq('state', state)
    }

    if (county) {
      query = query.eq('county', county)
    }

    const { data, error } = await query.order('year', { ascending: false })

    if (error) {
      console.error('Error fetching national standards:', error)
      return NextResponse.json({ error: 'Failed to fetch national standards' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
