import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from "@/lib/auth/api-permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await withPermission(request, "manage_clients");
    if (permissionError) return permissionError;

    const contentId = parseInt(params.id);

    if (isNaN(contentId)) {
      return NextResponse.json(
        { error: 'Invalid content ID' },
        { status: 400 }
      );
    }

    // Update content to published status with timestamp
    const updatedContent = await prisma.clientContent.update({
      where: { id: contentId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      content: updatedContent,
    });

  } catch (error) {
    console.error('Error publishing content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
