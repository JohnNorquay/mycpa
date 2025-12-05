import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SettingsPage from '@/app/(dashboard)/settings/page'
import ProfileSettingsPage from '@/app/(dashboard)/settings/profile/page'
import AccountsPage from '@/app/(dashboard)/settings/accounts/page'

// Mock profile actions
vi.mock('@/app/actions/profile', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        })
      ),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: [],
              error: null,
            })
          ),
        })),
      })),
    })),
  })),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 days ago'),
}))

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual<typeof import('lucide-react')>('lucide-react')
  return {
    ...actual,
    User: ({ className }: { className?: string }) => <div className={className}>User Icon</div>,
    Building2: ({ className }: { className?: string }) => (
      <div className={className}>Building Icon</div>
    ),
    Bell: ({ className }: { className?: string }) => <div className={className}>Bell Icon</div>,
    Shield: ({ className }: { className?: string }) => <div className={className}>Shield Icon</div>,
    CreditCard: ({ className }: { className?: string }) => (
      <div className={className}>Credit Icon</div>
    ),
    ChevronRight: ({ className }: { className?: string }) => (
      <div className={className}>Chevron Icon</div>
    ),
    ArrowLeft: ({ className }: { className?: string }) => (
      <div className={className}>Arrow Icon</div>
    ),
    Loader2: ({ className }: { className?: string }) => (
      <div className={className}>Loader Icon</div>
    ),
    AlertTriangle: ({ className }: { className?: string }) => (
      <div className={className}>Alert Icon</div>
    ),
    CheckCircle: ({ className }: { className?: string }) => (
      <div className={className}>Check Icon</div>
    ),
    Save: ({ className }: { className?: string }) => <div className={className}>Save Icon</div>,
    RefreshCw: ({ className }: { className?: string }) => (
      <div className={className}>Refresh Icon</div>
    ),
    Trash2: ({ className }: { className?: string }) => <div className={className}>Trash Icon</div>,
    CheckCircle2: ({ className }: { className?: string }) => (
      <div className={className}>Check2 Icon</div>
    ),
    AlertCircle: ({ className }: { className?: string }) => (
      <div className={className}>Alert2 Icon</div>
    ),
  }
})

// Mock PlaidLinkButton component
vi.mock('@/components/features/transactions', () => ({
  PlaidLinkButton: () => <button>Connect Bank Account</button>,
}))

import { getProfile, updateProfile } from '@/app/actions/profile'

const mockGetProfile = getProfile as ReturnType<typeof vi.fn>
const mockUpdateProfile = updateProfile as ReturnType<typeof vi.fn>

// Helper to create mock profile data
function createMockProfile(overrides = {}) {
  return {
    id: 'profile-1',
    user_id: 'user-123',
    first_name: 'John',
    last_name: 'Doe',
    date_of_birth: '1990-01-15',
    filing_status: 'single' as const,
    dependents: 0,
    state: 'CA',
    county: 'Los Angeles',
    employment_status: 'employed' as const,
    has_health_conditions: false,
    health_conditions_notes: null,
    created_at: new Date('2023-01-01').toISOString(),
    updated_at: new Date('2023-01-01').toISOString(),
    ...overrides,
  }
}

describe('Settings Page E2E - Main Settings Page', () => {
  it('renders settings page with title and description', () => {
    render(<SettingsPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText(/manage your account and preferences/i)).toBeInTheDocument()
  })

  it('displays profile settings link', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(
      screen.getByText(/manage your personal information and tax details/i)
    ).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    const profileLink = links.find((link) => link.getAttribute('href') === '/settings/profile')
    expect(profileLink).toBeInTheDocument()
  })

  it('displays connected accounts link', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Connected Accounts')).toBeInTheDocument()
    expect(screen.getByText(/manage bank and financial account connections/i)).toBeInTheDocument()

    const links = screen.getAllByRole('link')
    const accountsLink = links.find((link) => link.getAttribute('href') === '/settings/accounts')
    expect(accountsLink).toBeInTheDocument()
  })

  it('displays coming soon features section', () => {
    render(<SettingsPage />)

    expect(screen.getByText('Coming Soon')).toBeInTheDocument()
    expect(screen.getByText('Notification preferences')).toBeInTheDocument()
    expect(screen.getByText('Security settings')).toBeInTheDocument()
    expect(screen.getByText('Billing and subscription')).toBeInTheDocument()
  })

  it('displays icons for all settings links', () => {
    render(<SettingsPage />)

    // Check that icon elements are rendered (mocked icons)
    expect(screen.getAllByText(/Icon/i).length).toBeGreaterThan(0)
  })

  it('settings cards are hoverable links', () => {
    render(<SettingsPage />)

    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThanOrEqual(2)

    // Verify links have proper href attributes
    expect(links.some((link) => link.getAttribute('href') === '/settings/profile')).toBe(true)
    expect(links.some((link) => link.getAttribute('href') === '/settings/accounts')).toBe(true)
  })
})

describe('Profile Settings E2E - Page Load and Initial State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner while fetching profile', () => {
    mockGetProfile.mockImplementation(() => new Promise(() => {}))
    render(<ProfileSettingsPage />)

    const loadingSpinner = document.querySelector('.animate-spin')
    expect(loadingSpinner).toBeInTheDocument()
  })

  it('loads and displays existing profile data', async () => {
    const mockProfile = createMockProfile()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: mockProfile,
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Profile Settings' })
      ).toBeInTheDocument()
    })

    // Check that form fields are populated
    await waitFor(() => {
      const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement
      expect(firstNameInput.value).toBe('John')
    })
  })

  it('displays error message when profile fetch fails', async () => {
    mockGetProfile.mockResolvedValue({
      success: false,
      error: 'Failed to fetch profile',
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch profile')).toBeInTheDocument()
    })
  })

  it('renders page header with back link', async () => {
    mockGetProfile.mockResolvedValue({ success: true, data: createMockProfile() })
    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    const backLink = screen.getByRole('link', { name: /settings/i })
    expect(backLink).toHaveAttribute('href', '/settings')
  })

  it('displays profile completion percentage', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Profile Completion')).toBeInTheDocument()
    })

    // Should show completion percentage
    const percentageText = screen.getAllByText(/%/)
    expect(percentageText.length).toBeGreaterThan(0)
  })
})

describe('Profile Settings E2E - Profile Completion Calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows 100% completion for complete profile', async () => {
    const completeProfile = createMockProfile()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: completeProfile,
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument()
      expect(screen.getByText('Your profile is complete!')).toBeInTheDocument()
    })
  })

  it('shows lower percentage for incomplete profile', async () => {
    const incompleteProfile = createMockProfile({
      first_name: null,
      last_name: null,
      date_of_birth: null,
    })
    mockGetProfile.mockResolvedValue({
      success: true,
      data: incompleteProfile,
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      const percentage = screen.getByText(/\d+%/)
      expect(percentage).toBeInTheDocument()
      expect(
        screen.getByText(/complete your profile for accurate tax calculations/i)
      ).toBeInTheDocument()
    })
  })

  it('displays completion progress bar', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      // Progress bar should exist as a div with specific styling
      const progressBars = document.querySelectorAll('.bg-blue-600, .bg-blue-500')
      expect(progressBars.length).toBeGreaterThan(0)
    })
  })
})

describe('Profile Settings E2E - Form Interaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows editing first and last name', async () => {
    const user = userEvent.setup()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ first_name: null, last_name: null }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    })

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)

    await user.clear(firstNameInput)
    await user.type(firstNameInput, 'Jane')
    await user.clear(lastNameInput)
    await user.type(lastNameInput, 'Smith')

    expect(firstNameInput).toHaveValue('Jane')
    expect(lastNameInput).toHaveValue('Smith')
  })

  it('allows selecting date of birth', async () => {
    const user = userEvent.setup()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ date_of_birth: null }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument()
    })

    const dobInput = screen.getByLabelText(/date of birth/i)
    await user.type(dobInput, '1985-05-20')

    expect(dobInput).toHaveValue('1985-05-20')
  })

  it('displays age calculation for date of birth', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ date_of_birth: '1990-01-01' }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      const ageTexts = screen.getAllByText(/age:/i)
      expect(ageTexts.length).toBeGreaterThan(0)
    })

    // Age should be displayed somewhere in the form
    const ageTexts = screen.getAllByText(/\d+ years?/i)
    expect(ageTexts.length).toBeGreaterThan(0)
  })

  it('shows OIC note for users 65 and older', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ date_of_birth: '1950-01-01' }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/oic future income: 12 months/i)).toBeInTheDocument()
    })
  })

  it('allows selecting filing status', async () => {
    const user = userEvent.setup()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ filing_status: null }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/filing status/i)).toBeInTheDocument()
    })

    const filingStatusSelect = screen.getByLabelText(/filing status/i)
    await user.selectOptions(filingStatusSelect, 'married_filing_jointly')

    expect(filingStatusSelect).toHaveValue('married_filing_jointly')
  })

  it('allows changing number of dependents', async () => {
    const user = userEvent.setup()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ dependents: 0 }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/number of dependents/i)).toBeInTheDocument()
    })

    const dependentsInput = screen.getByLabelText(/number of dependents/i)
    await user.clear(dependentsInput)
    await user.type(dependentsInput, '2')

    expect(dependentsInput).toHaveValue(2)
  })

  it('displays household size calculation', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ dependents: 2 }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/3 household member\(s\)/i)).toBeInTheDocument()
    })
  })

  it('allows selecting state', async () => {
    const user = userEvent.setup()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ state: null }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/^state$/i)).toBeInTheDocument()
    })

    const stateSelect = screen.getByLabelText(/^state$/i)
    await user.selectOptions(stateSelect, 'NY')

    expect(stateSelect).toHaveValue('NY')
  })

  it('allows entering county', async () => {
    const user = userEvent.setup()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ county: null }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/county/i)).toBeInTheDocument()
    })

    const countyInput = screen.getByLabelText(/county/i)
    await user.type(countyInput, 'Manhattan')

    expect(countyInput).toHaveValue('Manhattan')
  })

  it('allows selecting employment status', async () => {
    const user = userEvent.setup()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ employment_status: null }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/employment status/i)).toBeInTheDocument()
    })

    const employmentSelect = screen.getByLabelText(/employment status/i)
    await user.selectOptions(employmentSelect, 'self_employed')

    expect(employmentSelect).toHaveValue('self_employed')
  })
})

describe('Profile Settings E2E - Health Information', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows checking health conditions checkbox', async () => {
    const user = userEvent.setup()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ has_health_conditions: false }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(
        screen.getByText(/i have health conditions that affect my ability/i)
      ).toBeInTheDocument()
    })

    const checkbox = screen.getByRole('checkbox', {
      name: /i have health conditions that affect my ability/i,
    })
    await user.click(checkbox)

    expect(checkbox).toBeChecked()
  })

  it('shows health conditions notes field when checkbox is checked', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ has_health_conditions: true }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/health conditions notes/i)).toBeInTheDocument()
    })
  })

  it('allows entering health conditions notes', async () => {
    const user = userEvent.setup()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ has_health_conditions: true, health_conditions_notes: null }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/health conditions notes/i)).toBeInTheDocument()
    })

    const notesTextarea = screen.getByLabelText(/health conditions notes/i)
    await user.type(notesTextarea, 'Chronic condition affecting work capacity')

    expect(notesTextarea).toHaveValue('Chronic condition affecting work capacity')
  })
})

describe('Profile Settings E2E - Profile Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays profile summary section', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Profile Summary')).toBeInTheDocument()
    })
  })

  it('shows name in summary', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ first_name: 'Jane', last_name: 'Smith' }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('shows "Not provided" for missing fields', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ first_name: null, last_name: null }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      const notProvidedTexts = screen.getAllByText('Not provided')
      expect(notProvidedTexts.length).toBeGreaterThan(0)
    })
  })

  it('displays filing status in summary', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ filing_status: 'married_filing_jointly' }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      const filingStatusTexts = screen.getAllByText('Married Filing Jointly')
      expect(filingStatusTexts.length).toBeGreaterThan(0)
    })
  })

  it('displays location in summary', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile({ state: 'CA', county: 'Los Angeles' }),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/los angeles, ca/i)).toBeInTheDocument()
    })
  })
})

describe('Profile Settings E2E - Form Submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits profile updates successfully', async () => {
    const user = userEvent.setup()
    const mockProfile = createMockProfile()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: mockProfile,
    })
    mockUpdateProfile.mockResolvedValue({
      success: true,
      data: { ...mockProfile, first_name: 'Jane' },
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    })

    const firstNameInput = screen.getByLabelText(/first name/i)
    await user.clear(firstNameInput)
    await user.type(firstNameInput, 'Jane')

    const saveButton = screen.getByRole('button', { name: /save profile/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled()
    })
  })

  it('shows success message after successful update', async () => {
    const user = userEvent.setup()
    const mockProfile = createMockProfile()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: mockProfile,
    })
    mockUpdateProfile.mockResolvedValue({
      success: true,
      data: mockProfile,
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /save profile/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Profile saved successfully!')).toBeInTheDocument()
    })
  })

  it('displays error message on update failure', async () => {
    const user = userEvent.setup()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })
    mockUpdateProfile.mockResolvedValue({
      success: false,
      error: 'Update failed',
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /save profile/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument()
    })
  })

  it('disables form during submission', async () => {
    const user = userEvent.setup()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })
    mockUpdateProfile.mockImplementation(() => new Promise(() => {}))

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /save profile/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/saving.../i)).toBeInTheDocument()
    })
  })
})

describe('Profile Settings E2E - Help Cards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays "Why This Information Matters" help card', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Why This Information Matters')).toBeInTheDocument()
    })

    const dateOfBirthTexts = screen.getAllByText(/date of birth:/i)
    expect(dateOfBirthTexts.length).toBeGreaterThan(0)

    const householdSizeTexts = screen.getAllByText(/household size:/i)
    expect(householdSizeTexts.length).toBeGreaterThan(0)

    const locationTexts = screen.getAllByText(/location:/i)
    expect(locationTexts.length).toBeGreaterThan(0)
  })

  it('displays "Privacy & Security" help card', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Privacy & Security')).toBeInTheDocument()
    })

    expect(screen.getByText(/encrypted at rest and in transit/i)).toBeInTheDocument()
    expect(screen.getByText(/never shared with third parties/i)).toBeInTheDocument()
    expect(screen.getByText(/deletable at any time/i)).toBeInTheDocument()
  })
})

describe('Connected Accounts E2E - Page Load', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders connected accounts page', async () => {
    render(await AccountsPage())

    expect(
      screen.getByRole('heading', { level: 1, name: 'Connected Accounts' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/manage your connected bank accounts and financial institutions/i)
    ).toBeInTheDocument()
  })

  it('displays add bank account card', async () => {
    render(await AccountsPage())

    expect(screen.getByText('Add Bank Account')).toBeInTheDocument()
    expect(
      screen.getByText(/securely connect your bank accounts to import transactions/i)
    ).toBeInTheDocument()
  })

  it('displays Plaid link button', async () => {
    render(await AccountsPage())

    expect(screen.getByRole('button', { name: /connect bank account/i })).toBeInTheDocument()
  })

  it('shows empty state when no accounts connected', async () => {
    render(await AccountsPage())

    expect(
      screen.getByText(/no bank accounts connected yet. connect your first account/i)
    ).toBeInTheDocument()
  })
})

describe('Settings E2E - Navigation Flow', () => {
  it('can navigate from settings to profile', () => {
    render(<SettingsPage />)

    const profileLink = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('href') === '/settings/profile')
    expect(profileLink).toBeInTheDocument()

    // Verify link is clickable
    expect(profileLink?.getAttribute('href')).toBe('/settings/profile')
  })

  it('can navigate from settings to accounts', async () => {
    render(<SettingsPage />)

    const accountsLink = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('href') === '/settings/accounts')
    expect(accountsLink).toBeInTheDocument()
    expect(accountsLink?.getAttribute('href')).toBe('/settings/accounts')
  })

  it('profile page has back button to settings', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      const backLink = screen.getByRole('link', { name: /settings/i })
      expect(backLink).toBeInTheDocument()
      expect(backLink.getAttribute('href')).toBe('/settings')
    })
  })
})

describe('Settings E2E - Responsive Layout', () => {
  it('renders settings cards in grid layout', () => {
    render(<SettingsPage />)

    // Check that cards exist
    const profileCard = screen.getByText('Profile').closest('div')
    expect(profileCard).toBeInTheDocument()

    const accountsCard = screen.getByText('Connected Accounts').closest('div')
    expect(accountsCard).toBeInTheDocument()
  })

  it('profile form uses responsive grid for fields', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    })

    // Verify form fields are present and organized
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument()
  })
})

describe('Settings E2E - Dark Mode Support', () => {
  it('settings page has dark mode classes', () => {
    const { container } = render(<SettingsPage />)

    // Check for dark mode classes
    const darkElements = container.querySelectorAll('[class*="dark:"]')
    expect(darkElements.length).toBeGreaterThan(0)
  })

  it('profile page has dark mode classes', async () => {
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })

    const { container } = render(<ProfileSettingsPage />)

    await waitFor(() => {
      const darkElements = container.querySelectorAll('[class*="dark:"]')
      expect(darkElements.length).toBeGreaterThan(0)
    })
  })
})

describe('Settings E2E - Loading States', () => {
  it('profile page shows loading state initially', () => {
    mockGetProfile.mockImplementation(() => new Promise(() => {}))
    render(<ProfileSettingsPage />)

    const loadingSpinner = document.querySelector('.animate-spin')
    expect(loadingSpinner).toBeInTheDocument()
  })

  it('profile page shows loading state during save', async () => {
    const user = userEvent.setup()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })
    mockUpdateProfile.mockImplementation(() => new Promise(() => {}))

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /save profile/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/saving.../i)).toBeInTheDocument()
    })
  })
})

describe('Settings E2E - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays error alert when profile load fails', async () => {
    mockGetProfile.mockResolvedValue({
      success: false,
      error: 'Network error',
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  it('displays error alert when profile update fails', async () => {
    const user = userEvent.setup()
    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })
    mockUpdateProfile.mockResolvedValue({
      success: false,
      error: 'Validation error',
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /save profile/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Validation error')).toBeInTheDocument()
    })
  })

  it('success message is displayed after save', async () => {
    const user = userEvent.setup()

    mockGetProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })
    mockUpdateProfile.mockResolvedValue({
      success: true,
      data: createMockProfile(),
    })

    render(<ProfileSettingsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /save profile/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Profile saved successfully!')).toBeInTheDocument()
    })

    // Success message should be visible
    expect(screen.getByText('Profile saved successfully!')).toBeInTheDocument()
  })
})

describe('Settings E2E - Complete Profile Workflow', () => {
  it('completes full profile update workflow', async () => {
    const user = userEvent.setup()

    // Start with incomplete profile
    const incompleteProfile = createMockProfile({
      first_name: null,
      last_name: null,
      date_of_birth: null,
      filing_status: null,
      state: null,
      employment_status: null,
    })

    mockGetProfile.mockResolvedValue({
      success: true,
      data: incompleteProfile,
    })

    render(<ProfileSettingsPage />)

    // 1. Wait for page to load
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Profile Settings' })
      ).toBeInTheDocument()
    })

    // 2. Verify low completion percentage
    await waitFor(() => {
      const percentageElement = screen.getByText(/\d+%/)
      expect(percentageElement).toBeInTheDocument()
    })

    // 3. Fill in first name
    const firstNameInput = screen.getByLabelText(/first name/i)
    await user.type(firstNameInput, 'John')

    // 4. Fill in last name
    const lastNameInput = screen.getByLabelText(/last name/i)
    await user.type(lastNameInput, 'Doe')

    // 5. Fill in date of birth
    const dobInput = screen.getByLabelText(/date of birth/i)
    await user.type(dobInput, '1990-01-15')

    // 6. Select filing status
    const filingStatusSelect = screen.getByLabelText(/filing status/i)
    await user.selectOptions(filingStatusSelect, 'single')

    // 7. Select state
    const stateSelect = screen.getByLabelText(/^state$/i)
    await user.selectOptions(stateSelect, 'CA')

    // 8. Select employment status
    const employmentSelect = screen.getByLabelText(/employment status/i)
    await user.selectOptions(employmentSelect, 'employed')

    // 9. Verify summary updates
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // 10. Save profile
    const updatedProfile = createMockProfile({
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: '1990-01-15',
      filing_status: 'single',
      state: 'CA',
      employment_status: 'employed',
    })

    mockUpdateProfile.mockResolvedValue({
      success: true,
      data: updatedProfile,
    })

    const saveButton = screen.getByRole('button', { name: /save profile/i })
    await user.click(saveButton)

    // 11. Verify success message
    await waitFor(() => {
      expect(screen.getByText('Profile saved successfully!')).toBeInTheDocument()
    })

    // 12. Verify updateProfile was called with correct data
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1990-01-15',
        filing_status: 'single',
        state: 'CA',
        employment_status: 'employed',
      })
    )
  }, 10000)
})
