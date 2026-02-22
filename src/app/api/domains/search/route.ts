import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { suggestDomains, listOwnedDomains } from "@/lib/enrichment/providers/godaddy/domains";

/**
 * GET /api/domains/search
 *
 * Query params:
 *   q        — keyword query for suggestions (required)
 *   tlds     — comma-separated TLD list (optional, default: com,net,org,io,co)
 *
 * Returns:
 *   { suggestions: DomainSuggestion[], parked: OwnedDomain[] }
 *
 * `parked` = GHM-owned domains with PARKED status — satellite repurposing candidates.
 */
export async function GET(req: NextRequest) {
  try {
    await requirePermission("manage_clients");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ error: "q parameter required" }, { status: 400 });
  }

  const tlds = searchParams.get("tlds")?.split(",").filter(Boolean)
    ?? ["com", "net", "org", "io", "co"];

  // Run suggestions + parked domain fetch in parallel
  const [suggestions, allOwned] = await Promise.all([
    suggestDomains(q, tlds),
    listOwnedDomains("PARKED"),
  ]);

  // Fuzzy-match parked domains against query keywords
  const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const parked = allOwned.filter((d) =>
    terms.some((term) => d.domain.toLowerCase().includes(term))
  );

  return NextResponse.json({ suggestions, parked });
}
