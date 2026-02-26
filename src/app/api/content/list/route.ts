import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from "@/lib/auth/api-permissions";

export async function GET(request: NextRequest) {
  try {
    const permissionError = await withPermission(request, "manage_clients");
    if (permissionError) return permissionError;

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const contentType = searchParams.get('contentType');
    const status = searchParams.get('status');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing required parameter: clientId' },
        { status: 400 }
      );
    }

    // Build filter conditions
    const where: any = {
      clientId: parseInt(clientId),
    };

    if (contentType) {
      where.contentType = contentType;
    }

    if (status) {
      where.status = status;
    }

    // Fetch content
    const content = await prisma.clientContent.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        client: {
          select: {
            businessName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      content,
    });

  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const permissionError = await withPermission(request, "manage_clients");
    if (permissionError) return permissionError;

    const body = await request.json();
    const { contentId, status, scheduledFor } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing required field: contentId' },
        { status: 400 }
      );
    }

    // Update content
    const updatedContent = await prisma.clientContent.update({
      where: { id: contentId },
      data: {
        ...(status && { status }),
        ...(scheduledFor && { scheduledFor: new Date(scheduledFor) }),
      },
    });

    return NextResponse.json({
      success: true,
      content: updatedContent,
    });

  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
