import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/onboarding/submissions
 * Admin/master only. List all onboarding submissions.
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = req.nextUrl;
    const complete = searchParams.get("complete");

    const submissions = await prisma.onboardingSubmission.findMany({
      where: complete !== null ? { onboardingComplete: complete === "true" } : undefined,
      include: {
        token: {
          include: {
            generatedByUser: { select: { id: true, name: true } },
          },
        },
        lead: {
          select: { id: true, businessName: true, city: true, state: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ data: submissions });
  } catch (error) {
    console.error("Submissions list error:", error);
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }
}
