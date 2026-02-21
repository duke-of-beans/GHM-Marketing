/**
 * GET /api/leads/[id]/history
 * Returns combined audit and demo generation history for a lead.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const [audits, demos] = await Promise.all([
    prisma.prospectAudit.findMany({
      where: { leadId },
      orderBy: { generatedAt: "desc" },
      take: 20,
      select: { id: true, repName: true, healthScore: true, gapCount: true, generatedAt: true },
    }),
    prisma.prospectDemo.findMany({
      where: { leadId },
      orderBy: { generatedAt: "desc" },
      take: 20,
      select: { id: true, repName: true, generatedAt: true },
    }),
  ]);

  return NextResponse.json({ audits, demos });
}
