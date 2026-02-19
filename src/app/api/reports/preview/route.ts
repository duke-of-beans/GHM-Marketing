import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";
import { generateReportHTML } from "@/lib/reports/template";

export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const body = await req.json();
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID required" },
        { status: 400 }
      );
    }

    const report = await prisma.clientReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

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
