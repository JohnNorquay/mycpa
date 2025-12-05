import { z } from 'zod'
import { NextRequest } from 'next/server'
import { ValidationError } from './error-handling'

/**
 * Common Zod validation schemas
 */

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .trim()
  .toLowerCase()
  .max(255, 'Email must be less than 255 characters')

/**
 * Phone number validation (US format)
 * Accepts: (555) 555-5555, 555-555-5555, 5555555555
 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid phone number format')
  .transform((val) => val.replace(/\D/g, '')) // Remove non-digits

/**
 * Currency amount validation
 * Accepts positive numbers with up to 2 decimal places
 */
export const currencySchema = z
  .number()
  .positive('Amount must be positive')
  .multipleOf(0.01, 'Amount can have at most 2 decimal places')
  .max(999999999.99, 'Amount is too large')

/**
 * Currency string validation (converts string to number)
 */
export const currencyStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Invalid currency format')
  .transform((val) => parseFloat(val))
  .pipe(currencySchema)

/**
 * Date validation (ISO 8601 format)
 */
export const dateSchema = z
  .string()
  .datetime({ message: 'Invalid date format (expected ISO 8601)' })
  .or(z.date())

/**
 * Date range validation
 */
export const dateRangeSchema = z
  .object({
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  })

/**
 * Pagination validation
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID format')

/**
 * URL validation
 */
export const urlSchema = z.string().url('Invalid URL format').max(2048, 'URL is too long')

/**
 * Password validation
 * At least 8 characters, contains uppercase, lowercase, number
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

/**
 * Name validation (first/last name)
 */
export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s\-']+$/, 'Name contains invalid characters')

/**
 * Tax year validation
 */
export const taxYearSchema = z
  .number()
  .int()
  .min(2000, 'Tax year must be 2000 or later')
  .max(new Date().getFullYear() + 1, 'Tax year cannot be more than 1 year in the future')

/**
 * SSN validation (last 4 digits)
 */
export const ssnLast4Schema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, 'SSN last 4 must be exactly 4 digits')

/**
 * ZIP code validation (US)
 */
export const zipCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')

/**
 * State validation (US two-letter state codes)
 */
const US_STATES = [
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
  'DC',
  'PR',
  'VI',
  'GU',
  'AS',
  'MP',
] as const

export const stateSchema = z.enum(US_STATES, {
  message: 'Invalid US state code',
})

/**
 * Sanitization utilities
 */

/**
 * Trim whitespace from string
 */
export function sanitizeTrim(value: string): string {
  return value.trim()
}

/**
 * Remove HTML tags and prevent XSS
 */
export function sanitizeHTML(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize string for SQL (basic - prefer parameterized queries)
 */
export function sanitizeSQL(value: string): string {
  return value.replace(/['";\\]/g, '')
}

/**
 * Remove non-alphanumeric characters except spaces and dashes
 */
export function sanitizeAlphanumeric(value: string): string {
  return value.replace(/[^a-zA-Z0-9\s\-]/g, '')
}

/**
 * Sanitize filename - remove path traversal and dangerous characters
 */
export function sanitizeFilename(value: string): string {
  return value
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[^a-zA-Z0-9.\-_]/g, '_') // Replace unsafe chars with underscore
    .substring(0, 255) // Limit length
}

/**
 * Normalize and sanitize email
 */
export function sanitizeEmail(value: string): string {
  return value.trim().toLowerCase().replace(/\s/g, '')
}

/**
 * Request body validation wrapper for API routes
 *
 * @example
 * const schema = z.object({
 *   email: emailSchema,
 *   amount: currencySchema,
 * })
 *
 * export async function POST(request: NextRequest) {
 *   const body = await validateRequest(request, schema)
 *   // body is now typed and validated
 * }
 */
export async function validateRequest<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await request.json()
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      if (firstError) {
        throw new ValidationError(firstError.message, firstError.path.join('.'))
      }
    }

    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON in request body')
    }

    throw new ValidationError('Request validation failed')
  }
}

/**
 * Query parameter validation wrapper
 *
 * @example
 * const schema = z.object({
 *   page: z.coerce.number().int().positive().default(1),
 *   search: z.string().optional(),
 * })
 *
 * export async function GET(request: NextRequest) {
 *   const params = validateQuery(request, schema)
 *   // params is now typed and validated
 * }
 */
export function validateQuery<T extends z.ZodTypeAny>(request: NextRequest, schema: T): z.infer<T> {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      if (firstError) {
        throw new ValidationError(firstError.message, firstError.path.join('.'))
      }
    }

    throw new ValidationError('Query parameter validation failed')
  }
}

/**
 * Safe validation that returns a result object instead of throwing
 *
 * @example
 * const result = safeValidate(data, schema)
 * if (!result.success) {
 *   console.error(result.error)
 *   return
 * }
 * const validData = result.data
 */
export function safeValidate<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Validate and sanitize user input
 * Combines validation with sanitization
 *
 * @example
 * const email = validateAndSanitize(userInput, emailSchema, sanitizeEmail)
 */
export function validateAndSanitize<T extends z.ZodTypeAny>(
  value: unknown,
  schema: T,
  sanitizer: (val: string) => string
): z.infer<T> {
  if (typeof value !== 'string') {
    throw new ValidationError('Value must be a string')
  }

  const sanitized = sanitizer(value)
  return schema.parse(sanitized)
}

/**
 * Common composite schemas for API endpoints
 */

/**
 * Create transaction schema
 */
export const createTransactionSchema = z.object({
  amount: currencySchema,
  description: z.string().trim().min(1).max(500),
  date: dateSchema,
  category: z.string().trim().min(1).max(100).optional(),
  merchant: z.string().trim().max(200).optional(),
})

/**
 * Update user profile schema
 */
export const updateProfileSchema = z.object({
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  state: stateSchema.optional(),
  zipCode: zipCodeSchema.optional(),
})

/**
 * Tax calculation input schema
 */
export const taxCalculationSchema = z.object({
  income: currencySchema,
  deductions: currencySchema.default(0),
  taxYear: taxYearSchema,
  filingStatus: z.enum(['single', 'married_joint', 'married_separate', 'head_of_household']),
  state: stateSchema,
})

/**
 * Date filter schema for queries
 */
export const dateFilterSchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  year: taxYearSchema.optional(),
  month: z.number().int().min(1).max(12).optional(),
})
