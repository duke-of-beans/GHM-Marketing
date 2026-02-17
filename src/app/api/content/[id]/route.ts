import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
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

    // Delete the content
    await prisma.clientContent.delete({
      where: { id: contentId },
    });

    return NextResponse.json(
      { success: true, message: 'Content deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentId = parseInt(params.id);
    const body = await request.json();
    const { title, content, changeNote } = body;

    if (isNaN(contentId)) {
      return NextResponse.json(
        { error: 'Invalid content ID' },
        { status: 400 }
      );
    }

    // Get current content
    const currentContent = await prisma.clientContent.findUnique({
      where: { id: contentId },
    });

    if (!currentContent) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Create version of current state before updating
    await prisma.contentVersion.create({
      data: {
        contentId,
        versionNumber: currentContent.currentVersion,
        title: currentContent.title,
        content: currentContent.content,
        keywords: currentContent.keywords,
        metadata: currentContent.metadata as any,
        changeNote: changeNote || 'Content updated',
        createdBy: 1, // TODO: Use session user ID
      },
    });

    // Update the content with new version number
    const updated = await prisma.clientContent.update({
      where: { id: contentId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        currentVersion: currentContent.currentVersion + 1,
      },
    });

    return NextResponse.json(
      { success: true, data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}
