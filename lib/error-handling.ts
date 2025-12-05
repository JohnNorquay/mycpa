import { NextResponse } from 'next/server'

/**
 * Custom error classes for different types of errors
 */

export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'AuthError'
  }
}

export class ValidationError extends Error {
  constructor(
    message = 'Validation failed',
    public field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(
    message = 'Resource not found',
    public resource?: string
  ) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends Error {
  constructor(
    message = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message)
    this.name = 'RateLimitError'
  }
}

export class DatabaseError extends Error {
  constructor(message = 'Database operation failed') {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends Error {
  constructor(
    message = 'External service error',
    public service?: string
  ) {
    super(message)
    this.name = 'ExternalServiceError'
  }
}

export class BadRequestError extends Error {
  constructor(message = 'Bad request') {
    super(message)
    this.name = 'BadRequestError'
  }
}

/**
 * Standardized API error response format
 */
export interface ApiErrorResponse {
  error: string
  message: string
  field?: string
  retryAfter?: number
  statusCode: number
}

/**
 * Map error types to HTTP status codes
 */
function getStatusCode(error: Error): number {
  if (error instanceof AuthError) return 401
  if (error instanceof ValidationError) return 400
  if (error instanceof NotFoundError) return 404
  if (error instanceof RateLimitError) return 429
  if (error instanceof BadRequestError) return 400
  if (error instanceof DatabaseError) return 500
  if (error instanceof ExternalServiceError) return 503
  return 500
}

/**
 * Convert error to standardized API error response
 */
export function toApiError(error: Error): ApiErrorResponse {
  const statusCode = getStatusCode(error)

  const response: ApiErrorResponse = {
    error: error.name,
    message: error.message,
    statusCode,
  }

  // Add additional fields based on error type
  if (error instanceof ValidationError && error.field) {
    response.field = error.field
  }

  if (error instanceof RateLimitError && error.retryAfter) {
    response.retryAfter = error.retryAfter
  }

  return response
}

/**
 * Create a NextResponse from an error
 */
export function errorToResponse(error: Error): NextResponse {
  const apiError = toApiError(error)

  // Log errors in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[API Error]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    })
  }

  // In production, log only non-client errors
  if (process.env.NODE_ENV === 'production' && apiError.statusCode >= 500) {
    console.error('[API Error]', {
      name: error.name,
      message: error.message,
      statusCode: apiError.statusCode,
    })
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  // Add Retry-After header for rate limit errors
  if (error instanceof RateLimitError && error.retryAfter) {
    headers['Retry-After'] = error.retryAfter.toString()
  }

  return NextResponse.json(
    {
      error: apiError.error,
      message: apiError.message,
      ...(apiError.field && { field: apiError.field }),
      ...(apiError.retryAfter && { retryAfter: apiError.retryAfter }),
    },
    {
      status: apiError.statusCode,
      headers,
    }
  )
}

/**
 * API route error wrapper function
 * Wraps an async handler to automatically catch and convert errors to responses
 *
 * Usage:
 * export const POST = withErrorHandler(async (request) => {
 *   // Your handler logic
 *   throw new ValidationError('Invalid email', 'email')
 * })
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      // Handle known error types
      if (error instanceof Error) {
        return errorToResponse(error)
      }

      // Handle unknown errors
      console.error('[Unexpected Error]', error)
      return NextResponse.json(
        {
          error: 'InternalServerError',
          message: 'An unexpected error occurred',
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Async error handler for use in try-catch blocks
 * Returns a tuple of [error, data] like Go-style error handling
 */
export async function handleAsync<T>(promise: Promise<T>): Promise<[Error | null, T | null]> {
  try {
    const data = await promise
    return [null, data]
  } catch (error) {
    if (error instanceof Error) {
      return [error, null]
    }
    return [new Error('Unknown error occurred'), null]
  }
}

/**
 * Safe JSON parsing with error handling
 */
export function safeParse<T = unknown>(json: string): [Error | null, T | null] {
  try {
    const data = JSON.parse(json) as T
    return [null, data]
  } catch (error) {
    return [new Error('Invalid JSON'), null]
  }
}
