import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, service, keywords, callToAction, useVoiceProfile } = body;

    if (!clientId || !service?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, service' },
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

    // Optionally fetch voice profile
    let voiceContext = '';
    if (useVoiceProfile) {
      const voiceProfile = await prisma.voiceProfile.findUnique({
        where: { clientId },
        select: { tonality: true, vocabulary: true, sentenceStructure: true, formality: true, enthusiasm: true },
      });
      if (voiceProfile) {
        voiceContext = `\n\nBrand voice: ${voiceProfile.tonality}. Formality: ${voiceProfile.formality}/10, Enthusiasm: ${voiceProfile.enthusiasm}/10. Key vocabulary: ${voiceProfile.vocabulary.slice(0, 10).join(', ')}. Sentence style: ${voiceProfile.sentenceStructure}.`;
      }
    }

    const keywordList = keywords?.trim() ? `Target keywords: ${keywords}` : '';
    const ctaNote = callToAction?.trim() ? `Preferred call to action: ${callToAction}` : '';

    const prompt = `Create 3 Google Ads ad copy variants for ${client.businessName}.

Service/Campaign: ${service}
${keywordList}
${ctaNote}${voiceContext}

Google Ads character limits:
- Headlines: max 30 characters each (provide 3 headlines per variant)
- Descriptions: max 90 characters each (provide 2 descriptions per variant)

Requirements:
- Each variant should have a different angle (e.g., value/price, urgency, social proof, features)
- Include the primary keyword naturally in at least one headline per variant
- Every headline and description MUST be within character limits — count carefully
- Descriptions should end with a clear call to action

Return ONLY a JSON array with no extra text or markdown. Format:
[
  {
    "variant": "Angle name (e.g., Value, Urgency, Trust)",
    "headlines": ["Headline 1", "Headline 2", "Headline 3"],
    "descriptions": ["Description 1", "Description 2"]
  }
]`;

    const result = await callAI({
      feature: 'ppc_ads',
      prompt,
      context: {
        feature: 'ppc_ads',
        clientId,
        clientName: client.businessName,
      },
      constraints: { maxCost: 0.005 },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const cleaned = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let results: unknown[];
    try {
      results = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: result.content },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Error generating PPC copy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
