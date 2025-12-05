'use client'

import { User, MapPin, Briefcase, Calendar, Users, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ProfileData {
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  filing_status: string | null
  dependents: number
  state: string | null
  county: string | null
  employment_status: string | null
}

interface ProfileSummaryProps {
  profile: ProfileData | null
  editHref?: string
  className?: string
}

const FILING_STATUS_LABELS: Record<string, string> = {
  single: 'Single',
  married_filing_jointly: 'Married Filing Jointly',
  married_filing_separately: 'Married Filing Separately',
  head_of_household: 'Head of Household',
  qualifying_widow: 'Qualifying Widow(er)',
}

const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  employed: 'Employed',
  self_employed: 'Self-Employed',
  unemployed: 'Unemployed',
  retired: 'Retired',
  disabled: 'Disabled',
}

function calculateAge(dob: string | null): number | null {
  if (!dob) return null
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export function ProfileSummary({
  profile,
  editHref = '/settings/profile',
  className,
}: ProfileSummaryProps) {
  if (!profile) {
    return (
      <Card className={cn('dark:border-gray-800 dark:bg-gray-900', className)}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base dark:text-white">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <User className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-3 font-medium dark:text-white">No Profile Yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Complete your profile to get personalized tax insights
            </p>
            <Button asChild className="mt-4">
              <Link href={editHref}>Complete Profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Not provided'
  const age = calculateAge(profile.date_of_birth)
  const location = [profile.county, profile.state].filter(Boolean).join(', ') || 'Not provided'
  const filingStatus = profile.filing_status
    ? FILING_STATUS_LABELS[profile.filing_status] || profile.filing_status
    : 'Not selected'
  const employmentStatus = profile.employment_status
    ? EMPLOYMENT_STATUS_LABELS[profile.employment_status] || profile.employment_status
    : 'Not selected'
  const householdSize = profile.dependents + 1

  const isIncomplete = !profile.first_name || !profile.filing_status || !profile.state

  return (
    <Card className={cn('dark:border-gray-800 dark:bg-gray-900', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base dark:text-white">
          <User className="h-5 w-5" />
          Profile
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={editHref}>
            <Edit2 className="mr-1 h-3 w-3" />
            Edit
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isIncomplete && (
          <div className="rounded-md bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            Profile is incomplete. Some features may be limited.
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Name:</span>
            <span className="font-medium dark:text-white">{name}</span>
          </div>

          {age !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">Age:</span>
              <span className="font-medium dark:text-white">
                {age} years
                {age >= 65 && (
                  <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">(65+)</span>
                )}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Filing:</span>
            <span className="font-medium dark:text-white">{filingStatus}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Household:</span>
            <span className="font-medium dark:text-white">
              {householdSize} {householdSize === 1 ? 'person' : 'people'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Employment:</span>
            <span className="font-medium dark:text-white">{employmentStatus}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Location:</span>
            <span className="font-medium dark:text-white">{location}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
