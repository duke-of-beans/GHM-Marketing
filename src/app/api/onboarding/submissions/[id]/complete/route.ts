import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * PATCH /api/onboarding/submissions/[id]/complete
 * Mark a submission as fully onboarded.
 */
export async function PATCH(
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

    if (user?.role !== "admin" && user?.role !== "master") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const submissionId = parseInt(params.id);
    if (isNaN(submissionId)) {
      return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
    }

    const updated = await prisma.onboardingSubmission.update({
      where: { id: submissionId },
      data: { onboardingComplete: true },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Complete submission error:", error);
    return NextResponse.json({ error: "Failed to mark complete" }, { status: 500 });
  }
}
