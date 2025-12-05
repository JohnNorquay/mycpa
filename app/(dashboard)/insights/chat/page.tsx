'use client'

import { useCallback } from 'react'
import { MessageSquare, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ChatInterface } from '@/components/features/insights'
import {
  streamChatWithContext,
  getSuggestedQuestions,
  type SuggestedQuestion,
} from '@/app/actions/ai-chat'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const handleSendMessage = useCallback(
    async (message: string, history: Message[]): Promise<AsyncIterable<string>> => {
      // Create async iterable from server action response
      async function* streamResponse(): AsyncGenerator<string, void, unknown> {
        const result = await streamChatWithContext({
          message,
          history: history.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        })

        if (!result.success) {
          yield `Error: ${result.error}`
          return
        }

        // Yield chunks to simulate streaming
        for (const chunk of result.chunks) {
          yield chunk
        }
      }

      return streamResponse()
    },
    []
  )

  const handleLoadSuggestions = useCallback(async (): Promise<SuggestedQuestion[]> => {
    return getSuggestedQuestions()
  }, [])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 dark:border-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-lg font-semibold dark:text-white">Financial Assistant</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto h-full max-w-5xl">
          <ChatInterface
            onSendMessage={handleSendMessage}
            onLoadSuggestions={handleLoadSuggestions}
            className="h-full"
          />
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="border-t px-4 py-2 dark:border-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <AlertTriangle className="h-3 w-3" />
          <span>
            This AI assistant provides general financial guidance. It is not a substitute for
            professional tax, legal, or financial advice.
          </span>
        </div>
      </div>
    </div>
  )
}
