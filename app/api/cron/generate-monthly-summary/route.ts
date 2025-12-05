import { NextResponse } from 'next/server'

/**
 * GET /api/cron/generate-monthly-summary
 *
 * Cron job to generate monthly summaries for all users
 * Runs on the 1st of each month at 6 AM
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret to ensure this is called by Vercel cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Implement monthly summary generation via Inngest
    // This would:
    // 1. Get all active users
    // 2. For each user, calculate their financial snapshot for the previous month
    // 3. Generate AI narrative using the summary generator
    // 4. Save to monthly_summaries table

    console.log('Monthly summary generation triggered')

    return NextResponse.json({
      success: true,
      message: 'Monthly summary generation started',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in generate-monthly-summary cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
