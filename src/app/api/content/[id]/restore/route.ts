import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentId = parseInt(params.id);
    if (isNaN(contentId)) {
      return NextResponse.json(
        { error: 'Invalid content ID' },
        { status: 400 }
      );
    }

    const { versionId } = await request.json();
    
    if (!versionId) {
      return NextResponse.json(
        { error: 'Version ID required' },
        { status: 400 }
      );
    }

    // Get the version to restore
    const version = await prisma.contentVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.contentId !== contentId) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Get current content for creating new version
    const currentContent = await prisma.clientContent.findUnique({
      where: { id: contentId },
    });

    if (!currentContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Create version of current state before restoring
    await prisma.contentVersion.create({
      data: {
        contentId,
        versionNumber: currentContent.currentVersion + 1,
        title: currentContent.title,
        content: currentContent.content,
        keywords: currentContent.keywords,
        metadata: currentContent.metadata as any,
        changeNote: `Auto-saved before restoring to version ${version.versionNumber}`,
        createdBy: version.createdBy, // Should use session user in real impl
      },
    });

    // Restore the selected version
    const updated = await prisma.clientContent.update({
      where: { id: contentId },
      data: {
        title: version.title,
        content: version.content,
        keywords: version.keywords,
        metadata: version.metadata as any,
        currentVersion: currentContent.currentVersion + 1,
      },
    });

    return NextResponse.json({
      success: true,
      content: updated,
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
