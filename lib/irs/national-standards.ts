import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types'

export type NationalStandard = Tables<'irs_national_standards'>

// In-memory cache for national standards (valid for the duration of the request)
const cache = new Map<string, NationalStandard[]>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

interface CacheEntry {
  data: NationalStandard[]
  timestamp: number
}

const timestampCache = new Map<string, CacheEntry>()

/**
 * Get food, clothing, and miscellaneous allowance by household size
 */
export async function getFoodClothingMiscAllowance(
  householdSize: number,
  year: number = new Date().getFullYear()
): Promise<number | null> {
  const cacheKey = `food_clothing_misc_${year}_${householdSize}`

  // Check cache
  const cached = timestampCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data[0]?.amount ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('irs_national_standards')
    .select('*')
    .eq('year', year)
    .eq('category', 'food_clothing_misc')
    .eq('household_size', householdSize)
    .maybeSingle()

  if (error) {
    console.error('Error fetching food/clothing/misc allowance:', error)
    return null
  }

  // Cache result
  if (data) {
    timestampCache.set(cacheKey, {
      data: [data],
      timestamp: Date.now(),
    })
  }

  return data?.amount ?? null
}

/**
 * Get housing and utilities allowance by state and county
 */
export async function getHousingUtilitiesAllowance(
  state: string,
  county: string,
  year: number = new Date().getFullYear()
): Promise<number | null> {
  const cacheKey = `housing_utilities_${year}_${state}_${county}`

  // Check cache
  const cached = timestampCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data[0]?.amount ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('irs_national_standards')
    .select('*')
    .eq('year', year)
    .eq('category', 'housing_utilities')
    .eq('state', state)
    .eq('county', county)
    .maybeSingle()

  if (error) {
    console.error('Error fetching housing/utilities allowance:', error)
    return null
  }

  // Cache result
  if (data) {
    timestampCache.set(cacheKey, {
      data: [data],
      timestamp: Date.now(),
    })
  }

  return data?.amount ?? null
}

/**
 * Get transportation ownership allowance by number of vehicles
 */
export async function getTransportationOwnershipAllowance(
  numberOfVehicles: number,
  year: number = new Date().getFullYear()
): Promise<number | null> {
  const cacheKey = `transportation_ownership_${year}_${numberOfVehicles}`

  // Check cache
  const cached = timestampCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data[0]?.amount ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('irs_national_standards')
    .select('*')
    .eq('year', year)
    .eq('category', 'transportation_ownership')
    .eq('household_size', Math.min(numberOfVehicles, 2)) // IRS allows max 2 vehicles
    .maybeSingle()

  if (error) {
    console.error('Error fetching transportation ownership allowance:', error)
    return null
  }

  // Cache result
  if (data) {
    timestampCache.set(cacheKey, {
      data: [data],
      timestamp: Date.now(),
    })
  }

  return data?.amount ?? null
}

/**
 * Get transportation operating costs
 */
export async function getTransportationOperatingCosts(
  region: string = 'National',
  year: number = new Date().getFullYear()
): Promise<number | null> {
  const cacheKey = `transportation_operating_${year}_${region}`

  // Check cache
  const cached = timestampCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data[0]?.amount ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('irs_national_standards')
    .select('*')
    .eq('year', year)
    .eq('category', 'transportation_operating')
    .eq('state', region)
    .maybeSingle()

  if (error) {
    console.error('Error fetching transportation operating costs:', error)
    return null
  }

  // Cache result
  if (data) {
    timestampCache.set(cacheKey, {
      data: [data],
      timestamp: Date.now(),
    })
  }

  return data?.amount ?? null
}

/**
 * Get public transportation allowance
 */
export async function getPublicTransportationAllowance(
  year: number = new Date().getFullYear()
): Promise<number | null> {
  const cacheKey = `transportation_public_${year}`

  // Check cache
  const cached = timestampCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data[0]?.amount ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('irs_national_standards')
    .select('*')
    .eq('year', year)
    .eq('category', 'transportation_public')
    .maybeSingle()

  if (error) {
    console.error('Error fetching public transportation allowance:', error)
    return null
  }

  // Cache result
  if (data) {
    timestampCache.set(cacheKey, {
      data: [data],
      timestamp: Date.now(),
    })
  }

  return data?.amount ?? null
}

/**
 * Get healthcare allowance by age bracket
 */
export async function getHealthcareAllowance(
  ageBracket: 'under_65' | '65_and_over',
  year: number = new Date().getFullYear()
): Promise<number | null> {
  const cacheKey = `healthcare_${year}_${ageBracket}`

  // Check cache
  const cached = timestampCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data[0]?.amount ?? null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('irs_national_standards')
    .select('*')
    .eq('year', year)
    .eq('category', 'out_of_pocket_healthcare')
    .eq('state', ageBracket)
    .maybeSingle()

  if (error) {
    console.error('Error fetching healthcare allowance:', error)
    return null
  }

  // Cache result
  if (data) {
    timestampCache.set(cacheKey, {
      data: [data],
      timestamp: Date.now(),
    })
  }

  return data?.amount ?? null
}

/**
 * Get all national standards for a given year
 */
export async function getAllNationalStandards(
  year: number = new Date().getFullYear()
): Promise<NationalStandard[]> {
  const cacheKey = `all_standards_${year}`

  // Check cache
  const cached = timestampCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('irs_national_standards')
    .select('*')
    .eq('year', year)
    .order('category')

  if (error) {
    console.error('Error fetching all national standards:', error)
    return []
  }

  // Cache result
  if (data) {
    timestampCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    })
  }

  return data ?? []
}

/**
 * Calculate total monthly allowable expenses based on user profile
 */
export async function calculateTotalAllowableExpenses(params: {
  householdSize: number
  state: string
  county: string
  numberOfVehicles: number
  usesPublicTransport: boolean
  ageBracket: 'under_65' | '65_and_over'
  year?: number
}): Promise<number> {
  const year = params.year ?? new Date().getFullYear()

  const [
    foodClothing,
    housing,
    transportOwnership,
    transportOperating,
    publicTransport,
    healthcare,
  ] = await Promise.all([
    getFoodClothingMiscAllowance(params.householdSize, year),
    getHousingUtilitiesAllowance(params.state, params.county, year),
    params.numberOfVehicles > 0
      ? getTransportationOwnershipAllowance(params.numberOfVehicles, year)
      : Promise.resolve(0),
    params.numberOfVehicles > 0
      ? getTransportationOperatingCosts('National', year)
      : Promise.resolve(0),
    params.usesPublicTransport ? getPublicTransportationAllowance(year) : Promise.resolve(0),
    getHealthcareAllowance(params.ageBracket, year),
  ])

  return (
    (foodClothing ?? 0) +
    (housing ?? 0) +
    (transportOwnership ?? 0) +
    (transportOperating ?? 0) * params.numberOfVehicles +
    (publicTransport ?? 0) +
    (healthcare ?? 0)
  )
}
