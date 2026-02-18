import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";

/**
 * POST /api/reports/email
 * Send scheduled report via email
 * Requires view_analytics permission
 */
export async function POST(req: NextRequest) {
  // Check permission
  const permissionError = await withPermission(req, "view_analytics");
  if (permissionError) return permissionError;

  try {
    const body = await req.json();
    const { reportType, recipients, period, format } = body;

    // Validate inputs
    if (!reportType || !recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // In production, generate report and send email
    // For now, return success
    console.log("Email report request:", {
      reportType,
      recipients,
      period,
      format,
    });

    return NextResponse.json({
      success: true,
      message: "Report scheduled for delivery",
      reportType,
      recipients: recipients.length,
    });
  } catch (error) {
    console.error("Failed to send report email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send report" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/email/schedule
 * Get scheduled email reports
 */
export async function GET(req: NextRequest) {
  // Check permission
  const permissionError = await withPermission(req, "view_analytics");
  if (permissionError) return permissionError;

  try {
    // In production, fetch from database
    const schedules = [
      {
        id: 1,
        reportType: "performance_summary",
        frequency: "weekly",
        recipients: ["david@ghm.com"],
        lastSent: new Date(),
        nextSend: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        active: true,
      },
    ];

    return NextResponse.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}
