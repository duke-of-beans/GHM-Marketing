import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, industry, keywords, tone, wordCount } = body;

    if (!clientId || !keywords || keywords.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, keywords' },
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

    const targetWordCount = wordCount || 1200;
    const postTone = tone || 'professional';
    const keywordList = Array.isArray(keywords) ? keywords.join(', ') : keywords;
    const businessIndustry = industry || 'their industry';

    const prompt = `Write an SEO-optimized blog post for ${client.businessName}, a business in ${businessIndustry}.

Target Keywords: ${keywordList}
Word Count: ${targetWordCount} words (±100 words)
Tone: ${postTone}

Requirements:
1. Write a compelling headline (H1) that includes the primary keyword
2. Use proper heading hierarchy (H2, H3 tags)
3. Naturally incorporate all target keywords throughout the content
4. Structure content with short paragraphs (2-4 sentences max)
5. Include actionable insights and valuable information
6. Add a strong call-to-action at the end

Output Format:
Return the blog post in clean HTML format with proper heading tags (h1, h2, h3) and paragraph tags.
Do NOT include any markdown formatting, code fences, or preamble.
Start with the H1 headline and proceed directly with the content.`;

    const result = await callAI({
      feature: 'blog_post',
      prompt,
      context: {
        feature: 'blog_post',
        clientId,
        clientName: client.businessName,
        industry: businessIndustry,
      },
      maxTokens: Math.ceil(targetWordCount / 0.75), // ~1.33 tokens/word
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const generatedContent = result.content;

    if (!generatedContent) {
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }

    const h1Match = generatedContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = h1Match ? h1Match[1].replace(/<[^>]*>/g, '') : 'Untitled Blog Post';

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
          modelUsed: result.modelUsed,
          wasEscalated: result.wasEscalated,
        },
      },
    });

    return NextResponse.json({ success: true, content: savedContent });
  } catch (error) {
    console.error('Error generating blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
