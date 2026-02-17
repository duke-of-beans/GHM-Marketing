import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, blogPostId, topic, platforms, tone } = body;

    // Validate required fields
    if (!clientId || (!blogPostId && !topic)) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId and either blogPostId or topic' },
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

    let sourceContent = '';
    let sourceTitle = '';

    // If blog post ID provided, fetch the blog content
    if (blogPostId) {
      const blogPost = await prisma.clientContent.findUnique({
        where: { id: blogPostId },
        select: { title: true, content: true },
      });

      if (!blogPost) {
        return NextResponse.json(
          { error: 'Blog post not found' },
          { status: 404 }
        );
      }

      sourceTitle = blogPost.title || '';
      sourceContent = blogPost.content;
    } else {
      sourceContent = topic;
    }

    const targetPlatforms = platforms || ['linkedin', 'facebook', 'twitter'];
    const postTone = tone || 'professional';

    const prompt = `You are a social media content specialist creating posts for ${client.businessName}.

${blogPostId ? `Based on this blog post titled "${sourceTitle}":\n\n${sourceContent}` : `Create social media posts about this topic:\n\n${sourceContent}`}

Generate ${targetPlatforms.length} social media posts optimized for the following platforms: ${targetPlatforms.join(', ')}.

**Requirements:**
- Tone: ${postTone}
- Each post should be platform-specific in length and style
- LinkedIn: 150-300 words, professional insights
- Facebook: 100-200 words, engaging and conversational
- Twitter: Under 280 characters, punchy and impactful
- Include relevant emojis where appropriate
- Add 3-5 relevant hashtags for each post
- Include a clear call-to-action

**Output Format:**
Return a JSON array with this exact structure:
[
  {
    "platform": "linkedin",
    "content": "The post content here...",
    "hashtags": ["#hashtag1", "#hashtag2"]
  }
]

Return ONLY the JSON array, no other text or formatting.`;

    // Generate social posts using Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract and parse the generated content
    const generatedText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    if (!generatedText) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      );
    }

    // Parse JSON response (remove any markdown code fences if present)
    const cleanedJson = generatedText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    let socialPosts;
    try {
      socialPosts = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('Failed to parse JSON:', cleanedJson);
      return NextResponse.json(
        { error: 'Failed to parse generated content' },
        { status: 500 }
      );
    }

    // Save each social post to database
    const savedPosts = await Promise.all(
      socialPosts.map((post: { platform: string; content: string; hashtags: string[] }) =>
        prisma.clientContent.create({
          data: {
            clientId,
            contentType: 'social',
            title: `${post.platform} post - ${sourceTitle || topic}`,
            content: post.content,
            keywords: post.hashtags,
            status: 'draft',
            metadata: {
              platform: post.platform,
              sourceBlogId: blogPostId || null,
              tone: postTone,
              generatedAt: new Date().toISOString(),
              modelUsed: 'claude-sonnet-4-20250514',
            },
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      posts: savedPosts,
    });

  } catch (error) {
    console.error('Error generating social posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
