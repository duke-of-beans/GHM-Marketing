import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from "@/lib/auth/api-permissions";

export async function POST(request: NextRequest) {
  try {
    const permissionError = await withPermission(request, "manage_clients");
    if (permissionError) return permissionError;

    const body = await request.json();
    const { contentId, scheduledFor } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: 'Missing required field: contentId' },
        { status: 400 }
      );
    }

    if (!scheduledFor) {
      return NextResponse.json(
        { error: 'Missing required field: scheduledFor' },
        { status: 400 }
      );
    }

    // Validate date format
    const scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format for scheduledFor' },
        { status: 400 }
      );
    }

    // Update content to scheduled status
    const updatedContent = await prisma.clientContent.update({
      where: { id: contentId },
      data: {
        status: 'scheduled',
        scheduledFor: scheduledDate,
      },
    });

    return NextResponse.json({
      success: true,
      content: updatedContent,
    });

  } catch (error) {
    console.error('Error scheduling content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
