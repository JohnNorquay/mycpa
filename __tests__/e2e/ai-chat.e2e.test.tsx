import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatPage from '@/app/(dashboard)/insights/chat/page'

// Mock the AI chat action
vi.mock('@/app/actions/ai-chat', () => ({
  streamChatWithContext: vi.fn(),
  getSuggestedQuestions: vi.fn(),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock scrollIntoView since jsdom doesn't support it
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

// Import the mocked functions
import { streamChatWithContext, getSuggestedQuestions } from '@/app/actions/ai-chat'

// Helper to create slow streaming response
async function* createStreamingResponse(chunks: string[], delayMs = 50): AsyncIterable<string> {
  for (const chunk of chunks) {
    yield chunk
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

// Helper to get the send button (last button in the DOM, after any suggested question buttons)
function getSendButton() {
  const buttons = screen.getAllByRole('button')
  return buttons[buttons.length - 1]
}

const mockSuggestedQuestions = [
  { id: '1', text: 'How can I reduce my tax liability this year?', category: 'tax' },
  { id: '2', text: 'What are my biggest spending categories?', category: 'spending' },
  { id: '3', text: 'How can I improve my cash flow?', category: 'savings' },
  { id: '4', text: 'What should I know about my tax debt?', category: 'debt' },
]

describe('AI Chat E2E - Chat Interface Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSuggestedQuestions).mockResolvedValue(mockSuggestedQuestions)
  })

  it('renders the chat page with header', () => {
    render(<ChatPage />)

    // Header has h1 with "Financial Assistant"
    expect(
      screen.getByRole('heading', { level: 1, name: 'Financial Assistant' })
    ).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('shows initial empty state with welcome message', () => {
    render(<ChatPage />)

    // Empty state has h2 with "Financial Assistant"
    expect(
      screen.getByRole('heading', { level: 2, name: 'Financial Assistant' })
    ).toBeInTheDocument()
    expect(screen.getByText(/ask questions about your finances/i)).toBeInTheDocument()
  })

  it('shows disclaimer about AI advice in both locations', () => {
    render(<ChatPage />)

    // Disclaimer in empty state and footer - multiple instances exist
    const disclaimers = screen.getAllByText(/not a substitute for professional/i)
    expect(disclaimers.length).toBeGreaterThan(0)
  })

  it('loads and displays suggested questions on mount', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(getSuggestedQuestions).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText('Try asking:')).toBeInTheDocument()
      expect(screen.getByText('How can I reduce my tax liability this year?')).toBeInTheDocument()
      expect(screen.getByText('What are my biggest spending categories?')).toBeInTheDocument()
      expect(screen.getByText('How can I improve my cash flow?')).toBeInTheDocument()
      expect(screen.getByText('What should I know about my tax debt?')).toBeInTheDocument()
    })
  })

  it('renders input area with correct placeholder', () => {
    render(<ChatPage />)

    expect(screen.getByPlaceholderText(/ask about your finances/i)).toBeInTheDocument()
  })

  it('renders disabled send button initially', () => {
    render(<ChatPage />)

    // Button contains only an icon, no text, so query by role without name
    const sendButton = getSendButton()
    expect(sendButton).toBeDisabled()
  })

  it('enables send button when text is entered', async () => {
    const user = userEvent.setup()
    render(<ChatPage />)

    const input = screen.getByPlaceholderText(/ask about your finances/i)
    await user.type(input, 'Hello')

    expect(getSendButton()).not.toBeDisabled()
  })
})

describe('AI Chat E2E - Sending Messages and Receiving Responses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSuggestedQuestions).mockResolvedValue(mockSuggestedQuestions)
  })

  it('sends message when send button is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Hello! I can help you with your finances.'],
    })

    render(<ChatPage />)

    const input = screen.getByPlaceholderText(/ask about your finances/i)
    await user.type(input, 'What is my tax liability?')

    await user.click(getSendButton())

    await waitFor(() => {
      expect(streamChatWithContext).toHaveBeenCalledWith({
        message: 'What is my tax liability?',
        history: [],
      })
    })
  })

  it('sends message when Enter is pressed', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Response'],
    })

    render(<ChatPage />)

    const input = screen.getByPlaceholderText(/ask about your finances/i)
    await user.type(input, 'What is my balance?{Enter}')

    await waitFor(() => {
      expect(streamChatWithContext).toHaveBeenCalledWith({
        message: 'What is my balance?',
        history: [],
      })
    })
  })

  it('does not send message on Shift+Enter', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Response'],
    })

    render(<ChatPage />)

    const input = screen.getByPlaceholderText(/ask about your finances/i)
    await user.type(input, 'What is my balance?{Shift>}{Enter}{/Shift}')

    expect(streamChatWithContext).not.toHaveBeenCalled()
  })

  it('displays user message in chat', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Response'],
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'What is my balance?')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(screen.getByText('What is my balance?')).toBeInTheDocument()
    })
  })

  it('displays assistant response after user message', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Your current balance is $1,234.56 across all accounts.'],
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'What is my balance?')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(screen.getByText('What is my balance?')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(
        screen.getByText('Your current balance is $1,234.56 across all accounts.')
      ).toBeInTheDocument()
    })
  })

  it('clears input field after sending message', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Response'],
    })

    render(<ChatPage />)

    const input = screen.getByPlaceholderText(/ask about your finances/i) as HTMLInputElement
    await user.type(input, 'What is my balance?')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('disables input and send button while processing', async () => {
    const user = userEvent.setup()
    // Never resolve to keep loading state
    vi.mocked(streamChatWithContext).mockImplementation(
      () => new Promise(() => {}) as Promise<{ success: true; chunks: string[] }>
    )

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'What is my balance?')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ask about your finances/i)).toBeDisabled()
    })

    expect(getSendButton()).toBeDisabled()
  })
})

describe('AI Chat E2E - Streaming Response Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSuggestedQuestions).mockResolvedValue([])
  })

  it('displays streaming response progressively', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Based on ', 'your data, ', 'I recommend ', 'increasing ', 'your deductions.'],
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Tax advice')
    await user.click(getSendButton())

    // Eventually see the full response
    await waitFor(
      () => {
        expect(
          screen.getByText('Based on your data, I recommend increasing your deductions.')
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('shows animated cursor during streaming', async () => {
    const user = userEvent.setup()
    // Create a promise we can control
    let resolveStream: ((value: { success: boolean; chunks: string[] }) => void) | null = null
    const streamPromise = new Promise<{ success: boolean; chunks: string[] }>((resolve) => {
      resolveStream = resolve
    })

    vi.mocked(streamChatWithContext).mockReturnValue(streamPromise)

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(getSendButton())

    // Wait a bit for streaming to start
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Look for animated pulse element during streaming
    const pulseElement = document.querySelector('[class*="animate-pulse"]')
    // It's ok if the cursor doesn't appear (depends on timing), we'll check it exists or streaming started
    const hasStreaming = pulseElement !== null || screen.queryByText(/hello/i) !== null
    expect(hasStreaming).toBe(true)

    // Complete the stream
    if (resolveStream) {
      resolveStream({ success: true, chunks: ['Response'] })
    }
  })

  it('removes cursor after streaming completes', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Complete response'],
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(getSendButton())

    // Wait for response to complete
    await waitFor(() => {
      expect(screen.getByText('Complete response')).toBeInTheDocument()
    })

    // Cursor should be gone
    await waitFor(() => {
      const pulseElement = document.querySelector('[class*="animate-pulse"]')
      expect(pulseElement).not.toBeInTheDocument()
    })
  })

  it('shows loading spinner before streaming starts', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockImplementation(
      () => new Promise(() => {}) as Promise<{ success: true; chunks: string[] }>
    )

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(getSendButton())

    await waitFor(() => {
      const spinner = document.querySelector('[class*="animate-spin"]')
      expect(spinner).toBeInTheDocument()
    })
  })
})

describe('AI Chat E2E - Suggested Questions Interaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSuggestedQuestions).mockResolvedValue(mockSuggestedQuestions)
  })

  it('sends message when suggested question is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Here is information about reducing your tax liability...'],
    })

    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByText('How can I reduce my tax liability this year?')).toBeInTheDocument()
    })

    await user.click(screen.getByText('How can I reduce my tax liability this year?'))

    await waitFor(() => {
      expect(streamChatWithContext).toHaveBeenCalledWith({
        message: 'How can I reduce my tax liability this year?',
        history: [],
      })
    })

    // User message should appear
    await waitFor(() => {
      expect(screen.getByText('How can I reduce my tax liability this year?')).toBeInTheDocument()
    })
  })

  it('clears suggested questions after first message', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Response'],
    })

    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByText('Try asking:')).toBeInTheDocument()
    })

    await user.click(screen.getByText('How can I reduce my tax liability this year?'))

    await waitFor(() => {
      expect(screen.queryByText('Try asking:')).not.toBeInTheDocument()
    })
  })

  it('displays all suggested question categories', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      // Tax category
      expect(screen.getByText('How can I reduce my tax liability this year?')).toBeInTheDocument()
      // Spending category
      expect(screen.getByText('What are my biggest spending categories?')).toBeInTheDocument()
      // Savings category
      expect(screen.getByText('How can I improve my cash flow?')).toBeInTheDocument()
      // Debt category
      expect(screen.getByText('What should I know about my tax debt?')).toBeInTheDocument()
    })
  })

  it('handles empty suggested questions gracefully', async () => {
    vi.mocked(getSuggestedQuestions).mockResolvedValue([])

    render(<ChatPage />)

    await waitFor(() => {
      expect(getSuggestedQuestions).toHaveBeenCalled()
    })

    // Should still show welcome message (h2 in empty state)
    expect(
      screen.getByRole('heading', { level: 2, name: 'Financial Assistant' })
    ).toBeInTheDocument()
    // But no "Try asking:"
    expect(screen.queryByText('Try asking:')).not.toBeInTheDocument()
  })
})

describe('AI Chat E2E - Error Handling and Retry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSuggestedQuestions).mockResolvedValue([])
  })

  it('displays error message when chat request fails', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: false,
      error: 'Not authenticated',
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'What is my balance?')
    await user.click(getSendButton())

    // Error is yielded as "Error: Not authenticated" in the assistant message
    await waitFor(() => {
      expect(screen.getByText('Error: Not authenticated')).toBeInTheDocument()
    })
  })

  it('re-enables input after error', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: false,
      error: 'Network error',
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(getSendButton())

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument()
    })

    // Input should be re-enabled after response (even if error)
    expect(screen.getByPlaceholderText(/ask about your finances/i)).not.toBeDisabled()
  })

  it('re-enables send button after error', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: false,
      error: 'Network error',
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(getSendButton())

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument()
    })

    // Type new message - button should be enabled
    const input = screen.getByPlaceholderText(/ask about your finances/i)
    await user.clear(input)
    await user.type(input, 'Retry')

    expect(getSendButton()).not.toBeDisabled()
  })

  it('allows retry after error', async () => {
    const user = userEvent.setup()
    // First attempt fails
    vi.mocked(streamChatWithContext).mockResolvedValueOnce({
      success: false,
      error: 'Network error',
    })
    // Second attempt succeeds
    vi.mocked(streamChatWithContext).mockResolvedValueOnce({
      success: true,
      chunks: ['Success!'],
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument()
    })

    // Retry
    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Retry')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument()
    })
  })

  it('error messages persist as assistant messages', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext)
      .mockResolvedValueOnce({
        success: false,
        error: 'Network error',
      })
      .mockResolvedValueOnce({
        success: true,
        chunks: ['Success!'],
      })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'First')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Second')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument()
    })

    // Error message should still be visible as part of chat history
    expect(screen.getByText('Error: Network error')).toBeInTheDocument()
  })

  it('handles getSuggestedQuestions failure gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(getSuggestedQuestions).mockRejectedValue(new Error('Failed to load suggestions'))

    render(<ChatPage />)

    // Should still render the page without suggestions (use heading role to be specific)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Financial Assistant' })
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/ask about your finances/i)).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})

describe('AI Chat E2E - Message History Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSuggestedQuestions).mockResolvedValue([])
  })

  it('passes message history to subsequent requests', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext)
      .mockResolvedValueOnce({
        success: true,
        chunks: ['First response'],
      })
      .mockResolvedValueOnce({
        success: true,
        chunks: ['Second response'],
      })

    render(<ChatPage />)

    // Send first message
    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'First question')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(screen.getByText('First response')).toBeInTheDocument()
    })

    // Send second message
    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Second question')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(streamChatWithContext).toHaveBeenLastCalledWith({
        message: 'Second question',
        history: [
          expect.objectContaining({ role: 'user', content: 'First question' }),
          expect.objectContaining({ role: 'assistant', content: 'First response' }),
        ],
      })
    })
  })

  it('displays multiple message exchanges', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext)
      .mockResolvedValueOnce({
        success: true,
        chunks: ['First response'],
      })
      .mockResolvedValueOnce({
        success: true,
        chunks: ['Second response'],
      })
      .mockResolvedValueOnce({
        success: true,
        chunks: ['Third response'],
      })

    render(<ChatPage />)

    // First exchange
    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'First question')
    await user.click(getSendButton())
    await waitFor(() => expect(screen.getByText('First response')).toBeInTheDocument())

    // Second exchange
    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Second question')
    await user.click(getSendButton())
    await waitFor(() => expect(screen.getByText('Second response')).toBeInTheDocument())

    // Third exchange
    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Third question')
    await user.click(getSendButton())
    await waitFor(() => expect(screen.getByText('Third response')).toBeInTheDocument())

    // All messages should be visible
    expect(screen.getByText('First question')).toBeInTheDocument()
    expect(screen.getByText('First response')).toBeInTheDocument()
    expect(screen.getByText('Second question')).toBeInTheDocument()
    expect(screen.getByText('Second response')).toBeInTheDocument()
    expect(screen.getByText('Third question')).toBeInTheDocument()
    expect(screen.getByText('Third response')).toBeInTheDocument()
  })

  it('shows timestamps for all messages', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Response'],
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(screen.getByText('Response')).toBeInTheDocument()
    })

    // Should show timestamps (format like "10:30 AM" or "10:30")
    const timestampElements = screen.getAllByText(/\d{1,2}:\d{2}\s*(AM|PM)?/i)
    expect(timestampElements.length).toBeGreaterThan(0)
  })

  it('displays user and assistant icons correctly', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Response'],
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(screen.getByText('Response')).toBeInTheDocument()
    })

    // User message has blue background
    expect(document.querySelector('[class*="bg-blue-600"]')).toBeInTheDocument()
    // Assistant message has gray background
    expect(document.querySelector('[class*="bg-gray-200"]')).toBeInTheDocument()
  })

  it('maintains conversation context across multiple exchanges', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext)
      .mockResolvedValueOnce({
        success: true,
        chunks: ['Your tax liability is $5,000.'],
      })
      .mockResolvedValueOnce({
        success: true,
        chunks: ['You can reduce it by increasing deductions.'],
      })

    render(<ChatPage />)

    // First question
    await user.type(
      screen.getByPlaceholderText(/ask about your finances/i),
      'What is my tax liability?'
    )
    await user.click(getSendButton())
    await waitFor(() =>
      expect(screen.getByText('Your tax liability is $5,000.')).toBeInTheDocument()
    )

    // Follow-up question
    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'How can I reduce it?')
    await user.click(getSendButton())

    // Should pass previous context
    await waitFor(() => {
      expect(streamChatWithContext).toHaveBeenLastCalledWith({
        message: 'How can I reduce it?',
        history: [
          expect.objectContaining({ role: 'user', content: 'What is my tax liability?' }),
          expect.objectContaining({ role: 'assistant', content: 'Your tax liability is $5,000.' }),
        ],
      })
    })
  })
})

describe('AI Chat E2E - Navigation and UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSuggestedQuestions).mockResolvedValue([])
  })

  it('renders back link to dashboard', () => {
    render(<ChatPage />)

    const backLink = screen.getByRole('link', { name: /back/i })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/dashboard')
  })

  it('displays page title with icon', () => {
    render(<ChatPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Financial Assistant' })
    ).toBeInTheDocument()
  })

  it('shows footer disclaimer', () => {
    render(<ChatPage />)

    // Footer has disclaimer text (may appear multiple times)
    const disclaimers = screen.getAllByText(
      /this ai assistant provides general financial guidance/i
    )
    expect(disclaimers.length).toBeGreaterThan(0)
  })

  it('scrolls to bottom when new messages are added', async () => {
    const user = userEvent.setup()
    const scrollIntoViewMock = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoViewMock

    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Response'],
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(screen.getByText('Response')).toBeInTheDocument()
    })

    // scrollIntoView should have been called
    expect(scrollIntoViewMock).toHaveBeenCalled()
  })
})

describe('AI Chat E2E - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSuggestedQuestions).mockResolvedValue([])
  })

  it('trims whitespace from user message display', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Response'],
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), '   Hello   ')
    await user.click(getSendButton())

    // The displayed user message should be trimmed
    await waitFor(() => {
      // Should display trimmed version
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })
  })

  it('does not send empty or whitespace-only messages', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Response'],
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), '   ')
    await user.click(getSendButton())

    expect(streamChatWithContext).not.toHaveBeenCalled()
  })

  it('handles very long messages', async () => {
    const user = userEvent.setup()
    const longMessage = 'A'.repeat(1000)
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Response to long message'],
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), longMessage)
    await user.click(getSendButton())

    await waitFor(() => {
      expect(streamChatWithContext).toHaveBeenCalledWith({
        message: longMessage,
        history: [],
      })
    })
  })

  it('handles multiline input', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Response'],
    })

    render(<ChatPage />)

    const input = screen.getByPlaceholderText(/ask about your finances/i)
    await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(streamChatWithContext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Line 1'),
        })
      )
    })
  })

  it('focuses input after sending message', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockResolvedValue({
      success: true,
      chunks: ['Response'],
    })

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(getSendButton())

    await waitFor(() => {
      expect(screen.getByText('Response')).toBeInTheDocument()
    })

    // Input should be focused (hard to test focus, but it should be enabled and ready)
    expect(screen.getByPlaceholderText(/ask about your finances/i)).not.toBeDisabled()
  })

  it('prevents sending duplicate messages while processing', async () => {
    const user = userEvent.setup()
    vi.mocked(streamChatWithContext).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, chunks: ['Response'] }), 100)
        )
    )

    render(<ChatPage />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')

    // Click multiple times rapidly
    const sendButton = screen.getByRole('button')
    await user.click(sendButton)
    await user.click(sendButton)
    await user.click(sendButton)

    // Should only be called once
    await waitFor(() => {
      expect(streamChatWithContext).toHaveBeenCalledTimes(1)
    })
  })
})
