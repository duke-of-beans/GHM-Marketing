import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isElevated } from "@/lib/auth/roles";

/**
 * POST /api/content/bulk
 * Body: { action: "approve" | "archive", ids: number[] }
 *
 * "approve" → status = "approved"  (master+ only)
 * "archive" → status = "archived"  (master+ only)
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any).role as string;
  if (!isElevated(role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await req.json();
  const { action, ids } = body as { action: string; ids: number[] };

  if (!action || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "action and ids are required" }, { status: 400 });
  }

  const statusMap: Record<string, string> = {
    approve: "approved",
    archive: "archived",
  };

  if (!statusMap[action]) {
    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  }

  try {
    const result = await prisma.clientContent.updateMany({
      where: { id: { in: ids } },
      data: { status: statusMap[action] },
    });
    return NextResponse.json({ success: true, updated: result.count });
  } catch (err) {
    console.error("Bulk content action error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
