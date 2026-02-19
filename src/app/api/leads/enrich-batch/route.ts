import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enrichLeadsBatch } from "@/lib/enrichment";
import type { SessionUser } from "@/lib/auth/session";
import { isElevated } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (!isElevated(user.role)) {
    return NextResponse.json(
      { success: false, error: "Elevated access required for batch enrichment" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { leadIds, force = false } = body;

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ success: false, error: "leadIds array required" }, { status: 400 });
  }

  if (leadIds.length > 50) {
    return NextResponse.json(
      { success: false, error: "Maximum 50 leads per batch" },
      { status: 400 }
    );
  }

  try {
    const { summary } = await enrichLeadsBatch(leadIds, force);
    return NextResponse.json({ success: true, data: { summary } });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Batch enrichment failed: ${err}` },
      { status: 500 }
    );
  }
}
