import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";
import { generateReportHTML } from "@/lib/reports/template";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const permissionError = await withPermission(req, "manage_clients");
  if (permissionError) return permissionError;

  try {
    const reportId = parseInt(params.id);

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
    console.error("Failed to fetch report HTML:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
