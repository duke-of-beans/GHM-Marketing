// lib/wave/accounts.ts
// Bank account balance queries and transaction feed

import { waveQuery } from './client'
import { WAVE_BUSINESS_ID } from './constants'
import type { WaveAccount, WaveTransaction } from './types'

/**
 * Fetch all asset-type accounts from Wave (checking, savings, etc.)
 * These hold the actual bank balances.
 */
export async function getBankAccounts(): Promise<WaveAccount[]> {
  const query = `
    query GetBankAccounts($businessId: ID!) {
      business(id: $businessId) {
        accounts(types: [ASSET]) {
          edges {
            node {
              id
              name
              balance
              currency { code symbol }
              type { name }
              subtype { name value }
            }
          }
        }
      }
    }
  `
  const data = await waveQuery<{
    business: {
      accounts: {
        edges: Array<{
          node: {
            id: string
            name: string
            balance: number
            currency: { code: string; symbol: string }
            type: { name: string }
            subtype: { name: string; value: string }
          }
        }>
      }
    }
  }>(query, { businessId: WAVE_BUSINESS_ID })

  const accounts = data.business.accounts.edges.map(e => e.node)

  // Filter to bank-related subtypes only (CHECKING, SAVINGS, CASH)
  const bankSubtypes = ['CHECKING', 'SAVINGS', 'CASH_AND_BANK']
  return accounts.filter(a =>
    bankSubtypes.includes(a.subtype.value.toUpperCase())
  )
}

/**
 * Fetch recent transactions from Wave (last N entries across all accounts)
 */
export async function getRecentTransactions(pageSize = 10): Promise<WaveTransaction[]> {
  const query = `
    query GetRecentTransactions($businessId: ID!, $page: Int!, $pageSize: Int!) {
      business(id: $businessId) {
        transactions(page: $page, pageSize: $pageSize, sort: [{ column: date, direction: DESC }]) {
          edges {
            node {
              id
              description
              date
              amount
              account { id name }
            }
          }
        }
      }
    }
  `
  try {
    const data = await waveQuery<{
      business: {
        transactions: {
          edges: Array<{
            node: {
              id: string
              description: string | null
              date: string
              amount: number
              account: { id: string; name: string } | null
            }
          }>
        }
      }
    }>(query, { businessId: WAVE_BUSINESS_ID, page: 1, pageSize })

    return data.business.transactions.edges.map(e => e.node)
  } catch {
    // Transactions endpoint may require additional Wave permissions — return empty gracefully
    return []
  }
}
