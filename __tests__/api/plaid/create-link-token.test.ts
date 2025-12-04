import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/plaid/create-link-token/route'
import { NextResponse } from 'next/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock Plaid client
vi.mock('@/lib/plaid/client', () => ({
  plaidClient: {
    linkTokenCreate: vi.fn(),
  },
}))

import { createClient } from '@/lib/supabase/server'
import { plaidClient } from '@/lib/plaid/client'

describe('POST /api/plaid/create-link-token', () => {
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

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns link token on success', async () => {
    const mockUser = { id: 'user-123' }
    const mockLinkToken = 'link-token-abc123'

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    vi.mocked(plaidClient.linkTokenCreate).mockResolvedValue({
      data: { link_token: mockLinkToken },
    } as never)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.link_token).toBe(mockLinkToken)
    expect(plaidClient.linkTokenCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { client_user_id: mockUser.id },
        client_name: 'CPA Bot',
      })
    )
  })

  it('returns 500 when Plaid API fails', async () => {
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

    vi.mocked(plaidClient.linkTokenCreate).mockRejectedValue(new Error('Plaid error'))

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create link token')
  })
})
