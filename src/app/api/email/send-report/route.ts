import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireMaster } from "@/lib/auth/session";
import { sendReportEmail } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  try {
    await requireMaster();

    const { reportId } = await req.json();

    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID required" },
        { status: 400 }
      );
    }

    // Get report with client info
    const report = await prisma.clientReport.findUnique({
      where: { id: reportId },
      include: {
        client: {
          include: {
            lead: {
              select: {
                email: true,
                businessName: true,
              },
            },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!report.client.lead.email) {
      return NextResponse.json(
        { error: "Client has no email address" },
        { status: 400 }
      );
    }

    // Generate report URL (would be actual download/view link in production)
    const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/reports/${reportId}/download`;

    // Send email
    const result = await sendReportEmail({
      to: report.client.lead.email,
      clientName: report.client.lead.businessName,
      reportType: report.type,
      reportUrl,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }

    // Mark report as sent
    await prisma.clientReport.update({
      where: { id: reportId },
      data: {
        sentToClient: true,
      },
    });

    return NextResponse.json({
      success: true,
      emailId: result.id,
      message: "Report email sent successfully",
    });
  } catch (error) {
    console.error("Failed to send report email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: (error as Error).message },
      { status: 500 }
    );
  }
}
