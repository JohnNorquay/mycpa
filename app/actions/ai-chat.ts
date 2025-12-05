'use server'

import { createClient } from '@/lib/supabase/server'
import { streamChat, generateSuggestedQuestions, type ChatMessage } from '@/lib/ai/chat'
import { buildFinancialContext, buildContextSummary } from '@/lib/ai/context-builder'

export interface StreamChatInput {
  message: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface SuggestedQuestion {
  id: string
  text: string
  category: string
}

/**
 * Stream a chat response with financial context
 * Returns chunks that can be consumed by the client
 */
export async function streamChatWithContext(
  input: StreamChatInput
): Promise<{ success: true; chunks: string[] } | { success: false; error: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Build financial context
    const context = await buildFinancialContext(user.id)

    // Create system prompt with context
    const systemPrompt = `You are a knowledgeable financial advisor and tax professional helping a client understand their financial situation and tax obligations.

Your role is to:
- Provide clear, actionable financial advice based on the user's data
- Explain tax concepts in simple terms
- Identify opportunities to save money and reduce tax liability
- Alert users to potential issues or risks
- Suggest practical next steps

Guidelines:
- Base your advice on the financial data provided in the context
- Be encouraging but realistic about their financial situation
- When discussing tax strategies, mention both the benefits and any limitations
- Always recommend consulting with a licensed professional for major financial decisions
- Use specific numbers from their data when relevant
- Keep responses concise and well-organized

Important:
- Do NOT provide legal advice
- Do NOT guarantee specific tax outcomes
- Do NOT recommend aggressive tax avoidance schemes
- Always emphasize that this is general guidance, not personalized professional advice

USER'S FINANCIAL DATA:
${context}`

    // Build message history with context in first message
    const messages: ChatMessage[] = input.history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Add the new user message
    messages.push({
      role: 'user',
      content: input.message,
    })

    // Collect all chunks (server actions can't return async iterators directly)
    const chunks: string[] = []
    for await (const chunk of streamChat({
      messages,
      systemPrompt,
    })) {
      chunks.push(chunk)
    }

    return { success: true, chunks }
  } catch (error) {
    console.error('Error in streamChatWithContext:', error)
    return { success: false, error: 'Failed to get response' }
  }
}

/**
 * Get suggested questions based on user's financial data
 */
export async function getSuggestedQuestions(): Promise<SuggestedQuestion[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return getDefaultSuggestions()
    }

    // Build minimal context for suggestions
    const contextSummary = await buildContextSummary(user.id)

    // Generate questions based on context
    const questions = await generateSuggestedQuestions(contextSummary)

    // Format with IDs and categories
    return questions.map((text, index) => ({
      id: `suggestion-${index}`,
      text,
      category: categorizeQuestion(text),
    }))
  } catch (error) {
    console.error('Error getting suggested questions:', error)
    return getDefaultSuggestions()
  }
}

/**
 * Categorize a question based on its content
 */
function categorizeQuestion(question: string): string {
  const lowerQuestion = question.toLowerCase()

  if (lowerQuestion.includes('tax') || lowerQuestion.includes('deduct')) {
    return 'tax'
  }
  if (
    lowerQuestion.includes('spend') ||
    lowerQuestion.includes('budget') ||
    lowerQuestion.includes('expense')
  ) {
    return 'spending'
  }
  if (
    lowerQuestion.includes('save') ||
    lowerQuestion.includes('invest') ||
    lowerQuestion.includes('retire')
  ) {
    return 'savings'
  }
  if (
    lowerQuestion.includes('debt') ||
    lowerQuestion.includes('owe') ||
    lowerQuestion.includes('pay')
  ) {
    return 'debt'
  }
  if (lowerQuestion.includes('income') || lowerQuestion.includes('earn')) {
    return 'income'
  }

  return 'general'
}

/**
 * Get default suggestions when AI generation fails
 */
function getDefaultSuggestions(): SuggestedQuestion[] {
  return [
    {
      id: 'default-1',
      text: 'How can I reduce my tax liability this year?',
      category: 'tax',
    },
    {
      id: 'default-2',
      text: 'What are my biggest spending categories?',
      category: 'spending',
    },
    {
      id: 'default-3',
      text: 'How can I improve my cash flow?',
      category: 'savings',
    },
    {
      id: 'default-4',
      text: 'What should I know about my tax debt?',
      category: 'debt',
    },
  ]
}
