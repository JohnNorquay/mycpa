import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/transactions/route'
import { NextRequest } from 'next/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { createClient } from '@/lib/supabase/server'

function createRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/transactions')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })
  return new NextRequest(url.toString())
}

describe('GET /api/transactions', () => {
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

  it('returns paginated transactions with defaults', async () => {
    const mockUser = { id: 'user-123' }
    const mockTransactions = [
      {
        id: 'tx-1',
        date: '2024-01-15',
        amount: 50.0,
        merchant_name: 'Coffee Shop',
        category: 'Food & Drink',
        is_tax_deductible: false,
        is_recurring: false,
        notes: null,
        account: { name: 'Checking', type: 'depository' },
      },
      {
        id: 'tx-2',
        date: '2024-01-14',
        amount: 100.0,
        merchant_name: 'Gas Station',
        category: 'Transportation',
        is_tax_deductible: false,
        is_recurring: false,
        notes: null,
        account: { name: 'Credit Card', type: 'credit' },
      },
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
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: mockTransactions,
        error: null,
        count: 2,
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.transactions).toEqual(mockTransactions)
    expect(data.page).toBe(1)
    expect(data.limit).toBe(50)
    expect(data.totalCount).toBe(2)
    expect(data.hasMore).toBe(false)
  })

  it('handles pagination parameters', async () => {
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
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 150,
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await GET(createRequest({ page: '2', limit: '25' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.page).toBe(2)
    expect(data.limit).toBe(25)
    expect(data.hasMore).toBe(true) // (2-1)*25 + 25 = 50 < 150
    expect(mockSupabase.range).toHaveBeenCalledWith(25, 49) // offset 25, limit 25
  })

  it('limits max results to 100', async () => {
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
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await GET(createRequest({ limit: '500' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.limit).toBe(100)
  })

  it('filters by date range', async () => {
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
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await GET(createRequest({ dateFrom: '2024-01-01', dateTo: '2024-01-31' }))

    expect(response.status).toBe(200)
    expect(mockSupabase.gte).toHaveBeenCalledWith('date', '2024-01-01')
    expect(mockSupabase.lte).toHaveBeenCalledWith('date', '2024-01-31')
  })

  it('filters by category', async () => {
    const mockUser = { id: 'user-123' }

    // Create a thenable query builder mock
    const createQueryMock = () => {
      const result = { data: [], error: null, count: 0 }
      const queryMock = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => resolve(result)),
      }
      return queryMock
    }

    const queryMock = createQueryMock()
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: queryMock.from.mockReturnValue(queryMock),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await GET(createRequest({ category: 'Food & Drink' }))

    expect(response.status).toBe(200)
    // eq should be called with category filter
    expect(queryMock.eq).toHaveBeenCalledWith('category', 'Food & Drink')
  })

  it('filters by accountId', async () => {
    const mockUser = { id: 'user-123' }
    const accountId = 'acc-456'

    // Create a thenable query builder mock
    const createQueryMock = () => {
      const result = { data: [], error: null, count: 0 }
      const queryMock = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        then: vi.fn().mockImplementation((resolve) => resolve(result)),
      }
      return queryMock
    }

    const queryMock = createQueryMock()
    const mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: queryMock.from.mockReturnValue(queryMock),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await GET(createRequest({ accountId }))

    expect(response.status).toBe(200)
    expect(queryMock.eq).toHaveBeenCalledWith('account_id', accountId)
  })

  it('searches by merchant name', async () => {
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
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await GET(createRequest({ search: 'coffee' }))

    expect(response.status).toBe(200)
    expect(mockSupabase.ilike).toHaveBeenCalledWith('merchant_name', '%coffee%')
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
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'DB error' },
        count: null,
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    const response = await GET(createRequest())
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch transactions')
  })

  it('handles minimum page number', async () => {
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
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    }
    vi.mocked(createClient).mockResolvedValue(mockSupabase as never)

    // Passing negative page should default to page 1
    const response = await GET(createRequest({ page: '-5' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.page).toBe(1)
  })
})
