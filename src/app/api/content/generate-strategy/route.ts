import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, mode, input } = body;

    if (!clientId || !mode || !input?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, mode, input' },
        { status: 400 }
      );
    }

    if (mode !== 'topics' && mode !== 'keywords') {
      return NextResponse.json(
        { error: 'mode must be "topics" or "keywords"' },
        { status: 400 }
      );
    }

    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: { businessName: true },
      
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    let prompt = '';

    if (mode === 'topics') {
      prompt = `You are an SEO content strategist. Generate 8 blog topic ideas for ${client.businessName}.

Theme or niche: ${input}

Requirements:
- Each topic should be specific, search-intent driven, and realistic for a local/regional business
- Mix informational, how-to, and comparison topics
- Each title should be compelling and naturally include likely search phrases

Return ONLY a JSON array of objects with no extra text or markdown. Format:
[
  { "title": "Topic title here", "intent": "informational|how-to|comparison|local", "why": "One sentence on why this topic drives traffic" }
]`;
    } else {
      prompt = `You are an SEO keyword research specialist. Generate keyword suggestions for ${client.businessName}.

Topic: ${input}

Requirements:
- Include primary keywords (high volume, competitive) and long-tail keywords (lower volume, easier to rank)
- Estimate relative search volume: high/medium/low
- Flag keywords with strong local or transactional intent

Return ONLY a JSON array of objects with no extra text or markdown. Format:
[
  { "keyword": "keyword phrase", "volume": "high|medium|low", "type": "primary|long-tail", "intent": "informational|transactional|local|navigational" }
]`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '[]';

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let results: unknown[];
    try {
      results = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, mode, results });
  } catch (error) {
    console.error('Error generating strategy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
