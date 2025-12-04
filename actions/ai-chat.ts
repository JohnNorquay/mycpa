'use server'

/**
 * AI Chat Server Actions
 *
 * Provides server-side AI chat functionality including:
 * - Streaming chat responses with financial context
 * - Suggested question generation
 */

import type { ActionResult } from '@/types'
import { streamChat, generateSuggestedQuestions, type ChatMessage } from '@/lib/ai/chat'
import { buildFinancialContext, buildContextSummary } from '@/lib/ai/context-builder'
import { createClient } from '@/lib/supabase/server'

export interface ChatStreamOptions {
  messages: ChatMessage[]
  includeContext?: boolean
}

/**
 * Stream chat response with financial context
 * This returns a ReadableStream for use in Next.js streaming responses
 */
export async function streamChatResponse(
  options: ChatStreamOptions
): Promise<ActionResult<ReadableStream<Uint8Array>>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    const { messages, includeContext = true } = options

    // Build financial context if requested
    const contextualizedMessages = [...messages]
    if (includeContext) {
      const context = await buildFinancialContext(user.id)

      // Inject context into the first user message
      const firstMessage = contextualizedMessages[0]
      if (firstMessage && firstMessage.role === 'user') {
        contextualizedMessages[0] = {
          role: 'user',
          content: `Context about my finances:\n\n${context}\n\nMy question: ${firstMessage.content}`,
        }
      }
    }

    // Create a ReadableStream from the async generator
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChat({ messages: contextualizedMessages })) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return {
      success: true,
      data: stream,
    }
  } catch (error) {
    console.error('Error streaming chat response:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stream chat response',
    }
  }
}

/**
 * Get suggested questions based on user's financial context
 */
export async function getSuggestedQuestions(): Promise<ActionResult<string[]>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }

    // Build context summary
    const contextSummary = await buildContextSummary(user.id)

    // Generate questions
    const questions = await generateSuggestedQuestions(contextSummary)

    return {
      success: true,
      data: questions,
    }
  } catch (error) {
    console.error('Error getting suggested questions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get suggested questions',
    }
  }
}
