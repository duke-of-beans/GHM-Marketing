import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import {
  getWebPropertyMatrix,
  getAllBuildJobs,
  createWebProperty,
  createBuildJob,
  createComposerPages,
} from "@/lib/db/website-studio";
import type { NewPropertyConfig } from "@/types/website-studio";

// GET /api/website-studio/[clientId]
// Returns matrix + active build queue for the Website Studio tab.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { clientId } = await params;
  const id = parseInt(clientId);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, error: "Invalid clientId" }, { status: 400 });
  }

  try {
    const [matrix, buildJobs] = await Promise.all([
      getWebPropertyMatrix(id),
      getAllBuildJobs(id),
    ]);

    return NextResponse.json({ success: true, data: { matrix, buildJobs } });
  } catch (err) {
    console.error("[website-studio] GET failed", err);
    return NextResponse.json({ success: false, error: "Failed to load Website Studio data" }, { status: 500 });
  }
}

// POST /api/website-studio/[clientId]
// Initiate a new web property + scaffold its build job.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { clientId } = await params;
  const id = parseInt(clientId);
  if (isNaN(id)) {
    return NextResponse.json({ success: false, error: "Invalid clientId" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { tier, brandSegment, targetUrl, voiceProfileSlug, assignedTo } = body;

    if (!tier || !brandSegment || !targetUrl) {
      return NextResponse.json(
        { success: false, error: "tier, brandSegment, and targetUrl are required" },
        { status: 400 }
      );
    }

    if (!["tier1", "tier2", "tier3"].includes(tier)) {
      return NextResponse.json({ success: false, error: "tier must be tier1, tier2, or tier3" }, { status: 400 });
    }

    const config: NewPropertyConfig = {
      clientId: id,
      tier,
      brandSegment,
      targetUrl,
      voiceProfileSlug: voiceProfileSlug ?? null,
      reuseExistingDna: body.reuseExistingDna ?? true,
      assignedTo: assignedTo ?? null,
    };

    const property = await createWebProperty(config);

    // Scaffold the initial build job + page stubs from blueprint template
    const job = await createBuildJob(property.id, { assignedTo });
    const pageTemplates = getTierPageTemplates(tier, brandSegment);
    await createComposerPages(job.id, pageTemplates);

    return NextResponse.json({ success: true, data: { property, job } }, { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A property with this brand/tier combination already exists for this client." },
        { status: 409 }
      );
    }
    console.error("[website-studio] POST failed", err);
    return NextResponse.json({ success: false, error: "Failed to create web property" }, { status: 500 });
  }
}

// ── Page template scaffolds per tier ─────────────────────────────────────────

function getTierPageTemplates(
  tier: string,
  brand: string
): Array<{ slug: string; title: string; filePath: string; pageOrder: number }> {
  const b = brand.toLowerCase().replace(/\s+/g, "-");

  // Tier 1 and 2 share the same structural template
  if (tier === "tier1" || tier === "tier2") {
    return [
      { slug: "index",           title: `${brand} Hub`,              filePath: `index.html`,              pageOrder: 0 },
      { slug: "common-problems", title: `${brand} Common Problems`,  filePath: `common-problems.html`,    pageOrder: 1 },
      { slug: "services",        title: `${brand} Services`,         filePath: `services.html`,           pageOrder: 2 },
      { slug: "why-us",          title: `Why Us for ${brand}`,       filePath: `why-us.html`,             pageOrder: 3 },
      { slug: "faq",             title: `${brand} FAQ`,              filePath: `faq.html`,                pageOrder: 4 },
    ];
  }

  // Tier 3 — independent brand, slightly different page set
  return [
    { slug: "index",    title: `${brand} — Home`,     filePath: `index.html`,    pageOrder: 0 },
    { slug: "about",    title: `About ${brand}`,       filePath: `about.html`,    pageOrder: 1 },
    { slug: "services", title: `${brand} Services`,    filePath: `services.html`, pageOrder: 2 },
    { slug: "contact",  title: `Contact ${brand}`,     filePath: `contact.html`,  pageOrder: 3 },
  ];
}
