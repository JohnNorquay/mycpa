import { RateLimitError } from './error-handling'

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests allowed in the window
}

/**
 * Rate limit entry tracking requests
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * In-memory rate limit store
 * Note: For production with multiple instances, use Redis/Upstash
 */
class RateLimitStore {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  /**
   * Get or create a rate limit entry
   */
  get(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now()
    const entry = this.store.get(key)

    // Return existing entry if still valid
    if (entry && entry.resetTime > now) {
      return entry
    }

    // Create new entry
    const newEntry: RateLimitEntry = {
      count: 0,
      resetTime: now + windowMs,
    }
    this.store.set(key, newEntry)
    return newEntry
  }

  /**
   * Increment the count for a key
   */
  increment(key: string, windowMs: number): RateLimitEntry {
    const entry = this.get(key, windowMs)
    entry.count++
    this.store.set(key, entry)
    return entry
  }

  /**
   * Reset the count for a key
   */
  reset(key: string): void {
    this.store.delete(key)
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    this.store.forEach((entry, key) => {
      if (entry.resetTime <= now) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach((key) => this.store.delete(key))
  }

  /**
   * Get the current size of the store (for monitoring)
   */
  size(): number {
    return this.store.size
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Global rate limit store instance
const globalStore = new RateLimitStore()

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private config: RateLimitConfig
  private store: RateLimitStore

  constructor(config: RateLimitConfig, store: RateLimitStore = globalStore) {
    this.config = config
    this.store = store
  }

  /**
   * Check if a request should be rate limited
   *
   * @param identifier - Unique identifier (e.g., user ID, IP address)
   * @returns RateLimitResult with success status and metadata
   */
  check(identifier: string): RateLimitResult {
    const entry = this.store.get(identifier, this.config.windowMs)
    const limit = this.config.maxRequests
    const remaining = Math.max(0, limit - entry.count)

    return {
      success: entry.count < limit,
      limit,
      remaining,
      resetTime: entry.resetTime,
    }
  }

  /**
   * Consume a request token
   * Increments the counter and checks if limit is exceeded
   *
   * @param identifier - Unique identifier
   * @returns RateLimitResult
   * @throws RateLimitError if limit is exceeded
   */
  consume(identifier: string): RateLimitResult {
    const entry = this.store.increment(identifier, this.config.windowMs)
    const limit = this.config.maxRequests
    const remaining = Math.max(0, limit - entry.count)
    const success = entry.count <= limit

    if (!success) {
      const retryAfter = Math.ceil((entry.resetTime - Date.now()) / 1000)
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds`,
        retryAfter
      )
    }

    return {
      success,
      limit,
      remaining,
      resetTime: entry.resetTime,
    }
  }

  /**
   * Reset the rate limit for an identifier
   *
   * @param identifier - Unique identifier
   */
  reset(identifier: string): void {
    this.store.reset(identifier)
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */

/**
 * General API rate limiter
 * 100 requests per minute
 */
export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
})

/**
 * Authentication endpoint rate limiter
 * 10 requests per minute (stricter for security)
 */
export const authRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
})

/**
 * Strict rate limiter for sensitive operations
 * 5 requests per minute
 */
export const strictRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
})

/**
 * Helper function to get client identifier from request
 * Uses user ID if authenticated, otherwise falls back to IP address
 *
 * @param request - Next.js request object
 * @param userId - Optional authenticated user ID
 * @returns Identifier string
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Try to get IP address from headers (works with most proxies/CDNs)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? (forwarded.split(',')[0]?.trim() ?? 'unknown') : 'unknown'

  return `ip:${ip}`
}

/**
 * Rate limit middleware helper for API routes
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *
 *   await checkRateLimit(request, authRateLimiter, user?.id)
 *
 *   // ... rest of your handler
 * }
 */
export async function checkRateLimit(
  request: Request,
  limiter: RateLimiter,
  userId?: string
): Promise<RateLimitResult> {
  const identifier = getClientIdentifier(request, userId)
  return limiter.consume(identifier)
}

/**
 * Rate limit with response headers
 * Adds standard rate limit headers to the response
 *
 * @param request - Request object
 * @param limiter - Rate limiter instance
 * @param userId - Optional user ID
 * @returns Headers to add to response
 */
export async function getRateLimitHeaders(
  request: Request,
  limiter: RateLimiter,
  userId?: string
): Promise<HeadersInit> {
  const identifier = getClientIdentifier(request, userId)
  const result = limiter.consume(identifier)

  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  }
}

/**
 * Export store for testing and monitoring
 */
export const rateLimitStore = globalStore
