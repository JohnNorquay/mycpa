import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { categorizationFunctions } from '@/inngest/functions/categorize-transactions'

// Create an API route to serve Inngest functions
// This endpoint is used by Inngest to trigger and monitor functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [...categorizationFunctions],
})
