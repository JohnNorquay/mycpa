import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/plaid/sync/route'
import { NextRequest } from 'next/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock sync utility
vi.mock('@/lib/plaid/sync', () => ({
  syncTransactions: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'
import { syncTransactions } from '@/lib/plaid/sync'

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/plaid/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/plaid/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await POST(createRequest({}))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 404 when no plaid items found', async () => {
    const mockUser = { id: 'user-123' }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await POST(createRequest({}))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('No plaid items found')
  })

  it('successfully syncs all plaid items', async () => {
    const mockUser = { id: 'user-123' }
    const mockPlaidItems = [
      { id: 'item-1', institution_name: 'Bank A' },
      { id: 'item-2', institution_name: 'Bank B' },
    ]
    const mockSyncResult = {
      added: 10,
      modified: 2,
      removed: 1,
    }

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation(function (this: { _queryResult?: unknown }) {
        // Return items on first call, null on update calls
        if (this._queryResult === undefined) {
          this._queryResult = true
          return Promise.resolve({ data: mockPlaidItems, error: null })
        }
        return this
      }),
      update: vi.fn().mockReturnThis(),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
    vi.mocked(syncTransactions).mockResolvedValue(mockSyncResult)

    const response = await POST(createRequest({}))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.synced).toBe(2)
    expect(data.items).toHaveLength(2)
    expect(syncTransactions).toHaveBeenCalledTimes(2)
  })

  it('syncs specific plaid item when id provided', async () => {
    const mockUser = { id: 'user-123' }
    const mockPlaidItem = { id: 'item-1', institution_name: 'Bank A' }
    const mockSyncResult = {
      added: 5,
      modified: 1,
      removed: 0,
    }

    let eqCallCount = 0
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation(() => {
        eqCallCount++
        if (eqCallCount <= 2) {
          // First two eq calls are for selecting items
          return { eq: () => Promise.resolve({ data: [mockPlaidItem], error: null }) }
        }
        // Later eq calls are for updates
        return Promise.resolve({ error: null })
      }),
      update: vi.fn().mockReturnThis(),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
    vi.mocked(syncTransactions).mockResolvedValue(mockSyncResult)

    const response = await POST(createRequest({ plaid_item_id: 'item-1' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('returns 500 when database query fails', async () => {
    const mockUser = { id: 'user-123' }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await POST(createRequest({}))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch plaid items')
  })
})
