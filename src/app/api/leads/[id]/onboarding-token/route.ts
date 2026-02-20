import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/leads/[id]/onboarding-token
 * Returns the most recent onboarding token for a lead, if any.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leadId = parseInt(params.id);
    if (isNaN(leadId)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
    }

    const token = await prisma.onboardingToken.findFirst({
      where: { leadId },
      include: {
        submission: {
          select: { id: true, submittedAt: true, onboardingComplete: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!token) {
      return NextResponse.json({ data: null }, { status: 404 });
    }

    return NextResponse.json({ data: token });
  } catch (error) {
    console.error("Lead onboarding token fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch token" }, { status: 500 });
  }
}
