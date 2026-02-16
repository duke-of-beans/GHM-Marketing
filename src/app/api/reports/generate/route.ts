import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMaster } from "@/lib/auth/session";
import { generateMonthlyReportData } from "@/lib/reports/generator";
import { generateReportHTML } from "@/lib/reports/template";

export async function POST(req: NextRequest) {
  try {
    await requireMaster();

    const body = await req.json();
    const { clientId, type = "monthly" } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID required" },
        { status: 400 }
      );
    }

    // Calculate period based on type
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

    // Generate report data
    const reportData = await generateMonthlyReportData(
      clientId,
      periodStart,
      periodEnd
    );

    // Generate HTML
    const html = generateReportHTML(reportData);

    // Save report to database
    const report = await prisma.clientReport.create({
      data: {
        clientId,
        type,
        periodStart,
        periodEnd,
        content: reportData as any,
        pdfUrl: null, // Will be null until we implement PDF generation
        sentToClient: false,
      },
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      html, // Return HTML so frontend can display it
    });
  } catch (error) {
    console.error("Failed to generate report:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: (error as Error).message },
      { status: 500 }
    );
  }
}
