// lib/wave/client.ts
// Core GraphQL client for Wave API — auth, retry, error handling

import { WAVE_API_URL, WAVE_API_TOKEN } from './constants'
import type { WaveMutationResult } from './types'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function waveQuery<T>(
  query: string,
  variables?: Record<string, unknown>,
  apiKey?: string  // optional: per-tenant override; falls back to WAVE_API_TOKEN env var
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(WAVE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey ?? WAVE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      })

      if (res.status === 429) {
        // Rate limited — back off exponentially
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt))
        continue
      }

      if (!res.ok) {
        throw new Error(`Wave API HTTP ${res.status}: ${await res.text()}`)
      }

      const json = await res.json()

      if (json.errors && json.errors.length > 0) {
        throw new Error(`Wave GraphQL error: ${JSON.stringify(json.errors)}`)
      }

      return json.data as T
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY_MS * Math.pow(2, attempt))
      }
    }
  }

  throw lastError ?? new Error('Wave API request failed after retries')
}

export async function waveMutation<T>(
  mutation: string,
  variables: Record<string, unknown>,
  apiKey?: string  // optional: per-tenant override; passed through to waveQuery
): Promise<WaveMutationResult<T>> {
  const data = await waveQuery<{ [key: string]: WaveMutationResult<T> }>(mutation, variables, apiKey)
  // Mutations return a single top-level key — extract it
  const key = Object.keys(data)[0]
  return data[key]
}
