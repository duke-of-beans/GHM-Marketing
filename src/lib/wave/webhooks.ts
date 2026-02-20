// lib/wave/webhooks.ts
// Webhook signature verification and event routing

import { WAVE_WEBHOOK_SECRET } from './constants'

export type WaveWebhookEvent =
  | 'invoice.payment.created'
  | 'invoice.viewed'
  | 'invoice.sent'
  | 'bill.payment.created'
  | string

export interface WaveWebhookPayload {
  event: WaveWebhookEvent
  data: Record<string, unknown>
  timestamp: string
}

/**
 * Verify that an incoming webhook is from Wave.
 * Wave sends an HMAC-SHA256 signature in the X-WaveApps-Signature header.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null
): Promise<boolean> {
  if (!WAVE_WEBHOOK_SECRET || !signature) return false

  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(WAVE_WEBHOOK_SECRET)
    const messageData = encoder.encode(rawBody)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
    const expectedSig = Buffer.from(signatureBuffer).toString('hex')

    // Timing-safe comparison
    return expectedSig === signature
  } catch {
    return false
  }
}

export function parseWebhookPayload(body: string): WaveWebhookPayload | null {
  try {
    return JSON.parse(body) as WaveWebhookPayload
  } catch {
    return null
  }
}
