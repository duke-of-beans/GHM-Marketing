import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";

// POST /api/users/[id]/onboarding-reset — admin resets a user's onboarding so they go through the wizard again
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await withPermission(req, "manage_team");
  if (permissionError) return permissionError;

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      repOnboardingCompletedAt: null,
      repOnboardingStep: 0,
    },
  });

  return NextResponse.json({ success: true });
}
