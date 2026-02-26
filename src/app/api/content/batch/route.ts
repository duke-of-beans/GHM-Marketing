import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from "@/lib/auth/api-permissions";

export async function DELETE(request: NextRequest) {
  try {
    const permissionError = await withPermission(request, "manage_clients");
    if (permissionError) return permissionError;

    const body = await request.json();
    const { contentIds } = body;

    if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid contentIds array' },
        { status: 400 }
      );
    }

    // Security: Verify all content items belong to the same client
    const contentItems = await prisma.clientContent.findMany({
      where: {
        id: { in: contentIds },
      },
      select: {
        clientId: true,
      },
    });

    const clientIds = new Set(contentItems.map(item => item.clientId));
    if (clientIds.size > 1) {
      return NextResponse.json(
        { error: 'Cannot delete content from multiple clients in one operation' },
        { status: 403 }
      );
    }

    // Delete all content items
    const deleteResult = await prisma.clientContent.deleteMany({
      where: {
        id: { in: contentIds },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
    });

  } catch (error) {
    console.error('Error batch deleting content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
