import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUserWithPermissions } from '@/lib/auth/api-permissions'
import { isElevated } from '@/lib/auth/roles'
import { callAI } from '@/lib/ai/client'

// POST /api/clients/[id]/gbp/draft-post
// Body: { topic?: string; postType?: 'update' | 'offer' | 'event' }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserWithPermissions()
  if (!user || !isElevated(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clientId = parseInt(params.id)
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const body     = await req.json().catch(() => ({}))
  const topic    = ((body.topic as string | undefined) ?? '').trim()
  const postType = (body.postType as string | undefined) ?? 'update'

  // Load client + lead location + voice profile
  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    select: {
      businessName:  true,
      voiceProfileId: true,
      voiceProfile: {
        select: {
          tonality:          true,
          vocabulary:        true,
          sentenceStructure: true,
          formality:         true,
          enthusiasm:        true,
          technicality:      true,
          brevity:           true,
        },
      },
      lead: {
        select: { city: true, state: true },
      },
    },
  })

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const vp           = client.voiceProfile
  const city         = client.lead?.city  ?? ''
  const state        = client.lead?.state ?? ''
  const locationLine = [city, state].filter(Boolean).join(', ')

  const voiceSection = vp
    ? `BRAND VOICE:
- Tone: ${vp.tonality ?? 'professional'}
- Vocabulary: ${vp.vocabulary ?? 'clear and accessible'}
- Sentence structure: ${vp.sentenceStructure ?? 'varied'}
- Formality (1-10): ${vp.formality ?? 6}
- Enthusiasm (1-10): ${vp.enthusiasm ?? 6}
- Technicality (1-10): ${vp.technicality ?? 4}
- Brevity (1-10): ${vp.brevity ?? 6}
Write in this voice exactly.`
    : 'Write in a professional, friendly tone appropriate for a local business.'

  const typeInstructions: Record<string, string> = {
    update: 'Write a STANDARD update post (150-300 chars). Share something timely — a service highlight, seasonal tip, team achievement, or community note.',
    offer:  'Write an OFFER post (150-300 chars). Clear value proposition. No fake urgency. Real benefit, real CTA.',
    event:  'Write an EVENT post (150-300 chars). What\'s happening, why it matters, natural invitation.',
  }

  const prompt = `You are writing a Google Business Profile post for ${client.businessName}.${locationLine ? `\nLocation: ${locationLine}` : ''}

${voiceSection}

POST TYPE: ${postType.toUpperCase()}
${typeInstructions[postType] ?? typeInstructions.update}
${topic ? `\nTopic/focus: ${topic}` : ''}

RULES:
- 150-300 characters (hard limit)
- No hashtags
- No emojis unless enthusiasm score is 8+
- No generic openers ("We are excited to announce...")
- End with a natural, non-pushy CTA if appropriate
- Output ONLY the post text — no preamble, no quotes`

  const result = await callAI({
    feature: 'gbp_post',
    prompt,
    context: {
      feature:    'gbp_post',
      clientId,
      clientName: client.businessName,
    },
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: {
      draft:        result.content.trim(),
      modelUsed:    result.modelUsed,
      costUSD:      result.costUSD,
      wasEscalated: result.wasEscalated,
    },
  })
}
