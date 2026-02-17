import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const CompensationConfigSchema = z.object({
  commissionEnabled: z.boolean(),
  commissionAmount: z.number().min(0),
  residualEnabled: z.boolean(),
  residualAmount: z.number().min(0),
  residualStartMonth: z.number().int().min(1).max(12),
  masterFeeEnabled: z.boolean(),
  masterFeeAmount: z.number().min(0),
  notes: z.string().optional().nullable(),
});

// ============================================================================
// GET - Fetch user's compensation configuration
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "master") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Get user with compensation config
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        compensationConfig: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If no config exists, return defaults
    if (!user.compensationConfig) {
      return NextResponse.json({
        data: {
          userId,
          commissionEnabled: true,
          commissionAmount: 1000,
          residualEnabled: true,
          residualAmount: 200,
          residualStartMonth: 2,
          masterFeeEnabled: user.role === "master",
          masterFeeAmount: 240,
          notes: null,
        },
      });
    }

    return NextResponse.json({ data: user.compensationConfig });
  } catch (error) {
    console.error("Error fetching compensation config:", error);
    return NextResponse.json(
      { error: "Failed to fetch compensation config" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update user's compensation configuration
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

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await request.json();
    const validated = CompensationConfigSchema.parse(body);

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert compensation config
    const config = await prisma.userCompensationConfig.upsert({
      where: { userId },
      create: {
        userId,
        commissionEnabled: validated.commissionEnabled,
        commissionAmount: validated.commissionAmount,
        residualEnabled: validated.residualEnabled,
        residualAmount: validated.residualAmount,
        residualStartMonth: validated.residualStartMonth,
        masterFeeEnabled: validated.masterFeeEnabled,
        masterFeeAmount: validated.masterFeeAmount,
        notes: validated.notes || null,
      },
      update: {
        commissionEnabled: validated.commissionEnabled,
        commissionAmount: validated.commissionAmount,
        residualEnabled: validated.residualEnabled,
        residualAmount: validated.residualAmount,
        residualStartMonth: validated.residualStartMonth,
        masterFeeEnabled: validated.masterFeeEnabled,
        masterFeeAmount: validated.masterFeeAmount,
        notes: validated.notes || null,
      },
    });

    // Log the change
    await prisma.clientNote.create({
      data: {
        clientId: 1, // System note (we'll need a better approach for audit logs)
        authorId: session.user.id,
        type: "system",
        content: `Updated compensation config for ${user.name}: Commission ${validated.commissionEnabled ? 'enabled' : 'disabled'} ($${validated.commissionAmount}), Residual ${validated.residualEnabled ? 'enabled' : 'disabled'} ($${validated.residualAmount}/mo starting month ${validated.residualStartMonth})`,
        isPinned: false,
      },
    });

    return NextResponse.json({ data: config });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating compensation config:", error);
    return NextResponse.json(
      { error: "Failed to update compensation config" },
      { status: 500 }
    );
  }
}
