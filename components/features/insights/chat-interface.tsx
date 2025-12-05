'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Sparkles, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SuggestedQuestion {
  id: string
  text: string
  category: string
}

interface ChatInterfaceProps {
  onSendMessage: (message: string, history: Message[]) => Promise<AsyncIterable<string>>
  suggestedQuestions?: SuggestedQuestion[]
  onLoadSuggestions?: () => Promise<SuggestedQuestion[]>
  className?: string
}

export function ChatInterface({
  onSendMessage,
  suggestedQuestions: initialSuggestions = [],
  onLoadSuggestions,
  className,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [suggestedQuestions, setSuggestedQuestions] =
    useState<SuggestedQuestion[]>(initialSuggestions)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  // Load suggestions on mount
  useEffect(() => {
    if (onLoadSuggestions && suggestedQuestions.length === 0) {
      onLoadSuggestions().then(setSuggestedQuestions).catch(console.error)
    }
  }, [onLoadSuggestions, suggestedQuestions.length])

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return

      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: messageText.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setInput('')
      setIsLoading(true)
      setStreamingContent('')
      setError(null)

      try {
        const stream = await onSendMessage(messageText, messages)
        let fullContent = ''

        for await (const chunk of stream) {
          fullContent += chunk
          setStreamingContent(fullContent)
        }

        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: fullContent,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        setStreamingContent('')

        // Clear suggestions after first message
        setSuggestedQuestions([])
      } catch (err) {
        console.error('Chat error:', err)
        setError('Failed to get response. Please try again.')
      } finally {
        setIsLoading(false)
        inputRef.current?.focus()
      }
    },
    [isLoading, messages, onSendMessage]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage(input)
      }
    },
    [handleSendMessage, input]
  )

  const handleSuggestionClick = useCallback(
    (question: SuggestedQuestion) => {
      handleSendMessage(question.text)
    },
    [handleSendMessage]
  )

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !streamingContent ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="mb-2 text-xl font-semibold dark:text-white">Financial Assistant</h2>
            <p className="mb-6 max-w-md text-center text-gray-500 dark:text-gray-400">
              Ask questions about your finances, tax situation, or get personalized advice based on
              your data.
            </p>

            {/* Suggested Questions */}
            {suggestedQuestions.length > 0 && (
              <div className="w-full max-w-lg space-y-2">
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">Try asking:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleSuggestionClick(q)}
                      className="rounded-full border bg-white px-4 py-2 text-sm transition-colors hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
                    >
                      {q.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-8 flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-sm dark:bg-amber-900/20">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
              <p className="text-amber-800 dark:text-amber-200">
                This AI assistant provides general financial guidance based on your data. It is not
                a substitute for professional tax, legal, or financial advice.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                    message.role === 'user' ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-3',
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 dark:text-white'
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={cn(
                      'mt-1 text-xs',
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {/* Streaming Message */}
            {streamingContent && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
                  <Bot className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="max-w-[80%] rounded-lg bg-gray-100 px-4 py-3 dark:bg-gray-800">
                  <p className="whitespace-pre-wrap dark:text-white">{streamingContent}</p>
                  <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-gray-400" />
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && !streamingContent && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
                  <Bot className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="rounded-lg bg-gray-100 px-4 py-3 dark:bg-gray-800">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4 dark:border-gray-800">
        <div className="mx-auto flex max-w-3xl gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your finances..."
              rows={1}
              className="w-full resize-none rounded-lg border bg-white px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="h-auto px-4"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
