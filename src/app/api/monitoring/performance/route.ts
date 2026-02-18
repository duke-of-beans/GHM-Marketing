import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { performanceMonitor } from "@/lib/monitoring/performance";

/**
 * GET /api/monitoring/performance
 * Get performance metrics and statistics
 * Requires manage_settings permission
 */
export async function GET(req: NextRequest) {
  // Check permission
  const permissionError = await withPermission(req, "manage_settings");
  if (permissionError) return permissionError;

  try {
    const { searchParams } = req.nextUrl;
    const endpoint = searchParams.get("endpoint");
    const minutes = parseInt(searchParams.get("minutes") || "60");

    const stats = performanceMonitor.getStats(endpoint || undefined, minutes);
    const slowQueries = performanceMonitor.getSlowQueries(10, minutes);
    const errors = performanceMonitor.getErrors(minutes);
    const volume = performanceMonitor.getRequestVolume(5, minutes);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        slowQueries,
        errors,
        volume,
      },
    });
  } catch (error) {
    console.error("Failed to fetch performance metrics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
