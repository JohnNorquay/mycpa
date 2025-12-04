import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/plaid/disconnect/route'
import { NextRequest } from 'next/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock Plaid client
vi.mock('@/lib/plaid/client', () => ({
  plaidClient: {
    itemRemove: vi.fn(),
  },
}))

import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/plaid/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/plaid/disconnect', () => {
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

    const response = await POST(createRequest({ plaid_item_id: 'item-1' }))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 400 when plaid_item_id is missing', async () => {
    const mockUser = { id: 'user-123' }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await POST(createRequest({}))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing plaid_item_id')
  })

  it('returns 404 when plaid item not found', async () => {
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
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await POST(createRequest({ plaid_item_id: 'nonexistent' }))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Plaid item not found')
  })

  it('successfully disconnects plaid item', async () => {
    const mockUser = { id: 'user-123' }
    const mockPlaidItem = { id: 'item-1', access_token: 'access-token-xyz' }

    let singleCalled = false
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        if (!singleCalled) {
          singleCalled = true
          return Promise.resolve({ data: mockPlaidItem, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      }),
      delete: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
    vi.mocked(plaidClient.itemRemove).mockResolvedValue({} as never)

    const response = await POST(createRequest({ plaid_item_id: 'item-1' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Account disconnected successfully')
    expect(plaidClient.itemRemove).toHaveBeenCalledWith({
      access_token: 'access-token-xyz',
    })
  })

  it('continues disconnection even if Plaid API fails', async () => {
    const mockUser = { id: 'user-123' }
    const mockPlaidItem = { id: 'item-1', access_token: 'access-token-xyz' }

    let singleCalled = false
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        if (!singleCalled) {
          singleCalled = true
          return Promise.resolve({ data: mockPlaidItem, error: null })
        }
        return Promise.resolve({ data: null, error: null })
      }),
      delete: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
    vi.mocked(plaidClient.itemRemove).mockRejectedValue(new Error('Plaid API error'))

    const response = await POST(createRequest({ plaid_item_id: 'item-1' }))
    const data = await response.json()

    // Should still succeed even if Plaid removal fails
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('returns 500 when database delete fails', async () => {
    const mockUser = { id: 'user-123' }
    const mockPlaidItem = { id: 'item-1', access_token: 'access-token-xyz' }

    // Track which from() table we're operating on
    let fromCallCount = 0
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockImplementation((table: string) => {
        fromCallCount++
        // First from() is for getting plaid item
        if (fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockPlaidItem, error: null }),
                }),
              }),
            }),
          }
        }
        // Subsequent from() calls are for deletes
        // Return error on plaid_items delete (4th from call)
        if (table === 'plaid_items') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
              }),
            }),
          }
        }
        // Other deletes succeed
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ error: null }),
            }),
          }),
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
          }),
        }
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)
    vi.mocked(plaidClient.itemRemove).mockResolvedValue({} as never)

    const response = await POST(createRequest({ plaid_item_id: 'item-1' }))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to disconnect account')
  })
})
