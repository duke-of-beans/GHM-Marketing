import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai';
import { withPermission } from "@/lib/auth/api-permissions";

export async function POST(request: NextRequest) {
  try {
    const permissionError = await withPermission(request, "manage_clients");
    if (permissionError) return permissionError;

    const body = await request.json();
    const { clientId, pageContent, url, keywords } = body;

    if (!clientId || (!pageContent && !url)) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId and either pageContent or url' },
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

    const keywordList = keywords?.length > 0 ? `Target keywords: ${keywords.join(', ')}` : '';

    const prompt = `Write a meta description for ${client.businessName}.

${url ? `URL: ${url}` : ''}

Page content:
${pageContent}

${keywordList}

Requirements:
1. Length: 150-160 characters (strict)
2. Include primary keyword naturally
3. Compelling and action-oriented
4. Accurately summarizes the page
5. Encourages clicks from search results

Return ONLY the meta description text — no quotes, no explanation.`;

    const result = await callAI({
      feature: 'meta_description',
      prompt,
      context: {
        feature: 'meta_description',
        clientId,
        clientName: client.businessName,
      },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const generatedMeta = result.content.trim();

    if (!generatedMeta) {
      return NextResponse.json({ error: 'Failed to generate meta description' }, { status: 500 });
    }

    if (generatedMeta.length > 165) {
      console.warn(`Meta description too long: ${generatedMeta.length} characters`);
    }

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
          modelUsed: result.modelUsed,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
