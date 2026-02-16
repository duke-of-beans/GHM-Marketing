import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMaster } from "@/lib/auth/session";
import { generateReportHTML } from "@/lib/reports/template";

export async function POST(req: NextRequest) {
  try {
    await requireMaster();

    const body = await req.json();
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID required" },
        { status: 400 }
      );
    }

    // Get report from database
    const report = await prisma.clientReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Generate HTML from stored content
    const html = generateReportHTML(report.content);

    return NextResponse.json({ html });
  } catch (error) {
    console.error("Failed to preview report:", error);
    return NextResponse.json(
      { error: "Failed to preview report" },
      { status: 500 }
    );
  }
}
