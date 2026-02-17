import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Validation schema for edit request
const editClientSchema = z.object({
  lead: z.object({
    businessName: z.string().min(2).max(100).optional(),
    phone: z.string().regex(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/).optional(),
    email: z.string().email().optional().nullable(),
    website: z.string().url().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().min(2).optional(),
    state: z.string().length(2).optional(),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
  }).optional(),
  clientProfile: z.object({
    retainerAmount: z.number().min(0).optional(),
    scanFrequency: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
    status: z.enum(['active', 'paused', 'at_risk', 'churned']).optional(),
  }).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = editClientSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { lead: leadUpdates, clientProfile: clientUpdates } = validation.data;
    const clientId = parseInt(params.id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    // Fetch existing client
    const existingClient = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: { lead: true },
    });

    if (!existingClient) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Track changes for audit trail
    const changes: string[] = [];

    // Update lead if changes provided
    if (leadUpdates && Object.keys(leadUpdates).length > 0) {
      const oldLead = existingClient.lead;
      
      // Track what changed
      Object.entries(leadUpdates).forEach(([key, value]) => {
        const oldValue = oldLead[key as keyof typeof oldLead];
        if (oldValue !== value) {
          changes.push(`${key}: ${oldValue ?? 'null'} → ${value ?? 'null'}`);
        }
      });

      // Update lead
      await prisma.lead.update({
        where: { id: existingClient.leadId },
        data: leadUpdates,
      });
    }

    // Update client profile if changes provided
    if (clientUpdates && Object.keys(clientUpdates).length > 0) {
      // Track what changed
      Object.entries(clientUpdates).forEach(([key, value]) => {
        const oldValue = existingClient[key as keyof typeof existingClient];
        if (oldValue !== value) {
          changes.push(`${key}: ${oldValue ?? 'null'} → ${value ?? 'null'}`);
        }
      });

      // Update client profile
      await prisma.clientProfile.update({
        where: { id: clientId },
        data: clientUpdates,
      });
    }

    // Create audit trail (system note) if changes were made
    if (changes.length > 0) {
      await prisma.clientNote.create({
        data: {
          clientId: clientId,
          authorId: session.user.id,
          content: `Updated client details: ${changes.join(', ')}`,
          type: 'system',
          isPinned: false,
        },
      });
    }

    // Fetch and return updated client
    const updatedClient = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: {
        lead: true,
        domains: true,
        competitors: true,
        tasks: {
          where: {
            status: { in: ['queued', 'in-progress'] },
          },
          orderBy: {
            priority: 'asc',
          },
        },
        notes: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${changes.length} field(s)`,
      data: updatedClient,
    });

  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}
