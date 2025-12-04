import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/plaid/exchange-token/route'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock Plaid client
vi.mock('@/lib/plaid/client', () => ({
  plaidClient: {
    itemPublicTokenExchange: vi.fn(),
    itemGet: vi.fn(),
    institutionsGetById: vi.fn(),
  },
}))

import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'

function createRequest(body: unknown): Request {
  return new Request('http://localhost/api/plaid/exchange-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/plaid/exchange-token', () => {
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

    const response = await POST(createRequest({ public_token: 'test-token' }))
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns 400 when public_token is missing', async () => {
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
    expect(data.error).toBe('Missing public_token')
  })

  it('successfully exchanges token and stores plaid item', async () => {
    const mockUser = { id: 'user-123' }
    const mockAccessToken = 'access-token-xyz'
    const mockItemId = 'item-456'
    const mockInstitutionName = 'Test Bank'

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    vi.mocked(plaidClient.itemPublicTokenExchange).mockResolvedValue({
      data: {
        access_token: mockAccessToken,
        item_id: mockItemId,
      },
    } as never)

    vi.mocked(plaidClient.itemGet).mockResolvedValue({
      data: {
        item: { institution_id: 'inst-123' },
      },
    } as never)

    vi.mocked(plaidClient.institutionsGetById).mockResolvedValue({
      data: {
        institution: { name: mockInstitutionName },
      },
    } as never)

    const response = await POST(createRequest({ public_token: 'public-token' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.item_id).toBe(mockItemId)
    expect(data.institution_name).toBe(mockInstitutionName)
    expect(mockSupabase.from).toHaveBeenCalledWith('plaid_items')
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      user_id: mockUser.id,
      item_id: mockItemId,
      access_token: mockAccessToken,
      institution_name: mockInstitutionName,
    })
  })

  it('returns 500 when database insert fails', async () => {
    const mockUser = { id: 'user-123' }
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    vi.mocked(plaidClient.itemPublicTokenExchange).mockResolvedValue({
      data: {
        access_token: 'access-token',
        item_id: 'item-id',
      },
    } as never)

    vi.mocked(plaidClient.itemGet).mockResolvedValue({
      data: {
        item: { institution_id: null },
      },
    } as never)

    const response = await POST(createRequest({ public_token: 'public-token' }))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to store Plaid item')
  })
})
