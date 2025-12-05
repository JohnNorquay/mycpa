import { ExternalServiceError } from './error-handling'

/**
 * Configuration for fetch with retry logic
 */
export interface FetchConfig extends RequestInit {
  maxRetries?: number
  retryDelay?: number
  retryOn?: number[] // HTTP status codes to retry on
  timeout?: number
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<
  Pick<FetchConfig, 'maxRetries' | 'retryDelay' | 'retryOn' | 'timeout'>
> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second base delay
  retryOn: [408, 429, 500, 502, 503, 504],
  timeout: 30000, // 30 seconds
}

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate exponential backoff delay
 * 1s, 2s, 4s for attempts 1, 2, 3
 */
function getExponentialBackoff(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt - 1)
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    // Server-side, assume online
    return true
  }
  return navigator.onLine
}

/**
 * Offline detection utility
 * Returns true if offline
 */
export function isOffline(): boolean {
  return !isOnline()
}

/**
 * Wait for network to come back online
 * Useful for retry logic in offline scenarios
 */
export async function waitForOnline(timeoutMs = 30000): Promise<boolean> {
  if (typeof window === 'undefined') {
    // Server-side, assume online
    return true
  }

  if (navigator.onLine) {
    return true
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cleanup()
      resolve(false)
    }, timeoutMs)

    const onlineHandler = () => {
      cleanup()
      resolve(true)
    }

    const cleanup = () => {
      clearTimeout(timeout)
      window.removeEventListener('online', onlineHandler)
    }

    window.addEventListener('online', onlineHandler)
  })
}

/**
 * Fetch with timeout support
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Fetch wrapper with retry logic and exponential backoff
 *
 * Features:
 * - Automatic retries with exponential backoff (1s, 2s, 4s)
 * - Configurable retry conditions
 * - Timeout support
 * - Offline detection
 *
 * @param url - The URL to fetch
 * @param config - Fetch configuration with retry options
 * @returns Promise<Response>
 * @throws ExternalServiceError if all retries fail
 *
 * @example
 * const response = await fetchWithRetry('/api/users', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' }),
 *   maxRetries: 3,
 * })
 */
export async function fetchWithRetry(url: string, config: FetchConfig = {}): Promise<Response> {
  const {
    maxRetries = DEFAULT_CONFIG.maxRetries,
    retryDelay = DEFAULT_CONFIG.retryDelay,
    retryOn = DEFAULT_CONFIG.retryOn,
    timeout = DEFAULT_CONFIG.timeout,
    ...fetchOptions
  } = config

  let lastError: Error | null = null
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      // Check if offline before attempting
      if (isOffline()) {
        throw new ExternalServiceError('Network is offline', 'Network')
      }

      // Attempt the fetch with timeout
      const response = await fetchWithTimeout(url, fetchOptions, timeout)

      // Check if we should retry based on status code
      if (attempt < maxRetries && retryOn.includes(response.status)) {
        attempt++
        const delay = getExponentialBackoff(attempt, retryDelay)

        // Log retry attempt in development
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[fetchWithRetry] Retry attempt ${attempt}/${maxRetries} for ${url} after ${delay}ms (status: ${response.status})`
          )
        }

        await sleep(delay)
        continue
      }

      // Success or non-retryable error
      return response
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      // Don't retry on timeout/abort errors if we've hit max retries
      if (attempt >= maxRetries) {
        break
      }

      // Check if it's a network error or timeout
      const isNetworkError =
        error instanceof TypeError || (error instanceof Error && error.name === 'AbortError')

      if (isNetworkError) {
        attempt++
        const delay = getExponentialBackoff(attempt, retryDelay)

        // Log retry attempt in development
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `[fetchWithRetry] Retry attempt ${attempt}/${maxRetries} for ${url} after ${delay}ms (network error)`
          )
        }

        // Wait for network if offline
        if (isOffline()) {
          const isOnlineNow = await waitForOnline(delay)
          if (!isOnlineNow) {
            throw new ExternalServiceError('Network timeout', 'Network')
          }
        } else {
          await sleep(delay)
        }
        continue
      }

      // Non-retryable error
      throw error
    }
  }

  // All retries exhausted
  if (lastError) {
    throw new ExternalServiceError(
      `Request failed after ${maxRetries} retries: ${lastError.message}`,
      'Network'
    )
  }

  throw new ExternalServiceError('Request failed', 'Network')
}

/**
 * JSON fetch wrapper with retry logic
 * Automatically parses JSON response
 *
 * @example
 * const data = await fetchJSON<User>('/api/user', {
 *   method: 'GET',
 * })
 */
export async function fetchJSON<T = unknown>(url: string, config: FetchConfig = {}): Promise<T> {
  const response = await fetchWithRetry(url, {
    ...config,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new ExternalServiceError(`HTTP ${response.status}: ${errorText}`, url)
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    throw new ExternalServiceError('Invalid JSON response', url)
  }
}

/**
 * Create a fetch client with default configuration
 * Useful for setting up API clients with consistent settings
 *
 * @example
 * const apiClient = createFetchClient({
 *   baseURL: '/api',
 *   maxRetries: 2,
 *   headers: { 'X-API-Key': 'secret' }
 * })
 *
 * const data = await apiClient.get<User>('/user')
 */
export function createFetchClient(defaultConfig: FetchConfig & { baseURL?: string } = {}) {
  const { baseURL = '', ...baseConfig } = defaultConfig

  return {
    async fetch(url: string, config: FetchConfig = {}): Promise<Response> {
      const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`
      return fetchWithRetry(fullUrl, { ...baseConfig, ...config })
    },

    async get<T>(url: string, config: Omit<FetchConfig, 'method' | 'body'> = {}): Promise<T> {
      const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`
      return fetchJSON<T>(fullUrl, { ...baseConfig, ...config, method: 'GET' })
    },

    async post<T>(
      url: string,
      body?: unknown,
      config: Omit<FetchConfig, 'method'> = {}
    ): Promise<T> {
      const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`
      return fetchJSON<T>(fullUrl, {
        ...baseConfig,
        ...config,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      })
    },

    async put<T>(
      url: string,
      body?: unknown,
      config: Omit<FetchConfig, 'method'> = {}
    ): Promise<T> {
      const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`
      return fetchJSON<T>(fullUrl, {
        ...baseConfig,
        ...config,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      })
    },

    async delete<T>(url: string, config: Omit<FetchConfig, 'method' | 'body'> = {}): Promise<T> {
      const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`
      return fetchJSON<T>(fullUrl, { ...baseConfig, ...config, method: 'DELETE' })
    },
  }
}
