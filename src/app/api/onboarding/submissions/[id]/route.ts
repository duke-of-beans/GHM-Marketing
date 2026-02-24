import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/onboarding/submissions/[id]
 * Fetch a single submission with full detail.
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

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true },
    });

    if (user?.role !== "admin" && user?.role !== "manager") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const submissionId = parseInt(params.id);
    if (isNaN(submissionId)) {
      return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
    }

    const submission = await prisma.onboardingSubmission.findUnique({
      where: { id: submissionId },
      include: {
        token: {
          include: {
            generatedByUser: { select: { id: true, name: true, email: true } },
          },
        },
        lead: {
          select: { id: true, businessName: true, city: true, state: true, email: true, phone: true },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ data: submission });
  } catch (error) {
    console.error("Submission fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}
