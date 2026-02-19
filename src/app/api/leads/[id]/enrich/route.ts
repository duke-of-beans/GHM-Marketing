import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enrichLead, ENRICHMENT_COOLDOWN_DAYS } from "@/lib/enrichment";
import type { SessionUser } from "@/lib/auth/session";
import { territoryFilter } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ success: false, error: "Invalid lead ID" }, { status: 400 });
  }

  const user = session.user as unknown as SessionUser;
  const baseFilter = territoryFilter(user);

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...baseFilter },
    select: { id: true, intelLastUpdated: true },
  });

  if (!lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  // Parse force flag from body (optional)
  let force = false;
  try {
    const body = await request.json().catch(() => ({}));
    force = !!body.force;
  } catch {
    // ignore parse errors
  }

  // Warn caller if re-enriching a fresh lead without forcing
  if (!force && lead.intelLastUpdated) {
    const daysSince = (Date.now() - lead.intelLastUpdated.getTime()) / 86_400_000;
    if (daysSince < ENRICHMENT_COOLDOWN_DAYS) {
      return NextResponse.json({
        success: false,
        error: `Lead was enriched ${Math.floor(daysSince)}d ago. Pass force=true to re-enrich and use API credits.`,
        lastEnrichedAt: lead.intelLastUpdated,
        cooldownDays: ENRICHMENT_COOLDOWN_DAYS,
        code: "RECENTLY_ENRICHED",
      }, { status: 409 });
    }
  }

  try {
    const result = await enrichLead(leadId, true); // force=true since we already checked above
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: `Enrichment failed: ${err}` },
      { status: 500 }
    );
  }
}
