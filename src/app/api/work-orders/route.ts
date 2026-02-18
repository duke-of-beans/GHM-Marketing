import { NextRequest, NextResponse } from "next/server";
import { withPermission, getUserFromRequest } from "@/lib/auth/api-permissions";
import { generateWorkOrder } from "@/lib/pdf/generate-work-order";
import type { SessionUser } from "@/lib/auth/session";
import { territoryFilter } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  // Check permission
  const permissionError = await withPermission(req, "manage_leads");
  if (permissionError) return permissionError;

  const user = await getUserFromRequest(req);
  const body = await req.json();
  const { leadId, notes } = body;

  if (!leadId || typeof leadId !== "number") {
    return NextResponse.json({ success: false, error: "leadId required" }, { status: 400 });
  }

  // Verify lead access
  const baseFilter = territoryFilter(user);
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...baseFilter },
    select: { id: true },
  });
  if (!lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  try {
    const { buffer, workOrder } = await generateWorkOrder(
      leadId,
      Number(user.id),
      notes
    );

    // Return PDF as downloadable response
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="GHM-${workOrder.woNumber}.pdf"`,
        "X-Work-Order-Id": String(workOrder.id),
        "X-Work-Order-Number": workOrder.woNumber,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate work order";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Check permission
  const permissionError = await withPermission(req, "view_reports");
  if (permissionError) return permissionError;

  const user = await getUserFromRequest(req);
  const leadId = req.nextUrl.searchParams.get("leadId");

  const where = leadId
    ? { leadId: parseInt(leadId, 10) }
    : user.role === "master"
      ? {}
      : { userId: Number(user.id) };

  const workOrders = await prisma.workOrder.findMany({
    where,
    include: {
      lead: { select: { id: true, businessName: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ success: true, data: workOrders });
}
