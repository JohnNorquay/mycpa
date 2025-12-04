import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/cron/sync-transactions/route'
import { NextRequest } from 'next/server'

// Mock Supabase client
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

// Mock sync utility
vi.mock('@/lib/plaid/sync', () => ({
  syncTransactions: vi.fn(),
}))

import { createServerClient } from '@supabase/ssr'
import { syncTransactions } from '@/lib/plaid/sync'

const originalEnv = process.env

function createRequest(authorization?: string): NextRequest {
  const headers = new Headers()
  if (authorization) {
    headers.set('authorization', authorization)
  }
  return new NextRequest('http://localhost/api/cron/sync-transactions', {
    headers,
  })
}

describe('GET /api/cron/sync-transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env = {
      ...originalEnv,
      CRON_SECRET: 'test-cron-secret',
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
    }
  })

  it('returns 500 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET

    const response = await GET(createRequest('Bearer some-secret'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Cron secret not configured')
  })

  it('returns 401 when authorization header is invalid', async () => {
    const response = await GET(createRequest('Bearer wrong-secret'))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 401 when authorization header is missing', async () => {
    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns empty result when no plaid items exist', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as never)

    const response = await GET(createRequest('Bearer test-cron-secret'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.synced).toBe(0)
    expect(data.items).toEqual([])
  })

  it('successfully syncs all plaid items', async () => {
    const mockPlaidItems = [
      { id: 'item-1', user_id: 'user-1', institution_name: 'Bank A' },
      { id: 'item-2', user_id: 'user-2', institution_name: 'Bank B' },
    ]
    const mockSyncResult = { added: 5, modified: 1, removed: 0 }

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: mockPlaidItems, error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as never)
    vi.mocked(syncTransactions).mockResolvedValue(mockSyncResult)

    const response = await GET(createRequest('Bearer test-cron-secret'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.synced).toBe(2)
    expect(data.success).toBe(2)
    expect(data.errors).toBe(0)
    expect(data.items).toHaveLength(2)
    expect(syncTransactions).toHaveBeenCalledTimes(2)
  })

  it('handles sync errors gracefully', async () => {
    const mockPlaidItems = [{ id: 'item-1', user_id: 'user-1', institution_name: 'Bank A' }]
    const mockSyncResult = { error: 'Sync failed' }

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: mockPlaidItems, error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as never)
    vi.mocked(syncTransactions).mockResolvedValue(mockSyncResult)

    const response = await GET(createRequest('Bearer test-cron-secret'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.synced).toBe(1)
    expect(data.errors).toBe(1)
    expect(data.success).toBe(0)
  })

  it('returns 500 when database query fails', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }
    vi.mocked(createServerClient).mockReturnValue(mockSupabase as never)

    const response = await GET(createRequest('Bearer test-cron-secret'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch plaid items')
  })
})
