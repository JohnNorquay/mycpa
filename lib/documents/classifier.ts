import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Supported document types
export const DOCUMENT_TYPES = [
  'W2',
  '1099-MISC',
  '1099-NEC',
  '1099-INT',
  '1099-DIV',
  'IRS Notice',
  'Other',
] as const

export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export interface ClassificationResult {
  documentType: DocumentType
  confidence: number
  reasoning?: string
}

/**
 * Classify a document based on extracted text
 * Uses Claude to identify the document type
 */
export async function classifyDocument(extractedText: string): Promise<ClassificationResult> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `Analyze this tax document and classify it into one of these types:
- W2: Wage and Tax Statement
- 1099-MISC: Miscellaneous Income
- 1099-NEC: Nonemployee Compensation
- 1099-INT: Interest Income
- 1099-DIV: Dividends and Distributions
- IRS Notice: Official IRS correspondence
- Other: Any other tax-related document

Document text:
${extractedText.substring(0, 2000)} ${extractedText.length > 2000 ? '...(truncated)' : ''}

Respond with ONLY valid JSON in this exact format:
{
  "documentType": "one of the types above",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of why you classified it this way"
}`,
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

    const result = JSON.parse(jsonText) as ClassificationResult

    // Validate result
    if (!DOCUMENT_TYPES.includes(result.documentType)) {
      console.warn(
        `Invalid document type from classifier: ${result.documentType}, defaulting to Other`
      )
      return {
        documentType: 'Other',
        confidence: 0.5,
        reasoning: 'Could not confidently classify document',
      }
    }

    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      console.warn('Invalid confidence score, defaulting to 0.5')
      result.confidence = 0.5
    }

    return result
  } catch (error) {
    console.error('Error classifying document:', error)
    // Return default classification on error
    return {
      documentType: 'Other',
      confidence: 0.0,
      reasoning: 'Classification failed due to error',
    }
  }
}

/**
 * Determine if a document is likely a specific type based on keywords
 * This is a fast, heuristic-based classifier for quick checks
 */
export function quickClassify(text: string): DocumentType {
  const lowerText = text.toLowerCase()

  // Check for W2
  if (
    lowerText.includes('form w-2') ||
    (lowerText.includes('wage and tax statement') && lowerText.includes('social security wages'))
  ) {
    return 'W2'
  }

  // Check for 1099-NEC
  if (lowerText.includes('1099-nec') || lowerText.includes('nonemployee compensation')) {
    return '1099-NEC'
  }

  // Check for 1099-MISC
  if (lowerText.includes('1099-misc') || lowerText.includes('miscellaneous income')) {
    return '1099-MISC'
  }

  // Check for 1099-INT
  if (lowerText.includes('1099-int') || lowerText.includes('interest income')) {
    return '1099-INT'
  }

  // Check for 1099-DIV
  if (
    lowerText.includes('1099-div') ||
    (lowerText.includes('dividends') && lowerText.includes('distributions'))
  ) {
    return '1099-DIV'
  }

  // Check for IRS Notice
  if (
    lowerText.includes('internal revenue service') &&
    (lowerText.includes('notice') ||
      lowerText.includes('cp') ||
      lowerText.includes('letter') ||
      lowerText.includes('department of the treasury'))
  ) {
    return 'IRS Notice'
  }

  return 'Other'
}

/**
 * Validate if classification confidence is acceptable
 * Returns true if we should trust the classification
 */
export function isConfidentClassification(result: ClassificationResult): boolean {
  return result.confidence >= 0.7
}

/**
 * Get human-readable document type name
 */
export function getDocumentTypeName(type: DocumentType): string {
  const names: Record<DocumentType, string> = {
    W2: 'W-2 Wage and Tax Statement',
    '1099-MISC': '1099-MISC Miscellaneous Income',
    '1099-NEC': '1099-NEC Nonemployee Compensation',
    '1099-INT': '1099-INT Interest Income',
    '1099-DIV': '1099-DIV Dividends and Distributions',
    'IRS Notice': 'IRS Notice or Letter',
    Other: 'Other Tax Document',
  }

  return names[type]
}
