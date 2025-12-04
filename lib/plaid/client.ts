import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

// Validate required environment variables
const clientId = process.env.PLAID_CLIENT_ID
const secret = process.env.PLAID_SECRET
const env = process.env.PLAID_ENV || 'sandbox'

if (!clientId || !secret) {
  throw new Error('Missing required Plaid environment variables: PLAID_CLIENT_ID and PLAID_SECRET')
}

// Map environment string to Plaid environment
const plaidEnv =
  env === 'production'
    ? PlaidEnvironments.production
    : env === 'development'
      ? PlaidEnvironments.development
      : PlaidEnvironments.sandbox

// Create Plaid client configuration
const configuration = new Configuration({
  basePath: plaidEnv,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': clientId,
      'PLAID-SECRET': secret,
    },
  },
})

// Export configured Plaid client
export const plaidClient = new PlaidApi(configuration)
