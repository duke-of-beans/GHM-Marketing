import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { calculateCommission, getFirstDayOfMonth } from '@/lib/payments/calculations';

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
    churnReason: z.string().max(2000).optional().nullable(),
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

      // Churn handling: stamp churnedAt and cancel pending transactions
      const isChurning =
        clientUpdates.status === 'churned' &&
        existingClient.status !== 'churned';

      const { churnReason, ...profileUpdates } = clientUpdates;

      await prisma.clientProfile.update({
        where: { id: clientId },
        data: {
          ...profileUpdates,
          ...(isChurning && {
            churnedAt: new Date(),
            churnReason: churnReason ?? null,
          }),
        },
      });

      if (isChurning) {
        // Cancel all pending/approved transactions — no more payments on a churned client
        await prisma.paymentTransaction.updateMany({
          where: { clientId, status: { in: ['pending', 'approved'] } },
          data: { status: 'cancelled', notes: `Auto-cancelled: client churned` },
        });
      }

      // Commission trigger: fire one-time commission when client first goes active
      const isNewlyActive =
        clientUpdates.status === 'active' &&
        existingClient.status !== 'active';

      if (isNewlyActive && existingClient.salesRepId) {
        try {
          const salesConfig = await prisma.userCompensationConfig.findUnique({
            where: { userId: existingClient.salesRepId },
          });
          const override = await prisma.clientCompensationOverride.findUnique({
            where: {
              clientId_userId: {
                clientId,
                userId: existingClient.salesRepId,
              },
            },
          });

          if (salesConfig) {
            const updatedClient = {
              ...existingClient,
              status: 'active',
              onboardedMonth: existingClient.onboardedMonth ?? getFirstDayOfMonth(),
            };
            const commission = calculateCommission(salesConfig, override ?? null, updatedClient);

            if (commission.shouldPay) {
              // Idempotency check — don't double-create if re-activated
              const alreadyExists = await prisma.paymentTransaction.findFirst({
                where: {
                  clientId,
                  userId: existingClient.salesRepId,
                  type: 'commission',
                },
              });

              if (!alreadyExists) {
                await prisma.paymentTransaction.create({
                  data: {
                    clientId,
                    userId: existingClient.salesRepId,
                    type: 'commission',
                    amount: commission.amount,
                    month: getFirstDayOfMonth(),
                    status: 'pending',
                    notes: commission.reason,
                  },
                });

                // Stamp onboardedMonth if not already set
                if (!existingClient.onboardedMonth) {
                  await prisma.clientProfile.update({
                    where: { id: clientId },
                    data: { onboardedMonth: getFirstDayOfMonth() },
                  });
                }
              }
            }
          }
        } catch (commissionError) {
          // Non-fatal: log and continue — client update already succeeded
          console.error('[clients PATCH] Commission trigger failed:', commissionError);
        }
      }
    }

    // Create audit trail (system note) if changes were made
    if (changes.length > 0) {
      await prisma.clientNote.create({
        data: {
          clientId: clientId,
          authorId: parseInt(session.user.id),
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

// DELETE /api/clients/[id]
// Admin only. Hard deletes the ClientProfile and its parent Lead.
// All child records cascade via schema onDelete: Cascade.
// Intended for test/junk data removal only — use churn for real departures.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: { leadId: true, businessName: true },
    });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Delete ClientProfile first (children cascade), then the parent Lead
    await prisma.clientProfile.delete({ where: { id: clientId } });
    await prisma.lead.delete({ where: { id: client.leadId } });

    return NextResponse.json({
      success: true,
      message: `${client.businessName} permanently deleted`,
    });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
