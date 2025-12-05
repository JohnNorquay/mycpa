'use client'

import { useState, useCallback } from 'react'
import { Loader2, Save, AlertCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

const FILING_STATUSES = [
  { value: 'single', label: 'Single' },
  { value: 'married_filing_jointly', label: 'Married Filing Jointly' },
  { value: 'married_filing_separately', label: 'Married Filing Separately' },
  { value: 'head_of_household', label: 'Head of Household' },
  { value: 'qualifying_widow', label: 'Qualifying Widow(er)' },
]

const EMPLOYMENT_STATUSES = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' },
  { value: 'disabled', label: 'Disabled' },
]

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
]

type FilingStatus =
  | 'single'
  | 'married_filing_jointly'
  | 'married_filing_separately'
  | 'head_of_household'
  | 'qualifying_widow'
  | null

type EmploymentStatus = 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'disabled' | null

interface ProfileFormData {
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  filing_status: FilingStatus
  dependents: number
  state: string | null
  county: string | null
  employment_status: EmploymentStatus
  has_health_conditions: boolean
  health_conditions_notes: string | null
}

interface ProfileFormProps {
  initialData?: Partial<ProfileFormData>
  onSubmit: (data: ProfileFormData) => Promise<void>
  submitLabel?: string
  className?: string
}

export function ProfileForm({
  initialData,
  onSubmit,
  submitLabel = 'Save Profile',
  className,
}: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: initialData?.first_name || null,
    last_name: initialData?.last_name || null,
    date_of_birth: initialData?.date_of_birth || null,
    filing_status: initialData?.filing_status || null,
    dependents: initialData?.dependents || 0,
    state: initialData?.state || null,
    county: initialData?.county || null,
    employment_status: initialData?.employment_status || null,
    has_health_conditions: initialData?.has_health_conditions || false,
    health_conditions_notes: initialData?.health_conditions_notes || null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = useCallback(
    (field: keyof ProfileFormData, value: string | number | boolean | null) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
      setError(null)
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setIsSubmitting(true)

      try {
        await onSubmit(formData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save profile')
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, onSubmit]
  )

  const calculateAge = (dob: string | null): number | null => {
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

  const age = calculateAge(formData.date_of_birth)

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Personal Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b pb-2 dark:border-gray-800">
          <User className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold dark:text-white">Personal Information</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={formData.first_name || ''}
              onChange={(e) => handleChange('first_name', e.target.value || null)}
              placeholder="Enter first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={formData.last_name || ''}
              onChange={(e) => handleChange('last_name', e.target.value || null)}
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth || ''}
              onChange={(e) => handleChange('date_of_birth', e.target.value || null)}
            />
            {age !== null && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Age: {age} years
                {age >= 65 && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                    (OIC future income: 12 months)
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dependents">Number of Dependents</Label>
            <Input
              id="dependents"
              type="number"
              min="0"
              max="20"
              value={formData.dependents}
              onChange={(e) => handleChange('dependents', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Including yourself: {formData.dependents + 1} household member(s)
            </p>
          </div>
        </div>
      </div>

      {/* Tax Information */}
      <div className="space-y-4">
        <div className="border-b pb-2 dark:border-gray-800">
          <h3 className="font-semibold dark:text-white">Tax Information</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="filing_status">Filing Status</Label>
            <select
              id="filing_status"
              value={formData.filing_status || ''}
              onChange={(e) =>
                handleChange('filing_status', (e.target.value as FilingStatus) || null)
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
            >
              <option value="">Select filing status...</option>
              {FILING_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="employment_status">Employment Status</Label>
            <select
              id="employment_status"
              value={formData.employment_status || ''}
              onChange={(e) =>
                handleChange('employment_status', (e.target.value as EmploymentStatus) || null)
              }
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
            >
              <option value="">Select employment status...</option>
              {EMPLOYMENT_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <div className="border-b pb-2 dark:border-gray-800">
          <h3 className="font-semibold dark:text-white">Location</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <select
              id="state"
              value={formData.state || ''}
              onChange={(e) => handleChange('state', e.target.value || null)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm dark:border-gray-800"
            >
              <option value="">Select state...</option>
              {US_STATES.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Used for IRS National Standards lookups
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="county">County</Label>
            <Input
              id="county"
              value={formData.county || ''}
              onChange={(e) => handleChange('county', e.target.value || null)}
              placeholder="Enter county name"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Used for housing allowance calculations
            </p>
          </div>
        </div>
      </div>

      {/* Health Information */}
      <div className="space-y-4">
        <div className="border-b pb-2 dark:border-gray-800">
          <h3 className="font-semibold dark:text-white">Health Information</h3>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="has_health_conditions"
            checked={formData.has_health_conditions}
            onCheckedChange={(checked) => handleChange('has_health_conditions', !!checked)}
          />
          <div className="space-y-1">
            <Label
              htmlFor="has_health_conditions"
              className="cursor-pointer font-normal dark:text-white"
            >
              I have health conditions that affect my ability to work or pay taxes
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This may affect IRS relief program eligibility
            </p>
          </div>
        </div>

        {formData.has_health_conditions && (
          <div className="space-y-2">
            <Label htmlFor="health_conditions_notes">Health Conditions Notes</Label>
            <textarea
              id="health_conditions_notes"
              value={formData.health_conditions_notes || ''}
              onChange={(e) => handleChange('health_conditions_notes', e.target.value || null)}
              placeholder="Describe relevant health conditions (optional, for your records)"
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:border-gray-800"
            />
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
        <h4 className="text-sm font-medium dark:text-white">Profile Summary</h4>
        <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Name:</span>
            <span className="font-medium dark:text-white">
              {formData.first_name || formData.last_name
                ? `${formData.first_name || ''} ${formData.last_name || ''}`.trim()
                : 'Not provided'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Age:</span>
            <span className="font-medium dark:text-white">
              {age !== null ? age : 'Not provided'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Filing Status:</span>
            <span className="font-medium dark:text-white">
              {formData.filing_status
                ? FILING_STATUSES.find((s) => s.value === formData.filing_status)?.label
                : 'Not selected'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Household Size:</span>
            <span className="font-medium dark:text-white">{formData.dependents + 1}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Location:</span>
            <span className="font-medium dark:text-white">
              {formData.state
                ? `${formData.county ? formData.county + ', ' : ''}${formData.state}`
                : 'Not provided'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Employment:</span>
            <span className="font-medium dark:text-white">
              {formData.employment_status
                ? EMPLOYMENT_STATUSES.find((s) => s.value === formData.employment_status)?.label
                : 'Not selected'}
            </span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
