import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enrichLeadsBatch } from "@/lib/enrichment";
import type { SessionUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "master") {
    return NextResponse.json(
      { success: false, error: "Master access required for batch enrichment" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { leadIds } = body;

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json(
      { success: false, error: "leadIds array required" },
      { status: 400 }
    );
  }

  if (leadIds.length > 50) {
    return NextResponse.json(
      { success: false, error: "Maximum 50 leads per batch" },
      { status: 400 }
    );
  }

  try {
    const results = await enrichLeadsBatch(leadIds);

    const summary = {
      total: results.length,
      successful: results.filter((r) => r.errors.length === 0).length,
      withErrors: results.filter((r) => r.errors.length > 0).length,
      enrichedFields: {
        outscraper: results.filter((r) => r.outscraper !== null).length,
        ahrefs: results.filter((r) => r.ahrefs !== null).length,
        pageSpeed: results.filter((r) => r.pageSpeed !== null).length,
      },
    };

    return NextResponse.json({
      success: true,
      data: { summary, results },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Batch enrichment failed: ${err}` },
      { status: 500 }
    );
  }
}
