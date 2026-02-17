import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, industry, keywords, tone, wordCount } = body;

    // Validate required fields
    if (!clientId || !keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, keywords' },
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

    // Build the prompt for blog post generation
    const targetWordCount = wordCount || 1200;
    const postTone = tone || 'professional';
    const keywordList = Array.isArray(keywords) ? keywords.join(', ') : keywords;
    const businessIndustry = industry || 'their industry';

    const prompt = `You are an SEO content specialist writing a blog post for ${client.businessName}, a business in ${businessIndustry}.

Create an engaging, SEO-optimized blog post with the following specifications:

**Target Keywords:** ${keywordList}
**Word Count:** ${targetWordCount} words (±100 words)
**Tone:** ${postTone}

**Requirements:**
1. Write a compelling headline (H1) that includes the primary keyword
2. Use proper heading hierarchy (H2, H3 tags)
3. Naturally incorporate all target keywords throughout the content
4. Write in a ${postTone} tone that engages readers
5. Include actionable insights and valuable information
6. Structure content with short paragraphs (2-4 sentences max)
7. Add a strong call-to-action at the end

**Output Format:**
Return the blog post in clean HTML format with proper heading tags (h1, h2, h3), paragraph tags, and any necessary formatting. Do NOT include any markdown formatting, code fences, or preamble.

Start with the H1 headline and proceed directly with the content.`;

    // Generate content using Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the generated content
    const generatedContent = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      );
    }

    // Extract title from H1 tag
    const h1Match = generatedContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = h1Match ? h1Match[1].replace(/<[^>]*>/g, '') : 'Untitled Blog Post';

    // Save to database
    const savedContent = await prisma.clientContent.create({
      data: {
        clientId,
        contentType: 'blog',
        title,
        content: generatedContent,
        keywords,
        status: 'draft',
        metadata: {
          industry,
          tone: postTone,
          targetWordCount,
          generatedAt: new Date().toISOString(),
          modelUsed: 'claude-sonnet-4-20250514',
        },
      },
    });

    return NextResponse.json({
      success: true,
      content: savedContent,
    });

  } catch (error) {
    console.error('Error generating blog post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
