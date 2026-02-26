import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from "@/lib/auth/api-permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await withPermission(request, "manage_clients");
    if (permissionError) return permissionError;

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    // Get voice profile from database
    const voiceProfile = await prisma.voiceProfile.findUnique({
      where: { clientId },
    });

    if (!voiceProfile) {
      return NextResponse.json(
        { error: 'No voice profile found for this client' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        profileId: voiceProfile.id,
        tonality: voiceProfile.tonality,
        vocabulary: voiceProfile.vocabulary,
        sentenceStructure: voiceProfile.sentenceStructure,
        characteristics: {
          formality: voiceProfile.formality,
          enthusiasm: voiceProfile.enthusiasm,
          technicality: voiceProfile.technicality,
          brevity: voiceProfile.brevity,
        },
        createdAt: voiceProfile.createdAt,
        updatedAt: voiceProfile.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error fetching voice profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await withPermission(request, "manage_clients");
    if (permissionError) return permissionError;

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    // Delete voice profile
    await prisma.voiceProfile.delete({
      where: { clientId },
    });

    // Clear voiceProfileId reference in client
    await prisma.clientProfile.update({
      where: { id: clientId },
      data: { voiceProfileId: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Voice profile removed',
    });

  } catch (error) {
    console.error('Error deleting voice profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
