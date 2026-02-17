import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { getAuditLogs, getAuditStats } from "@/lib/audit-log";

/**
 * GET /api/audit-logs
 * Returns audit logs with filters
 * Requires manage_settings permission
 */
export async function GET(req: NextRequest) {
  // Check permission
  const permissionError = await withPermission(req, "manage_settings");
  if (permissionError) return permissionError;

  try {
    const { searchParams } = req.nextUrl;
    
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const getStats = searchParams.get("stats") === "true";

    // If requesting stats
    if (getStats) {
      const stats = await getAuditStats({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });
      
      return NextResponse.json({ success: true, data: stats });
    }

    // Get logs
    const result = await getAuditLogs({
      userId: userId ? parseInt(userId) : undefined,
      action: action as any,
      status: status as any,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit) : 100,
      offset: offset ? parseInt(offset) : 0,
    });

    return NextResponse.json({
      success: true,
      data: result.logs,
      total: result.total,
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
