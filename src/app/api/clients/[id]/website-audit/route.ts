/**
 * Website Audit API — FEAT-024
 *
 * GET  /api/clients/[id]/website-audit        → list audits (most recent first)
 * POST /api/clients/[id]/website-audit        → run a new audit
 * GET  /api/clients/[id]/website-audit/[aid]  → single audit detail
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runWebsiteAudit } from "@/lib/website-audit/auditor";

type Ctx = { params: { id: string } };

// ─── GET — list audits ────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = parseInt(params.id);
  const audits = await prisma.websiteAudit.findMany({
    where: { clientId },
    orderBy: { runAt: "desc" },
    take: 20,
    select: {
      id: true,
      url: true,
      runAt: true,
      scorePerformance: true,
      scoreAccessibility: true,
      scoreSeo: true,
      scoreBestPractices: true,
      ssl: true,
      mobile: true,
      hasSitemap: true,
      hasRobots: true,
      metaTitle: true,
      metaDescription: true,
      h1: true,
      issues: true,
    },
  });

  return NextResponse.json(audits);
}

// ─── POST — run new audit ─────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = parseInt(params.id);

  // Get URL: from request body, or fall back to client's website field
  const body = await req.json().catch(() => ({}));
  let url: string = body.url ?? "";

  if (!url) {
    const client = await prisma.clientProfile.findUnique({
      where: { id: clientId },
      select: { website: true } as any,
    });
    url = (client as any)?.website ?? "";
  }

  if (!url) {
    return NextResponse.json({ error: "No website URL provided or on file for this client." }, { status: 400 });
  }

  // Normalize URL
  if (!url.startsWith("http")) url = "https://" + url;
  try { new URL(url); } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const result = await runWebsiteAudit(url);
    const audit = await prisma.websiteAudit.create({
      data: {
        clientId,
        url,
        scorePerformance: result.scores.performance,
        scoreAccessibility: result.scores.accessibility,
        scoreSeo: result.scores.seo,
        scoreBestPractices: result.scores.bestPractices,
        metaTitle: result.meta.title,
        metaDescription: result.meta.description,
        h1: result.meta.h1,
        canonical: result.meta.canonical,
        hasSitemap: result.meta.hasSitemap,
        hasRobots: result.meta.hasRobots,
        ssl: result.ssl,
        mobile: result.mobile,
        issues: result.issues as any,
        rawJson: result.raw as any,
      },
    });
    return NextResponse.json(audit);
  } catch (err: any) {
    console.error("[website-audit]", err);
    return NextResponse.json({ error: err.message ?? "Audit failed" }, { status: 500 });
  }
}
