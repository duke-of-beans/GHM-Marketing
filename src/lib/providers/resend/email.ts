/**
 * src/lib/providers/resend/email.ts
 *
 * Resend implementation of EmailProvider.
 */

import { Resend } from 'resend'
import type { EmailProvider, EmailAttachment } from '../types'

let _client: Resend | null = null

function getClient(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured')
  if (!_client) _client = new Resend(process.env.RESEND_API_KEY)
  return _client
}

export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend'

  async send(params: {
    to: string | string[]
    from: string
    replyTo?: string
    cc?: string | string[]
    subject: string
    html: string
    attachments?: EmailAttachment[]
  }): Promise<{ id?: string; error?: string }> {
    try {
      const { data, error } = await getClient().emails.send({
        to:          params.to,
        from:        params.from,
        replyTo:     params.replyTo,
        cc:          params.cc,
        subject:     params.subject,
        html:        params.html,
        attachments: params.attachments?.map((a) => ({
          filename: a.filename,
          content:  a.content,
        })),
      })
      if (error) return { error: error.message }
      return { id: data?.id }
    } catch (err) {
      return { error: String(err) }
    }
  }
}
