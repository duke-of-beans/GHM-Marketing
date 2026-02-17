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
    const { title, content } = body;

    if (isNaN(contentId)) {
      return NextResponse.json(
        { error: 'Invalid content ID' },
        { status: 400 }
      );
    }

    // Update the content
    const updated = await prisma.clientContent.update({
      where: { id: contentId },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
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
