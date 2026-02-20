/**
 * GET /api/users/[id]/close-rate
 *
 * Returns the rolling 90-day close rate for a specific user.
 * Sales reps can only query their own rate; admins/masters can query any user.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateRolling90DayCloseRate } from "@/lib/payments/calculations";
import type { SessionUser } from "@/lib/auth/session";
import { isElevated } from "@/lib/auth/roles";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const targetUserId = parseInt(id, 10);
  if (isNaN(targetUserId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  const user = session.user as unknown as SessionUser;
  const selfRequest = Number(user.id) === targetUserId;

  // Sales reps can only see their own close rate
  if (!selfRequest && !isElevated(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await calculateRolling90DayCloseRate(prisma, targetUserId);

  return NextResponse.json({ success: true, data: result });
}
