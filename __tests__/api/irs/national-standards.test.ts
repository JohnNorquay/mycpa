import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/irs/national-standards/route'
import { NextRequest } from 'next/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

function createRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/irs/national-standards')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return new NextRequest(url.toString())
}

describe('GET /api/irs/national-standards', () => {
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

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('returns all national standards when no filters applied', async () => {
    const mockUser = { id: 'user-123' }
    const mockStandards = [
      { id: 1, year: 2024, category: 'food', household_size: 1, amount: 500 },
      { id: 2, year: 2024, category: 'housing', household_size: 1, amount: 1500 },
    ]

    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockStandards, error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toEqual(mockStandards)
  })

  it('filters by year', async () => {
    const mockUser = { id: 'user-123' }
    const mockStandards = [{ id: 1, year: 2024, category: 'food', amount: 500 }]

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
      order: vi.fn().mockResolvedValue({ data: mockStandards, error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await GET(createRequest({ year: '2024' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockSupabase.eq).toHaveBeenCalledWith('year', 2024)
    expect(data.data).toEqual(mockStandards)
  })

  it('filters by category and household size', async () => {
    const mockUser = { id: 'user-123' }
    const mockStandards = [{ id: 1, year: 2024, category: 'food', household_size: 2, amount: 700 }]

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
      order: vi.fn().mockResolvedValue({ data: mockStandards, error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await GET(createRequest({ category: 'food', household_size: '2' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockSupabase.eq).toHaveBeenCalledWith('category', 'food')
    expect(mockSupabase.eq).toHaveBeenCalledWith('household_size', 2)
    expect(data.data).toEqual(mockStandards)
  })

  it('filters by state and county', async () => {
    const mockUser = { id: 'user-123' }
    const mockStandards = [{ id: 1, year: 2024, state: 'CA', county: 'Los Angeles', amount: 2000 }]

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
      order: vi.fn().mockResolvedValue({ data: mockStandards, error: null }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await GET(createRequest({ state: 'CA', county: 'Los Angeles' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockSupabase.eq).toHaveBeenCalledWith('state', 'CA')
    expect(mockSupabase.eq).toHaveBeenCalledWith('county', 'Los Angeles')
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
      order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch national standards')
  })
})
