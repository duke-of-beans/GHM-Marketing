/**
 * Cron: Site Health Snapshot
 * /api/cron/site-health — runs weekly (Sunday 5am)
 *
 * For each active client with domains:
 *   1. Calls PageSpeed Insights (mobile + desktop) for each domain
 *   2. Creates SiteHealthSnapshot records with delta vs previous
 *   3. Feeds performance deltas to the alert engine (sourceType: "health")
 *   4. Updates DataSourceStatus for pagespeed provider
 *
 * Rate limiting: 2s pause between domain calls to respect PageSpeed free tier.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { fetchPageSpeedFull } from "@/lib/enrichment/providers/pagespeed";
import { logProviderCall } from "@/lib/enrichment/cost-tracker";
import { recordProviderSuccess, recordProviderFailure } from "@/lib/ops/data-source-monitor";
import { evaluateAlertRules } from "@/lib/ops/alert-engine";

const RATE_LIMIT_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeUrl(domain: string): string {
  return domain.startsWith("http") ? domain : `https://${domain}`;
}

export async function GET(req: Request) {
  // Vercel cron authorization
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // All active clients with at least one domain
    const clients = await prisma.clientProfile.findMany({
      where: { status: "active" },
      select: {
        id: true,
        businessName: true,
        domains: {
          select: { id: true, domain: true, type: true },
        },
      },
    });

    for (const client of clients) {
      if (client.domains.length === 0) {
        skipped++;
        continue;
      }

      // Process primary domain first (type === "primary"), then the rest
      const sorted = [...client.domains].sort((a, b) => {
        if (a.type === "primary" && b.type !== "primary") return -1;
        if (b.type === "primary" && a.type !== "primary") return 1;
        return 0;
      });

      for (const domain of sorted) {
        const success = await processDomain(client.id, domain);
        if (!success) errors++;
        await sleep(RATE_LIMIT_MS);
      }

      processed++;
    }

    return NextResponse.json({
      success: true,
      data: {
        processed,
        skipped,
        errors,
        durationMs: Date.now() - started,
      },
    });
  } catch (err) {
    log.error({ cron: 'site-health', error: err }, 'Fatal site health cron error');
    await recordProviderFailure("pagespeed", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function processDomain(
  clientId: number,
  domain: { id: number; domain: string }
): Promise<boolean> {
  const url = normalizeUrl(domain.domain);
  const t0 = Date.now();

  try {
    // Fetch mobile + desktop in parallel
    const [mobile, desktop] = await Promise.all([
      fetchPageSpeedFull(url, "mobile"),
      fetchPageSpeedFull(url, "desktop"),
    ]);

    const latencyMs = Date.now() - t0;

    if (!mobile && !desktop) {
      await logProviderCall({
        provider: "pagespeed",
        operation: "site_health_scan",
        clientId,
        cacheHit: false,
        costUsd: 0,
        latencyMs,
        success: false,
        errorMsg: "Both mobile and desktop returned null",
      });
      await recordProviderFailure("pagespeed", new Error("Both strategies returned null"));
      return false;
    }

    // Fetch previous snapshot for delta calculation
    const previous = await prisma.siteHealthSnapshot.findFirst({
      where: { domainId: domain.id },
      orderBy: { scanDate: "desc" },
      select: { performanceMobile: true, performanceDesktop: true },
    });

    const snapshot = await prisma.siteHealthSnapshot.create({
      data: {
        clientId,
        domainId: domain.id,
        performanceMobile: mobile?.performance_score ?? null,
        performanceDesktop: desktop?.performance_score ?? null,
        lcp: mobile?.lcp ?? null,
        tbt: mobile?.tbt ?? null,
        cls: mobile?.cls ?? null,
        fcp: mobile?.fcp ?? null,
        seoScore: mobile?.seo_score ?? null,
        accessibilityScore: mobile?.accessibility_score ?? null,
        bestPracticesScore: mobile?.best_practices_score ?? null,
        previousMobile: previous?.performanceMobile ?? null,
        previousDesktop: previous?.performanceDesktop ?? null,
      },
    });

    await logProviderCall({
      provider: "pagespeed",
      operation: "site_health_scan",
      clientId,
      cacheHit: false,
      costUsd: 0,
      latencyMs,
      success: true,
    });

    await recordProviderSuccess("pagespeed", latencyMs);

    // Feed deltas to the alert engine
    const mobileDelta =
      previous?.performanceMobile != null && snapshot.performanceMobile != null
        ? snapshot.performanceMobile - previous.performanceMobile
        : null;

    const desktopDelta =
      previous?.performanceDesktop != null && snapshot.performanceDesktop != null
        ? snapshot.performanceDesktop - previous.performanceDesktop
        : null;

    if (mobileDelta !== null || desktopDelta !== null) {
      await evaluateAlertRules({
        sourceType: "health",
        sourceId: snapshot.id,
        clientId,
        data: {
          snapshotId: snapshot.id,
          domainId: domain.id,
          domain: domain.domain,
          performanceMobile: snapshot.performanceMobile,
          performanceDesktop: snapshot.performanceDesktop,
          mobileDelta,
          desktopDelta,
          mobileDropOver10: mobileDelta !== null && mobileDelta <= -10,
          mobileDropOver20: mobileDelta !== null && mobileDelta <= -20,
          lcp: snapshot.lcp,
          cls: snapshot.cls,
          lcpOver4s: snapshot.lcp !== null && snapshot.lcp > 4000,
          clsOver025: snapshot.cls !== null && snapshot.cls > 0.25,
        },
      });
    }

    return true;
  } catch (err) {
    log.error({ cron: 'site-health', domain: domain.domain, clientId, error: err }, 'Error processing domain');
    await recordProviderFailure("pagespeed", err).catch(() => {});
    await logProviderCall({
      provider: "pagespeed",
      operation: "site_health_scan",
      clientId,
      cacheHit: false,
      costUsd: 0,
      latencyMs: Date.now() - t0,
      success: false,
      errorMsg: err instanceof Error ? err.message : String(err),
    }).catch(() => {});
    return false;
  }
}
