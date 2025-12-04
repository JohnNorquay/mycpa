import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface StreamChatOptions {
  messages: ChatMessage[]
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}

const DEFAULT_SYSTEM_PROMPT = `You are a knowledgeable financial advisor and tax professional helping a client understand their financial situation and tax obligations.

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
- Always emphasize that this is general guidance, not personalized professional advice`

/**
 * Stream a chat response using Claude Sonnet
 * Returns an async generator that yields text chunks
 */
export async function* streamChat(
  options: StreamChatOptions
): AsyncGenerator<string, void, unknown> {
  const {
    messages,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    maxTokens = 2048,
    temperature = 1,
  } = options

  try {
    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta' &&
        chunk.delta.text
      ) {
        yield chunk.delta.text
      }
    }
  } catch (error) {
    console.error('Error streaming chat:', error)
    throw error
  }
}

/**
 * Get a complete chat response (non-streaming)
 * Useful for internal operations where streaming isn't needed
 */
export async function getChatResponse(options: StreamChatOptions): Promise<string> {
  const {
    messages,
    systemPrompt = DEFAULT_SYSTEM_PROMPT,
    maxTokens = 2048,
    temperature = 1,
  } = options

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    return content.text
  } catch (error) {
    console.error('Error getting chat response:', error)
    throw error
  }
}

/**
 * Generate contextual question suggestions based on user's financial data
 */
export async function generateSuggestedQuestions(context: string): Promise<string[]> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 1,
      messages: [
        {
          role: 'user',
          content: `Based on this user's financial data, suggest 4 relevant questions they might want to ask their financial advisor. Return ONLY a JSON array of strings, no other text.

Context:
${context}

Return format: ["Question 1", "Question 2", "Question 3", "Question 4"]`,
        },
      ],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse JSON response
    let jsonText = content.text.trim()
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    const questions = JSON.parse(jsonText) as string[]

    // Validate response
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid response format from Claude')
    }

    return questions.slice(0, 4) // Ensure max 4 questions
  } catch (error) {
    console.error('Error generating suggested questions:', error)
    // Return default questions on error
    return [
      'How can I reduce my tax liability this year?',
      'What are my biggest spending categories?',
      'How can I improve my cash flow?',
      'What should I know about my tax debt?',
    ]
  }
}
