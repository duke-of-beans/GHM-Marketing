import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const ClientCompensationSchema = z.object({
  salesRepId: z.number().int().nullable(),
  masterManagerId: z.number().int().nullable(),
  onboardedMonth: z.string().nullable(), // ISO date string
  overrides: z
    .array(
      z.object({
        userId: z.number().int(),
        commissionAmount: z.number().min(0).nullable(),
        residualAmount: z.number().min(0).nullable(),
        feeAmount: z.number().min(0).nullable(),
        reason: z.string().optional().nullable(),
      })
    )
    .optional(),
});

// ============================================================================
// GET - Fetch client's compensation details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    // Get client with compensation details
    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: {
        salesRep: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        masterManager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        compensationOverrides: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ data: client });
  } catch (error) {
    console.error("Error fetching client compensation:", error);
    return NextResponse.json(
      { error: "Failed to fetch client compensation" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update client's compensation assignments and overrides
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "master") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    const body = await request.json();
    const validated = ClientCompensationSchema.parse(body);

    // Verify client exists
    const existingClient = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: { lead: true },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Update client assignments
    const client = await prisma.clientProfile.update({
      where: { id: clientId },
      data: {
        salesRepId: validated.salesRepId,
        masterManagerId: validated.masterManagerId,
        onboardedMonth: validated.onboardedMonth
          ? new Date(validated.onboardedMonth)
          : existingClient.onboardedMonth,
      },
      include: {
        salesRep: true,
        masterManager: true,
      },
    });

    // Handle compensation overrides
    if (validated.overrides && validated.overrides.length > 0) {
      // Delete existing overrides for this client
      await prisma.clientCompensationOverride.deleteMany({
        where: { clientId },
      });

      // Create new overrides
      await prisma.clientCompensationOverride.createMany({
        data: validated.overrides.map((override) => ({
          clientId,
          userId: override.userId,
          commissionAmount: override.commissionAmount,
          residualAmount: override.residualAmount,
          feeAmount: override.feeAmount,
          reason: override.reason || null,
        })),
      });
    }

    // Log the change
    const changes: string[] = [];
    if (validated.salesRepId !== existingClient.salesRepId) {
      changes.push(`Sales rep changed to ${client.salesRep?.name || "none"}`);
    }
    if (validated.masterManagerId !== existingClient.masterManagerId) {
      changes.push(
        `Master manager changed to ${client.masterManager?.name || "none"}`
      );
    }
    if (validated.overrides && validated.overrides.length > 0) {
      changes.push(`${validated.overrides.length} compensation override(s) updated`);
    }

    if (changes.length > 0) {
      await prisma.clientNote.create({
        data: {
          clientId,
          authorId: parseInt(session.user.id),
          type: "system",
          content: `Compensation updated: ${changes.join(", ")}`,
          isPinned: false,
        },
      });
    }

    // Fetch updated client with all compensation details
    const updatedClient = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      include: {
        salesRep: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        masterManager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        compensationOverrides: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ data: updatedClient });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating client compensation:", error);
    return NextResponse.json(
      { error: "Failed to update client compensation" },
      { status: 500 }
    );
  }
}
