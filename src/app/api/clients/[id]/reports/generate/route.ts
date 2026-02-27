import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";
import { generateMonthlyReportData } from "@/lib/reports/generator";
import { generateReportHTML } from "@/lib/reports/template";
import { requireTenant } from "@/lib/tenant/server";

/**
 * POST /api/clients/[id]/reports/generate
 *
 * On-demand report generation for a specific client.
 * Gathers all available data, generates AI narratives, creates ClientReport record.
 * Sprint 5 D3 — per-client endpoint.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const { id } = await params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
    }

    // Verify client exists
    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const type: string = body.type ?? "monthly";

    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let periodStart: Date;
    if (type === "quarterly") {
      periodStart = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    } else if (type === "annual") {
      periodStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    } else {
      // monthly (default)
      periodStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    const reportData = await generateMonthlyReportData(clientId, periodStart, periodEnd, {
      includeNarratives: true,
    });

    const tenant = await requireTenant();
    const html = generateReportHTML(reportData, tenant);

    const report = await prisma.clientReport.create({
      data: {
        clientId,
        type,
        periodStart,
        periodEnd,
        content: reportData as any,
        pdfUrl: null,
        sentToClient: false,
      },
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      html,
    });
  } catch (error) {
    console.error("Failed to generate client report:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: (error as Error).message },
      { status: 500 }
    );
  }
}
