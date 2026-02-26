import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai';
import { withPermission } from "@/lib/auth/api-permissions";

export async function POST(request: NextRequest) {
  try {
    const permissionError = await withPermission(request, "manage_clients");
    if (permissionError) return permissionError;

    const body = await request.json();
    const { clientId, blogPostId, topic, platforms, tone } = body;

    if (!clientId || (!blogPostId && !topic)) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId and either blogPostId or topic' },
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

    let sourceContent = '';
    let sourceTitle = '';

    if (blogPostId) {
      const blogPost = await prisma.clientContent.findUnique({
        where: { id: blogPostId },
        select: { title: true, content: true },
      });
      if (!blogPost) {
        return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
      }
      sourceTitle = blogPost.title || '';
      sourceContent = blogPost.content;
    } else {
      sourceContent = topic;
    }

    const targetPlatforms = platforms || ['linkedin', 'facebook', 'twitter'];
    const postTone = tone || 'professional';

    const prompt = `Create social media posts for ${client.businessName}.

${blogPostId ? `Based on this blog post titled "${sourceTitle}":\n\n${sourceContent}` : `Topic:\n\n${sourceContent}`}

Generate ${targetPlatforms.length} posts for: ${targetPlatforms.join(', ')}.

Requirements:
- Tone: ${postTone}
- LinkedIn: 150-300 words, professional insights
- Facebook: 100-200 words, engaging and conversational
- Twitter: Under 280 characters, punchy and impactful
- Include relevant emojis where appropriate
- Add 3-5 relevant hashtags per post
- Include a clear call-to-action

Return ONLY a JSON array — no preamble, no markdown fences:
[
  {
    "platform": "linkedin",
    "content": "Post content...",
    "hashtags": ["#hashtag1", "#hashtag2"]
  }
]`;

    const result = await callAI({
      feature: 'social_posts',
      prompt,
      context: {
        feature: 'social_posts',
        clientId,
        clientName: client.businessName,
      },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const cleaned = result.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let socialPosts;
    try {
      socialPosts = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to parse generated content' }, { status: 500 });
    }

    const savedPosts = await Promise.all(
      socialPosts.map((post: { platform: string; content: string; hashtags: string[] }) =>
        prisma.clientContent.create({
          data: {
            clientId,
            contentType: 'social',
            title: `${post.platform} post${sourceTitle ? ` - ${sourceTitle}` : ''}`,
            content: post.content,
            keywords: post.hashtags,
            status: 'draft',
            metadata: {
              platform: post.platform,
              sourceBlogId: blogPostId || null,
              tone: postTone,
              generatedAt: new Date().toISOString(),
              modelUsed: result.modelUsed,
            },
          },
        })
      )
    );

    return NextResponse.json({ success: true, posts: savedPosts });
  } catch (error) {
    console.error('Error generating social posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
