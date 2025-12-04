import Anthropic from '@anthropic-ai/sdk'
import type { DocumentType } from './classifier'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Common extracted data structure
export interface ExtractedData {
  documentType: DocumentType
  taxYear?: number
  confidence: number
  fields: Record<string, unknown>
}

// W2 specific fields
export interface W2Data {
  employer_name?: string
  employer_ein?: string
  employee_name?: string
  employee_ssn?: string
  wages?: number // Box 1
  federal_tax_withheld?: number // Box 2
  social_security_wages?: number // Box 3
  social_security_tax_withheld?: number // Box 4
  medicare_wages?: number // Box 5
  medicare_tax_withheld?: number // Box 6
  social_security_tips?: number // Box 7
  allocated_tips?: number // Box 8
  dependent_care_benefits?: number // Box 10
  nonqualified_plans?: number // Box 11
  state?: string
  state_wages?: number
  state_tax_withheld?: number
  local_wages?: number
  local_tax_withheld?: number
  confidence: number
}

// 1099-MISC fields
export interface Form1099MiscData {
  payer_name?: string
  payer_tin?: string
  recipient_name?: string
  recipient_tin?: string
  rents?: number // Box 1
  royalties?: number // Box 2
  other_income?: number // Box 3
  federal_tax_withheld?: number // Box 4
  fishing_boat_proceeds?: number // Box 5
  medical_health_payments?: number // Box 6
  nonemployee_compensation?: number // Box 7 (pre-2020)
  substitute_payments?: number // Box 8
  crop_insurance_proceeds?: number // Box 9
  gross_proceeds_attorney?: number // Box 10
  state_tax_withheld?: number
  confidence: number
}

// 1099-NEC fields
export interface Form1099NecData {
  payer_name?: string
  payer_tin?: string
  recipient_name?: string
  recipient_tin?: string
  nonemployee_compensation?: number // Box 1
  federal_tax_withheld?: number // Box 4
  state_tax_withheld?: number
  state?: string
  confidence: number
}

// 1099-INT fields
export interface Form1099IntData {
  payer_name?: string
  payer_tin?: string
  recipient_name?: string
  recipient_tin?: string
  interest_income?: number // Box 1
  early_withdrawal_penalty?: number // Box 2
  interest_us_bonds?: number // Box 3
  federal_tax_withheld?: number // Box 4
  investment_expenses?: number // Box 5
  foreign_tax_paid?: number // Box 6
  state_tax_withheld?: number
  confidence: number
}

// 1099-DIV fields
export interface Form1099DivData {
  payer_name?: string
  payer_tin?: string
  recipient_name?: string
  recipient_tin?: string
  total_ordinary_dividends?: number // Box 1a
  qualified_dividends?: number // Box 1b
  total_capital_gain?: number // Box 2a
  unrecaptured_section_1250?: number // Box 2b
  section_1202_gain?: number // Box 2c
  collectibles_gain?: number // Box 2d
  nondividend_distributions?: number // Box 3
  federal_tax_withheld?: number // Box 4
  investment_expenses?: number // Box 5
  foreign_tax_paid?: number // Box 6
  state_tax_withheld?: number
  confidence: number
}

// IRS Notice fields
export interface IRSNoticeData {
  notice_number?: string
  notice_date?: string
  tax_year?: number
  notice_type?: string
  amount_due?: number
  response_deadline?: string
  account_number?: string
  taxpayer_name?: string
  confidence: number
}

/**
 * Extract data from W2
 */
export async function extractW2Data(extractedText: string): Promise<W2Data> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Extract all W-2 form data from this text. Be precise with numbers and include all box values.

Text:
${extractedText}

Respond with ONLY valid JSON in this format:
{
  "employer_name": "string",
  "employer_ein": "string",
  "employee_name": "string",
  "employee_ssn": "string (last 4 digits only if masked)",
  "wages": number (Box 1),
  "federal_tax_withheld": number (Box 2),
  "social_security_wages": number (Box 3),
  "social_security_tax_withheld": number (Box 4),
  "medicare_wages": number (Box 5),
  "medicare_tax_withheld": number (Box 6),
  "social_security_tips": number (Box 7),
  "allocated_tips": number (Box 8),
  "dependent_care_benefits": number (Box 10),
  "nonqualified_plans": number (Box 11),
  "state": "string",
  "state_wages": number,
  "state_tax_withheld": number,
  "local_wages": number,
  "local_tax_withheld": number,
  "confidence": 0.0-1.0
}

Use null for missing values. Ensure all numbers are numeric, not strings.`,
        },
      ],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let jsonText = content.text.trim()
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    const data = JSON.parse(jsonText) as W2Data
    return data
  } catch (error) {
    console.error('Error extracting W2 data:', error)
    return { confidence: 0.0 }
  }
}

/**
 * Extract data from 1099-MISC
 */
export async function extract1099MiscData(extractedText: string): Promise<Form1099MiscData> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `Extract all 1099-MISC form data from this text. Be precise with numbers.

Text:
${extractedText}

Respond with ONLY valid JSON in this format:
{
  "payer_name": "string",
  "payer_tin": "string",
  "recipient_name": "string",
  "recipient_tin": "string",
  "rents": number (Box 1),
  "royalties": number (Box 2),
  "other_income": number (Box 3),
  "federal_tax_withheld": number (Box 4),
  "fishing_boat_proceeds": number (Box 5),
  "medical_health_payments": number (Box 6),
  "nonemployee_compensation": number (Box 7),
  "substitute_payments": number (Box 8),
  "crop_insurance_proceeds": number (Box 9),
  "gross_proceeds_attorney": number (Box 10),
  "state_tax_withheld": number,
  "confidence": 0.0-1.0
}

Use null for missing values.`,
        },
      ],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let jsonText = content.text.trim()
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    const data = JSON.parse(jsonText) as Form1099MiscData
    return data
  } catch (error) {
    console.error('Error extracting 1099-MISC data:', error)
    return { confidence: 0.0 }
  }
}

/**
 * Extract data from 1099-NEC
 */
export async function extract1099NecData(extractedText: string): Promise<Form1099NecData> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Extract all 1099-NEC form data from this text.

Text:
${extractedText}

Respond with ONLY valid JSON:
{
  "payer_name": "string",
  "payer_tin": "string",
  "recipient_name": "string",
  "recipient_tin": "string",
  "nonemployee_compensation": number (Box 1),
  "federal_tax_withheld": number (Box 4),
  "state_tax_withheld": number,
  "state": "string",
  "confidence": 0.0-1.0
}`,
        },
      ],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let jsonText = content.text.trim()
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    const data = JSON.parse(jsonText) as Form1099NecData
    return data
  } catch (error) {
    console.error('Error extracting 1099-NEC data:', error)
    return { confidence: 0.0 }
  }
}

/**
 * Extract data from 1099-INT
 */
export async function extract1099IntData(extractedText: string): Promise<Form1099IntData> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Extract all 1099-INT form data from this text.

Text:
${extractedText}

Respond with ONLY valid JSON:
{
  "payer_name": "string",
  "payer_tin": "string",
  "recipient_name": "string",
  "recipient_tin": "string",
  "interest_income": number (Box 1),
  "early_withdrawal_penalty": number (Box 2),
  "interest_us_bonds": number (Box 3),
  "federal_tax_withheld": number (Box 4),
  "investment_expenses": number (Box 5),
  "foreign_tax_paid": number (Box 6),
  "state_tax_withheld": number,
  "confidence": 0.0-1.0
}`,
        },
      ],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let jsonText = content.text.trim()
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    const data = JSON.parse(jsonText) as Form1099IntData
    return data
  } catch (error) {
    console.error('Error extracting 1099-INT data:', error)
    return { confidence: 0.0 }
  }
}

/**
 * Extract data from 1099-DIV
 */
export async function extract1099DivData(extractedText: string): Promise<Form1099DivData> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Extract all 1099-DIV form data from this text.

Text:
${extractedText}

Respond with ONLY valid JSON:
{
  "payer_name": "string",
  "payer_tin": "string",
  "recipient_name": "string",
  "recipient_tin": "string",
  "total_ordinary_dividends": number (Box 1a),
  "qualified_dividends": number (Box 1b),
  "total_capital_gain": number (Box 2a),
  "unrecaptured_section_1250": number (Box 2b),
  "section_1202_gain": number (Box 2c),
  "collectibles_gain": number (Box 2d),
  "nondividend_distributions": number (Box 3),
  "federal_tax_withheld": number (Box 4),
  "investment_expenses": number (Box 5),
  "foreign_tax_paid": number (Box 6),
  "state_tax_withheld": number,
  "confidence": 0.0-1.0
}`,
        },
      ],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let jsonText = content.text.trim()
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    const data = JSON.parse(jsonText) as Form1099DivData
    return data
  } catch (error) {
    console.error('Error extracting 1099-DIV data:', error)
    return { confidence: 0.0 }
  }
}

/**
 * Extract data from IRS Notice
 */
export async function extractIRSNoticeData(extractedText: string): Promise<IRSNoticeData> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `Extract key information from this IRS notice.

Text:
${extractedText}

Respond with ONLY valid JSON:
{
  "notice_number": "string (e.g., CP2000, CP14, etc.)",
  "notice_date": "string (YYYY-MM-DD format)",
  "tax_year": number,
  "notice_type": "string (brief description)",
  "amount_due": number (if applicable),
  "response_deadline": "string (YYYY-MM-DD format, if applicable)",
  "account_number": "string",
  "taxpayer_name": "string",
  "confidence": 0.0-1.0
}`,
        },
      ],
    })

    const content = response.content[0]
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let jsonText = content.text.trim()
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    const data = JSON.parse(jsonText) as IRSNoticeData
    return data
  } catch (error) {
    console.error('Error extracting IRS notice data:', error)
    return { confidence: 0.0 }
  }
}

/**
 * Extract data based on document type
 */
export async function extractDataByType(
  documentType: DocumentType,
  extractedText: string
): Promise<ExtractedData> {
  let fields: Record<string, unknown> = {}
  let confidence = 0.0

  try {
    switch (documentType) {
      case 'W2': {
        const w2Data = await extractW2Data(extractedText)
        confidence = w2Data.confidence || 0.0
        fields = w2Data as unknown as Record<string, unknown>
        break
      }
      case '1099-MISC': {
        const miscData = await extract1099MiscData(extractedText)
        confidence = miscData.confidence || 0.0
        fields = miscData as unknown as Record<string, unknown>
        break
      }
      case '1099-NEC': {
        const necData = await extract1099NecData(extractedText)
        confidence = necData.confidence || 0.0
        fields = necData as unknown as Record<string, unknown>
        break
      }
      case '1099-INT': {
        const intData = await extract1099IntData(extractedText)
        confidence = intData.confidence || 0.0
        fields = intData as unknown as Record<string, unknown>
        break
      }
      case '1099-DIV': {
        const divData = await extract1099DivData(extractedText)
        confidence = divData.confidence || 0.0
        fields = divData as unknown as Record<string, unknown>
        break
      }
      case 'IRS Notice': {
        const noticeData = await extractIRSNoticeData(extractedText)
        confidence = noticeData.confidence || 0.0
        fields = noticeData as unknown as Record<string, unknown>
        break
      }
      default:
        // For 'Other' or unknown types, just store basic info
        fields = { raw_text_preview: extractedText.substring(0, 500) }
        confidence = 0.5
    }
  } catch (error) {
    console.error('Error extracting data by type:', error)
  }

  return {
    documentType,
    confidence,
    fields,
  }
}
