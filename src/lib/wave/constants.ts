// lib/wave/constants.ts
// Wave API configuration and business constants

export const WAVE_API_URL = process.env.WAVE_API_URL ?? 'https://gql.waveapps.com/graphql/public'
export const WAVE_API_TOKEN = process.env.WAVE_API_TOKEN ?? ''
export const WAVE_BUSINESS_ID = process.env.WAVE_BUSINESS_ID ?? ''
export const WAVE_WEBHOOK_SECRET = process.env.WAVE_WEBHOOK_SECRET ?? ''

// Wave invoice status values (as returned by API)
export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  VIEWED: 'VIEWED',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const

// Our internal payment status escalation levels
export const PAYMENT_STATUS = {
  CURRENT: 'current',
  GRACE: 'grace',       // days 1-7
  OVERDUE: 'overdue',   // days 8-14
  PAUSED: 'paused',     // day 15+
  COLLECTIONS: 'collections', // day 30+
  TERMINATED: 'terminated',
} as const
