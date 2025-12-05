'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProfileForm } from '@/components/features/profile'
import { getProfile, updateProfile, type UserProfile } from '@/app/actions/profile'

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await getProfile()
    if (result.success) {
      setProfile(result.data)
    } else {
      setError(result.error)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  const handleSubmit = async (formData: {
    first_name: string | null
    last_name: string | null
    date_of_birth: string | null
    filing_status:
      | 'single'
      | 'married_filing_jointly'
      | 'married_filing_separately'
      | 'head_of_household'
      | 'qualifying_widow'
      | null
    dependents: number
    state: string | null
    county: string | null
    employment_status: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'disabled' | null
    has_health_conditions: boolean
    health_conditions_notes: string | null
  }) => {
    setSuccessMessage(null)
    const result = await updateProfile(formData)
    if (result.success) {
      setProfile(result.data)
      setSuccessMessage('Profile saved successfully!')
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } else {
      throw new Error(result.error)
    }
  }

  // Calculate profile completion percentage
  const calculateCompletion = (p: UserProfile | null): number => {
    if (!p) return 0
    const fields = [
      p.first_name,
      p.last_name,
      p.date_of_birth,
      p.filing_status,
      p.state,
      p.employment_status,
    ]
    const completed = fields.filter((f) => f !== null && f !== '').length
    return Math.round((completed / fields.length) * 100)
  }

  const completion = calculateCompletion(profile)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Profile Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your personal information for tax calculations
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Completion Card */}
      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <CardTitle className="text-base">Profile Completion</CardTitle>
                <CardDescription>
                  {completion === 100
                    ? 'Your profile is complete!'
                    : 'Complete your profile for accurate tax calculations'}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold dark:text-white">{completion}%</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-blue-600 transition-all duration-300 dark:bg-blue-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Form Card */}
      <Card className="dark:border-gray-800 dark:bg-gray-900">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            This information is used to calculate your IRS allowable expenses and eligibility for
            tax relief programs. Your data is stored securely and never shared.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            initialData={
              profile
                ? {
                    first_name: profile.first_name,
                    last_name: profile.last_name,
                    date_of_birth: profile.date_of_birth,
                    filing_status: profile.filing_status as
                      | 'single'
                      | 'married_filing_jointly'
                      | 'married_filing_separately'
                      | 'head_of_household'
                      | 'qualifying_widow'
                      | null,
                    dependents: profile.dependents,
                    state: profile.state,
                    county: profile.county,
                    employment_status: profile.employment_status as
                      | 'employed'
                      | 'self_employed'
                      | 'unemployed'
                      | 'retired'
                      | 'disabled'
                      | null,
                    has_health_conditions: profile.has_health_conditions ?? false,
                    health_conditions_notes: profile.health_conditions_notes,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            submitLabel="Save Profile"
          />
        </CardContent>
      </Card>

      {/* Help Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-base">Why This Information Matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong className="text-gray-900 dark:text-white">Date of Birth:</strong> If
              you&apos;re 65 or older, the IRS uses only 12 months (instead of 60-84 months) of
              future income in OIC calculations.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Household Size:</strong> Determines
              your IRS National Standards for food, clothing, and other necessities.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Location:</strong> Housing and
              transportation allowances vary by state and county.
            </p>
          </CardContent>
        </Card>

        <Card className="dark:border-gray-800 dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-base">Privacy & Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>Your profile information is:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Encrypted at rest and in transit</li>
              <li>Never shared with third parties</li>
              <li>Only used for tax calculations</li>
              <li>Deletable at any time</li>
            </ul>
            <p className="pt-2">
              You can delete your profile and all associated data from the account settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
