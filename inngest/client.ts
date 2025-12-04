import { Inngest } from 'inngest'

// Create an Inngest client
export const inngest = new Inngest({
  id: 'mycpa',
  name: 'MyCPA Bot',
})

// Event types for type safety
export type InngestEvents = {
  'transactions/sync.completed': {
    data: {
      userId: string
      accountId: string
      newTransactionCount: number
    }
  }
  'transactions/categorize.batch': {
    data: {
      userId: string
      transactionIds?: string[]
    }
  }
  'transactions/category.corrected': {
    data: {
      userId: string
      transactionId: string
      merchantName: string
      category: string
      isTaxDeductible: boolean
    }
  }
}
