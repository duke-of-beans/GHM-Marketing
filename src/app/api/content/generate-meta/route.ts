import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, pageContent, url, keywords } = body;

    // Validate required fields
    if (!clientId || (!pageContent && !url)) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId and either pageContent or url' },
        { status: 400 }
      );
    }

    // Verify client exists
    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: { businessName: true },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Build the prompt for meta description generation
    const keywordList = keywords && keywords.length > 0 
      ? `Target keywords: ${keywords.join(', ')}` 
      : '';

    const prompt = `You are an SEO specialist creating meta descriptions for ${client.businessName}.

${url ? `Generate a meta description for this URL: ${url}` : ''}

Page content to summarize:
${pageContent}

${keywordList}

**Requirements:**
1. Length: 150-160 characters (strict limit)
2. Include primary keyword naturally
3. Compelling and action-oriented
4. Accurately summarize page content
5. Encourage clicks from search results

**Output Format:**
Return ONLY the meta description text, no quotes, no other formatting or explanation.`;

    // Generate meta description using Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the generated content
    const generatedMeta = message.content[0].type === 'text' 
      ? message.content[0].text.trim() 
      : '';

    if (!generatedMeta) {
      return NextResponse.json(
        { error: 'Failed to generate meta description' },
        { status: 500 }
      );
    }

    // Validate length (should be 150-160 characters)
    if (generatedMeta.length > 165) {
      console.warn(`Meta description too long: ${generatedMeta.length} characters`);
    }

    // Save to database
    const savedContent = await prisma.clientContent.create({
      data: {
        clientId,
        contentType: 'meta',
        title: url || 'Meta Description',
        content: generatedMeta,
        keywords: keywords || [],
        status: 'draft',
        metadata: {
          url: url || null,
          characterCount: generatedMeta.length,
          generatedAt: new Date().toISOString(),
          modelUsed: 'claude-sonnet-4-20250514',
        },
      },
    });

    return NextResponse.json({
      success: true,
      content: savedContent,
      characterCount: generatedMeta.length,
    });

  } catch (error) {
    console.error('Error generating meta description:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
