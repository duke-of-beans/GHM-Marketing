import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/users/onboarding
 * Returns current rep's onboarding progress.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      repOnboardingStep: true,
      repOnboardingCompletedAt: true,
      territoryId: true,
      name: true,
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    step: user.repOnboardingStep,
    completedAt: user.repOnboardingCompletedAt,
    territoryId: user.territoryId,
    name: user.name,
  });
}

/**
 * PATCH /api/users/onboarding
 * Save progress: { step, completed? }
 * step: 0-7 (last completed step index)
 * completed: true → marks repOnboardingCompletedAt = now
 */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const body = await req.json().catch(() => ({}));
  const { step, completed } = body as { step?: number; completed?: boolean };

  const data: Record<string, unknown> = {};
  if (typeof step === "number") data.repOnboardingStep = step;
  if (completed === true) data.repOnboardingCompletedAt = new Date();

  await prisma.user.update({ where: { id: userId }, data });

  return NextResponse.json({ ok: true });
}
