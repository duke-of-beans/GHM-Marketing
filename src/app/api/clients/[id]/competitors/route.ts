import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET  /api/clients/[id]/competitors  — list active competitors
 * POST /api/clients/[id]/competitors  — add competitor { businessName, domain? }
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = parseInt(params.id);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });

  try {
    const competitors = await prisma.clientCompetitor.findMany({
      where: { clientId, isActive: true },
      orderBy: { addedAt: "asc" },
    });
    return NextResponse.json({ competitors });
  } catch (err) {
    console.error("GET competitors error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = parseInt(params.id);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });

  const { businessName, domain } = await req.json();
  if (!businessName?.trim()) {
    return NextResponse.json({ error: "businessName is required" }, { status: 400 });
  }

  try {
    const competitor = await prisma.clientCompetitor.create({
      data: {
        clientId,
        businessName: businessName.trim(),
        domain: domain?.trim() || null,
      },
    });
    return NextResponse.json({ competitor });
  } catch (err) {
    console.error("POST competitor error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
