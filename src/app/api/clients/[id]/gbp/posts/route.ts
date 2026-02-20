import { NextRequest, NextResponse } from 'next/server'
import { getGBPClient } from '@/lib/enrichment/providers/google-business/client'
import { createPost } from '@/lib/enrichment/providers/google-business/posts'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const clientId = parseInt(params.id)
  const body = await req.json()

  const gbp = await getGBPClient(clientId)
  if (!gbp) return NextResponse.json({ error: 'GBP not connected' }, { status: 404 })

  const post = await createPost(gbp, {
    summary:    body.summary,
    topicType:  body.topicType ?? 'STANDARD',
    actionType: body.actionType,
    actionUrl:  body.actionUrl,
  })

  if (!post) return NextResponse.json({ error: 'Post creation failed' }, { status: 500 })
  return NextResponse.json(post)
}
