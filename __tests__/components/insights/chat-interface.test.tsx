import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInterface } from '@/components/features/insights/chat-interface'

// Mock scrollIntoView since jsdom doesn't support it
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

// Helper to create async iterable from array
async function* asyncIterableFromArray(arr: string[]): AsyncIterable<string> {
  for (const item of arr) {
    yield item
  }
}

describe('ChatInterface', () => {
  const mockOnSendMessage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSendMessage.mockResolvedValue(
      asyncIterableFromArray(['Hello! I am your financial assistant.'])
    )
  })

  it('renders initial empty state', () => {
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    expect(screen.getByText('Financial Assistant')).toBeInTheDocument()
    expect(screen.getByText(/ask questions about your finances/i)).toBeInTheDocument()
  })

  it('shows disclaimer about AI advice', () => {
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    expect(screen.getByText(/not a substitute for professional tax/i)).toBeInTheDocument()
  })

  it('renders input area with placeholder', () => {
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    expect(screen.getByPlaceholderText(/ask about your finances/i)).toBeInTheDocument()
  })

  it('renders send button', () => {
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('disables send button when input is empty', () => {
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('enables send button when input has text', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')

    expect(screen.getByRole('button')).not.toBeDisabled()
  })
})

describe('ChatInterface - Suggested Questions', () => {
  const mockOnSendMessage = vi.fn()

  const suggestedQuestions = [
    { id: '1', text: 'What is my tax liability?', category: 'tax' },
    { id: '2', text: 'How can I reduce spending?', category: 'spending' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSendMessage.mockResolvedValue(asyncIterableFromArray(['Response']))
  })

  it('shows suggested questions', () => {
    render(
      <ChatInterface onSendMessage={mockOnSendMessage} suggestedQuestions={suggestedQuestions} />
    )

    expect(screen.getByText('Try asking:')).toBeInTheDocument()
    expect(screen.getByText('What is my tax liability?')).toBeInTheDocument()
    expect(screen.getByText('How can I reduce spending?')).toBeInTheDocument()
  })

  it('sends message when suggestion clicked', async () => {
    const user = userEvent.setup()
    render(
      <ChatInterface onSendMessage={mockOnSendMessage} suggestedQuestions={suggestedQuestions} />
    )

    await user.click(screen.getByText('What is my tax liability?'))

    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('What is my tax liability?', [])
    })
  })

  it('clears suggestions after first message', async () => {
    const user = userEvent.setup()
    render(
      <ChatInterface onSendMessage={mockOnSendMessage} suggestedQuestions={suggestedQuestions} />
    )

    await user.click(screen.getByText('What is my tax liability?'))

    await waitFor(() => {
      expect(screen.queryByText('Try asking:')).not.toBeInTheDocument()
    })
  })

  it('loads suggestions from callback on mount', async () => {
    const mockLoadSuggestions = vi.fn().mockResolvedValue(suggestedQuestions)

    render(
      <ChatInterface onSendMessage={mockOnSendMessage} onLoadSuggestions={mockLoadSuggestions} />
    )

    await waitFor(() => {
      expect(mockLoadSuggestions).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText('What is my tax liability?')).toBeInTheDocument()
    })
  })
})

describe('ChatInterface - Sending Messages', () => {
  const mockOnSendMessage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSendMessage.mockResolvedValue(
      asyncIterableFromArray(['This is ', 'a ', 'streaming ', 'response.'])
    )
  })

  it('sends message on button click', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    const input = screen.getByPlaceholderText(/ask about your finances/i)
    await user.type(input, 'What is my balance?')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('What is my balance?', [])
    })
  })

  it('sends message on Enter key', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    const input = screen.getByPlaceholderText(/ask about your finances/i)
    await user.type(input, 'What is my balance?{Enter}')

    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('What is my balance?', [])
    })
  })

  it('does not send on Shift+Enter', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    const input = screen.getByPlaceholderText(/ask about your finances/i)
    await user.type(input, 'What is my balance?{Shift>}{Enter}{/Shift}')

    expect(mockOnSendMessage).not.toHaveBeenCalled()
  })

  it('clears input after sending', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    const input = screen.getByPlaceholderText(/ask about your finances/i) as HTMLInputElement
    await user.type(input, 'What is my balance?')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('shows user message in chat', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'What is my balance?')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('What is my balance?')).toBeInTheDocument()
    })
  })

  it('shows assistant response', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('This is a streaming response.')).toBeInTheDocument()
    })
  })
})

describe('ChatInterface - Loading State', () => {
  const mockOnSendMessage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Never resolve to keep loading state
    mockOnSendMessage.mockImplementation(() => new Promise(() => {}))
  })

  it('shows loading state while waiting for response', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      // Should show loading spinner in button or message area
      expect(document.querySelector('[class*="animate-spin"]')).toBeInTheDocument()
    })
  })

  it('disables input while loading', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ask about your finances/i)).toBeDisabled()
    })
  })

  it('disables send button while loading', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })
})

describe('ChatInterface - Streaming', () => {
  const mockOnSendMessage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows streaming content as it arrives', async () => {
    // Create a slow stream
    async function* slowStream(): AsyncIterable<string> {
      yield 'Part 1'
      await new Promise((r) => setTimeout(r, 50))
      yield ' Part 2'
      await new Promise((r) => setTimeout(r, 50))
      yield ' Part 3'
    }

    mockOnSendMessage.mockResolvedValue(slowStream())

    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(screen.getByRole('button'))

    // Should eventually show full content
    await waitFor(() => {
      expect(screen.getByText('Part 1 Part 2 Part 3')).toBeInTheDocument()
    })
  })

  it('shows blinking cursor during streaming', async () => {
    async function* slowStream(): AsyncIterable<string> {
      yield 'Part 1'
      await new Promise((r) => setTimeout(r, 500))
      yield ' Part 2'
    }

    mockOnSendMessage.mockResolvedValue(slowStream())

    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(screen.getByRole('button'))

    // Should show animated cursor during streaming
    await waitFor(() => {
      expect(document.querySelector('[class*="animate-pulse"]')).toBeInTheDocument()
    })
  })
})

describe('ChatInterface - Error Handling', () => {
  const mockOnSendMessage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows error message when request fails', async () => {
    mockOnSendMessage.mockRejectedValue(new Error('Network error'))

    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText(/failed to get response/i)).toBeInTheDocument()
    })
  })

  it('re-enables input after error', async () => {
    mockOnSendMessage.mockRejectedValue(new Error('Network error'))

    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ask about your finances/i)).not.toBeDisabled()
    })
  })
})

describe('ChatInterface - Message History', () => {
  const mockOnSendMessage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSendMessage.mockResolvedValue(asyncIterableFromArray(['Response']))
  })

  it('passes message history to onSendMessage', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    // Send first message
    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'First question')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('First question')).toBeInTheDocument()
    })

    // Send second message
    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Second question')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      // Second call should include first exchange in history
      expect(mockOnSendMessage).toHaveBeenLastCalledWith(
        'Second question',
        expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'First question' }),
          expect.objectContaining({ role: 'assistant', content: 'Response' }),
        ])
      )
    })
  })

  it('shows message timestamps', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      // Should show time like "10:30 AM" or "10:30 PM"
      // Use getAllByText since we may have multiple timestamps (user + assistant)
      const timestampElements = screen.getAllByText(/\d{1,2}:\d{2}\s*(AM|PM)?/i)
      expect(timestampElements.length).toBeGreaterThan(0)
    })
  })
})

describe('ChatInterface - UI Elements', () => {
  const mockOnSendMessage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSendMessage.mockResolvedValue(asyncIterableFromArray(['Response']))
  })

  it('shows user icon for user messages', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
      // User message should have user icon (in a blue circle)
      expect(document.querySelector('[class*="bg-blue-600"]')).toBeInTheDocument()
    })
  })

  it('shows bot icon for assistant messages', async () => {
    const user = userEvent.setup()
    render(<ChatInterface onSendMessage={mockOnSendMessage} />)

    await user.type(screen.getByPlaceholderText(/ask about your finances/i), 'Hello')
    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Response')).toBeInTheDocument()
      // Bot icon is in a gray circle
      expect(document.querySelector('[class*="bg-gray-200"]')).toBeInTheDocument()
    })
  })
})
