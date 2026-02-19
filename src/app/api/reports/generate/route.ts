import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";
import { generateMonthlyReportData } from "@/lib/reports/generator";
import { generateReportHTML } from "@/lib/reports/template";

export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const body = await req.json();
    const { clientId, type = "monthly" } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let periodStart: Date;
    if (type === "monthly") {
      periodStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    } else if (type === "quarterly") {
      periodStart = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    } else {
      periodStart = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }

    const reportData = await generateMonthlyReportData(
      clientId,
      periodStart,
      periodEnd
    );

    const html = generateReportHTML(reportData);

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
    console.error("Failed to generate report:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: (error as Error).message },
      { status: 500 }
    );
  }
}
