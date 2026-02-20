import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * PATCH /api/onboarding/submissions/[id]/checklist
 * Update one or more checklist items on an onboarding submission.
 * Body: { items: { key: string; completed: boolean; note?: string }[] }
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

    const body = await req.json();
    const { items } = body as {
      items: { key: string; completed: boolean; note?: string }[];
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items array required" }, { status: 400 });
    }

    const submission = await prisma.onboardingSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, opsChecklist: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Merge updates into existing checklist
    const existing = (submission.opsChecklist as Record<string, { completed: boolean; note?: string }>) ?? {};
    for (const item of items) {
      existing[item.key] = {
        completed: item.completed,
        note: item.note ?? existing[item.key]?.note ?? "",
      };
    }

    const updated = await prisma.onboardingSubmission.update({
      where: { id: submissionId },
      data: { opsChecklist: existing },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Checklist update error:", error);
    return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 });
  }
}
