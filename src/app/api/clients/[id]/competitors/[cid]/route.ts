import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * DELETE /api/clients/[id]/competitors/[cid]  — soft-delete (isActive = false)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; cid: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const competitorId = parseInt(params.cid);
  if (isNaN(competitorId)) return NextResponse.json({ error: "Invalid competitor ID" }, { status: 400 });

  try {
    await prisma.competitor.update({
      where: { id: competitorId },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE competitor error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
