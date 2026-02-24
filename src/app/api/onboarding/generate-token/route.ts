import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

/**
 * POST /api/onboarding/generate-token
 * Authenticated (partner or admin). Generate a unique onboarding link for a lead.
 * Returns existing token if one already exists for this lead.
 * Body: { leadId: number }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { leadId } = await req.json() as { leadId: number };

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    // Load the lead + verify it exists and is in appropriate status
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        businessName: true,
        status: true,
        assignedTo: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Check user is assigned to this lead or is admin/master
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isElevated = user?.role === "admin" || user?.role === "manager";
    const isAssigned = lead.assignedTo === userId;

    if (!isElevated && !isAssigned) {
      return NextResponse.json({ error: "Forbidden — lead not assigned to you" }, { status: 403 });
    }

    // Enforce lead is in paperwork or won
    const eligibleStatuses = ["paperwork", "won"];
    if (!eligibleStatuses.includes(lead.status)) {
      return NextResponse.json(
        { error: `Lead must be in paperwork or won status. Current status: ${lead.status}` },
        { status: 422 }
      );
    }

    // Return existing non-expired, non-completed token if one exists
    const existing = await prisma.onboardingToken.findFirst({
      where: {
        leadId,
        status: { in: ["pending", "in_progress"] },
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      const url = `${process.env.NEXTAUTH_URL}/welcome/${existing.token}`;
      return NextResponse.json({
        token: existing.token,
        url,
        expiresAt: existing.expiresAt.toISOString(),
        isExisting: true,
      });
    }

    // Create new token
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const created = await prisma.onboardingToken.create({
      data: {
        token,
        leadId,
        generatedBy: userId,
        expiresAt,
        status: "pending",
      },
    });

    const url = `${process.env.NEXTAUTH_URL}/welcome/${token}`;

    return NextResponse.json({
      token: created.token,
      url,
      expiresAt: created.expiresAt.toISOString(),
      isExisting: false,
    }, { status: 201 });
  } catch (error) {
    console.error("Generate onboarding token error:", error);
    return NextResponse.json({ error: "Failed to generate onboarding link" }, { status: 500 });
  }
}
