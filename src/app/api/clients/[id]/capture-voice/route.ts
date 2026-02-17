import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { captureVoiceFromWebsite } from '@/lib/scrvnr/voice-capture';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    // Check authentication and role
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    // Only allow master managers to capture voice
    if (user?.role !== 'master') {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only master managers can capture voice profiles.' },
        { status: 403 }
      );
    }

    // Get client with lead data
    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: {
        lead: {
          select: {
            website: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get website URL (allow override from request body)
    const body = await request.json().catch(() => ({}));
    const websiteUrl = body.websiteUrl || client.lead?.website;

    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'No website URL available for this client' },
        { status: 400 }
      );
    }

    // Capture voice profile
    console.log(`Capturing voice profile for ${client.businessName} from ${websiteUrl}`);
    const voiceProfile = await captureVoiceFromWebsite(websiteUrl);

    // Store voice profile in database
    const saved = await prisma.voiceProfile.upsert({
      where: { clientId },
      create: {
        id: voiceProfile.profileId,
        clientId,
        tonality: voiceProfile.tonality,
        vocabulary: voiceProfile.vocabulary,
        sentenceStructure: voiceProfile.sentenceStructure,
        formality: voiceProfile.characteristics.formality,
        enthusiasm: voiceProfile.characteristics.enthusiasm,
        technicality: voiceProfile.characteristics.technicality,
        brevity: voiceProfile.characteristics.brevity,
      },
      update: {
        id: voiceProfile.profileId,
        tonality: voiceProfile.tonality,
        vocabulary: voiceProfile.vocabulary,
        sentenceStructure: voiceProfile.sentenceStructure,
        formality: voiceProfile.characteristics.formality,
        enthusiasm: voiceProfile.characteristics.enthusiasm,
        technicality: voiceProfile.characteristics.technicality,
        brevity: voiceProfile.characteristics.brevity,
      },
    });

    // Update client profile ID reference
    await prisma.clientProfile.update({
      where: { id: clientId },
      data: { voiceProfileId: voiceProfile.profileId },
    });

    return NextResponse.json({
      success: true,
      voiceProfile: {
        profileId: saved.id,
        tonality: saved.tonality,
        vocabulary: saved.vocabulary,
        sentenceStructure: saved.sentenceStructure,
        characteristics: {
          formality: saved.formality,
          enthusiasm: saved.enthusiasm,
          technicality: saved.technicality,
          brevity: saved.brevity,
        },
      },
    });

  } catch (error) {
    console.error('Error capturing voice:', error);
    return NextResponse.json(
      { 
        error: 'Failed to capture voice profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
