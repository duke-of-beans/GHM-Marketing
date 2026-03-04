// scripts/seed-ridgeline.ts
// Sprint 38-40 Track H — Seed Ridgeline Media LLC demo tenant
// Run: npx tsx scripts/seed-ridgeline.ts
// Idempotent — safe to re-run.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const counts = { sites: 0, programs: 0, networks: 0, revenue: 0, briefs: 0, targets: 0, valuations: 0 };

async function upsertSafe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e: any) {
    console.error(`  ⚠ ${label}: ${e.message}`);
    return null;
  }
}

async function main() {
  console.log("Seeding Ridgeline Media LLC...\n");

  // ── TENANT ──
  const tenant = await prisma.tenant.upsert({
    where: { slug: "ridgeline" },
    update: { name: "Ridgeline Media LLC", companyName: "Ridgeline Media LLC", verticalType: "affiliate_portfolio", config: { verticalType: "affiliate_portfolio", timezone: "America/Denver" }, active: true },
    create: { slug: "ridgeline", name: "Ridgeline Media LLC", companyName: "Ridgeline Media LLC", verticalType: "affiliate_portfolio", config: { verticalType: "affiliate_portfolio", timezone: "America/Denver" }, fromEmail: "noreply@ridgelinemedia.co", fromName: "Ridgeline Media", supportEmail: "hello@ridgelinemedia.co", dashboardUrl: "https://ridgeline.covos.app", active: true },
  });
  const tid = tenant.id;
  console.log(`✅ Tenant: ridgeline (id=${tid})\n`);

  // ── SITES ──
  const SITES = [
    { slug: "trailgearreviews", domain: "trailgearreviews.com", displayName: "Trail Gear Reviews", niche: "Outdoor gear", status: "ACTIVE" as const, monthlyRevenueCurrent: 4800, monthlyTrafficCurrent: 68000, domainAuthority: 42, monetizationMix: "both" },
    { slug: "peakpackinglist", domain: "peakpackinglist.com", displayName: "Peak Packing List", niche: "Outdoor gear", status: "ACTIVE" as const, monthlyRevenueCurrent: 3200, monthlyTrafficCurrent: 41000, domainAuthority: 38, monetizationMix: "both" },
    { slug: "budgetbackpacker", domain: "budgetbackpacker.net", displayName: "Budget Backpacker", niche: "Outdoor gear", status: "ACTIVE" as const, monthlyRevenueCurrent: 1400, monthlyTrafficCurrent: 22000, domainAuthority: 29, monetizationMix: "both" },
    { slug: "firsttimeinvestor", domain: "firsttimeinvestor.io", displayName: "First Time Investor", niche: "Personal finance", status: "ACTIVE" as const, monthlyRevenueCurrent: 2100, monthlyTrafficCurrent: 18000, domainAuthority: 31, monetizationMix: "both" },
    { slug: "simplesavingsguide", domain: "simplesavingsguide.com", displayName: "Simple Savings Guide", niche: "Personal finance", status: "ACTIVE" as const, monthlyRevenueCurrent: 890, monthlyTrafficCurrent: 12000, domainAuthority: 24, monetizationMix: "both" },
    { slug: "mortgagecalchelp", domain: "mortgagecalchelp.net", displayName: "Mortgage Calc Help", niche: "Personal finance", status: "ACTIVE" as const, monthlyRevenueCurrent: 1650, monthlyTrafficCurrent: 15500, domainAuthority: 27, monetizationMix: "both" },
    { slug: "weekendrenovator", domain: "weekendrenovator.com", displayName: "Weekend Renovator", niche: "Home improvement", status: "ACTIVE" as const, monthlyRevenueCurrent: 640, monthlyTrafficCurrent: 9200, domainAuthority: 21, monetizationMix: "both" },
    { slug: "tiledaddy", domain: "tiledaddy.com", displayName: "Tile Daddy", niche: "Home improvement", status: "DORMANT" as const, monthlyRevenueCurrent: 120, monthlyTrafficCurrent: 2100, domainAuthority: 18, monetizationMix: "affiliate" },
    { slug: "drywallpro", domain: "drywallpro.net", displayName: "Drywall Pro", niche: "Home improvement", status: "DORMANT" as const, monthlyRevenueCurrent: 0, monthlyTrafficCurrent: 800, domainAuthority: 14, monetizationMix: "affiliate" },
    { slug: "pawsandplans", domain: "pawsandplans.com", displayName: "Paws & Plans", niche: "Pet care", status: "ACTIVE" as const, monthlyRevenueCurrent: 1780, monthlyTrafficCurrent: 24000, domainAuthority: 33, monetizationMix: "both" },
    { slug: "seniorpetguide", domain: "seniorpetguide.com", displayName: "Senior Pet Guide", niche: "Pet care", status: "FOR_SALE" as const, monthlyRevenueCurrent: 2400, monthlyTrafficCurrent: 31000, domainAuthority: 36, monetizationMix: "both" },
    { slug: "smalldogworld", domain: "smalldogworld.net", displayName: "Small Dog World", niche: "Pet care", status: "SOLD" as const, monthlyRevenueCurrent: 0, monthlyTrafficCurrent: 0, domainAuthority: 34, monetizationMix: "both", notes: "Sold via Motion Invest, March 2025" },
  ];

  const siteMap = new Map<string, number>();
  for (const s of SITES) {
    const site = await upsertSafe(`Site:${s.slug}`, () =>
      prisma.site.upsert({
        where: { tenantId_slug: { tenantId: tid, slug: s.slug } },
        update: { domain: s.domain, displayName: s.displayName, niche: s.niche, status: s.status, monthlyRevenueCurrent: s.monthlyRevenueCurrent, monthlyTrafficCurrent: s.monthlyTrafficCurrent, domainAuthority: s.domainAuthority, monetizationMix: s.monetizationMix, notes: s.notes ?? null },
        create: { tenantId: tid, slug: s.slug, domain: s.domain, displayName: s.displayName, niche: s.niche, status: s.status, monthlyRevenueCurrent: s.monthlyRevenueCurrent, monthlyTrafficCurrent: s.monthlyTrafficCurrent, domainAuthority: s.domainAuthority, monetizationMix: s.monetizationMix, notes: s.notes ?? null },
      })
    );
    if (site) { siteMap.set(s.slug, site.id); counts.sites++; }
  }
  console.log(`✅ Sites: ${counts.sites}\n`);

  function sid(slug: string): number { return siteMap.get(slug)!; }

  // ── AFFILIATE PROGRAMS ──
  // No unique constraint, so findFirst + create/update
  async function upsertProgram(siteSlug: string, networkName: string, merchantName: string, data: Record<string, any>) {
    const siteId = sid(siteSlug);
    const existing = await prisma.affiliateProgram.findFirst({ where: { tenantId: tid, siteId, networkName, merchantName } });
    if (existing) {
      await prisma.affiliateProgram.update({ where: { id: existing.id }, data });
    } else {
      await prisma.affiliateProgram.create({ data: { tenantId: tid, siteId, networkName, merchantName, ...data } });
    }
    counts.programs++;
  }

  const PROGRAMS = [
    ["trailgearreviews", "Amazon", "Amazon Associates", { commissionRate: 3, commissionType: "percent", cookieWindowDays: 1, applicationStatus: "APPROVED", lifetimeEarnings: 18400 }],
    ["trailgearreviews", "ShareASale", "REI Affiliate", { commissionRate: 5, commissionType: "percent", cookieWindowDays: 30, applicationStatus: "APPROVED", lifetimeEarnings: 6200 }],
    ["trailgearreviews", "CJ", "Backcountry", { commissionRate: 6, commissionType: "percent", cookieWindowDays: 45, applicationStatus: "APPROVED", lifetimeEarnings: 4100 }],
    ["trailgearreviews", "Impact", "Patagonia", { commissionRate: 8, commissionType: "percent", cookieWindowDays: 60, applicationStatus: "PENDING", lifetimeEarnings: 0 }],
    ["peakpackinglist", "Amazon", "Amazon Associates", { commissionRate: 3, commissionType: "percent", cookieWindowDays: 1, applicationStatus: "APPROVED", lifetimeEarnings: 9800 }],
    ["peakpackinglist", "ShareASale", "REI Affiliate", { commissionRate: 5, commissionType: "percent", cookieWindowDays: 30, applicationStatus: "APPROVED", lifetimeEarnings: 3400 }],
    ["budgetbackpacker", "Amazon", "Amazon Associates", { commissionRate: 3, commissionType: "percent", cookieWindowDays: 1, applicationStatus: "APPROVED", lifetimeEarnings: 4200 }],
    ["budgetbackpacker", "Impact", "Osprey", { commissionRate: 7, commissionType: "percent", cookieWindowDays: 45, applicationStatus: "APPROVED", lifetimeEarnings: 1100 }],
    ["firsttimeinvestor", "Impact", "Personal Capital", { commissionRate: 100, commissionType: "flat", applicationStatus: "APPROVED", lifetimeEarnings: 8400 }],
    ["firsttimeinvestor", "CJ", "Betterment", { commissionRate: 25, commissionType: "flat", applicationStatus: "APPROVED", lifetimeEarnings: 3200 }],
    ["firsttimeinvestor", "Impact", "M1 Finance", { commissionRate: 30, commissionType: "flat", applicationStatus: "PENDING", lifetimeEarnings: 0 }],
    ["simplesavingsguide", "CJ", "Betterment", { commissionRate: 25, commissionType: "flat", applicationStatus: "APPROVED", lifetimeEarnings: 1800 }],
    ["simplesavingsguide", "Impact", "Marcus by Goldman", { commissionRate: 50, commissionType: "flat", applicationStatus: "APPROVED", lifetimeEarnings: 900 }],
    ["mortgagecalchelp", "CJ", "LendingTree", { commissionRate: 35, commissionType: "flat", applicationStatus: "APPROVED", lifetimeEarnings: 5600 }],
    ["mortgagecalchelp", "Impact", "Rocket Mortgage", { commissionRate: 40, commissionType: "flat", applicationStatus: "APPROVED", lifetimeEarnings: 2900 }],
    ["weekendrenovator", "Amazon", "Amazon Associates", { commissionRate: 3, commissionType: "percent", cookieWindowDays: 1, applicationStatus: "APPROVED", lifetimeEarnings: 2800 }],
    ["weekendrenovator", "Impact", "Home Depot", { commissionRate: 2, commissionType: "percent", cookieWindowDays: 1, applicationStatus: "APPROVED", lifetimeEarnings: 800 }],
    ["pawsandplans", "ShareASale", "Chewy", { commissionRate: 4, commissionType: "percent", cookieWindowDays: 15, applicationStatus: "APPROVED", lifetimeEarnings: 4200 }],
    ["pawsandplans", "Amazon", "Amazon Associates", { commissionRate: 3, commissionType: "percent", cookieWindowDays: 1, applicationStatus: "APPROVED", lifetimeEarnings: 2100 }],
    ["pawsandplans", "Impact", "Ollie Pet Food", { commissionRate: 8, commissionType: "percent", cookieWindowDays: 30, applicationStatus: "APPROVED", lifetimeEarnings: 1400 }],
    ["seniorpetguide", "ShareASale", "Chewy", { commissionRate: 4, commissionType: "percent", cookieWindowDays: 15, applicationStatus: "APPROVED", lifetimeEarnings: 7800 }],
    ["seniorpetguide", "Amazon", "Amazon Associates", { commissionRate: 3, commissionType: "percent", cookieWindowDays: 1, applicationStatus: "APPROVED", lifetimeEarnings: 3200 }],
    ["seniorpetguide", "Impact", "Hill's Pet Nutrition", { commissionRate: 6, commissionType: "percent", cookieWindowDays: 30, applicationStatus: "APPROVED", lifetimeEarnings: 2100 }],
  ] as const;

  for (const [slug, net, merch, data] of PROGRAMS) {
    await upsertSafe(`Program:${slug}/${merch}`, () => upsertProgram(slug, net, merch, data as any));
  }
  console.log(`✅ Programs: ${counts.programs}\n`);

  // ── DISPLAY AD NETWORKS ──
  async function upsertNetwork(siteSlug: string, networkName: string, data: Record<string, any>) {
    const siteId = sid(siteSlug);
    const existing = await prisma.displayAdNetwork.findFirst({ where: { tenantId: tid, siteId, networkName } });
    if (existing) {
      await prisma.displayAdNetwork.update({ where: { id: existing.id }, data });
    } else {
      await prisma.displayAdNetwork.create({ data: { tenantId: tid, siteId, networkName, ...data } });
    }
    counts.networks++;
  }

  const NETWORKS = [
    ["trailgearreviews", "Mediavine", { status: "APPROVED", monthlySessionsRequired: 50000, currentMonthlySessions: 68000, currentRPM: 28.40 }],
    ["peakpackinglist", "Mediavine", { status: "APPROVED", monthlySessionsRequired: 50000, currentMonthlySessions: 41000, currentRPM: 24.80 }],
    ["budgetbackpacker", "Ezoic", { status: "APPROVED", currentMonthlySessions: 22000, currentRPM: 11.20 }],
    ["firsttimeinvestor", "Ezoic", { status: "APPROVED", currentMonthlySessions: 18000, currentRPM: 14.60 }],
    ["mortgagecalchelp", "Ezoic", { status: "APPROVED", currentMonthlySessions: 15500, currentRPM: 13.80 }],
    ["pawsandplans", "Ezoic", { status: "APPROVED", currentMonthlySessions: 24000, currentRPM: 12.40 }],
    ["weekendrenovator", "Mediavine", { status: "NOT_QUALIFIED", monthlySessionsRequired: 50000, currentMonthlySessions: 9200 }],
    ["seniorpetguide", "Mediavine", { status: "NOT_QUALIFIED", monthlySessionsRequired: 50000, currentMonthlySessions: 31000 }],
  ] as const;

  for (const [slug, net, data] of NETWORKS) {
    await upsertSafe(`Network:${slug}/${net}`, () => upsertNetwork(slug, net, data as any));
  }
  console.log(`✅ Networks: ${counts.networks}\n`);

  // ── REVENUE ENTRIES (12 months per site) ──
  const now = new Date();
  function monthsAgo(n: number): { month: number; year: number } {
    const d = new Date(now.getFullYear(), now.getMonth() - n, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  }

  function lerp(start: number, end: number, t: number): number {
    return Math.round(start + (end - start) * t);
  }

  type RevSplit = { sourceType: "DISPLAY" | "AFFILIATE"; sourceName: string; pct: number };
  type RevCurve = { slug: string; startTotal: number; endTotal: number; splits: RevSplit[] };

  const CURVES: RevCurve[] = [
    { slug: "trailgearreviews", startTotal: 2100, endTotal: 4800, splits: [
      { sourceType: "DISPLAY", sourceName: "Mediavine", pct: 0.6 },
      { sourceType: "AFFILIATE", sourceName: "Amazon Associates", pct: 0.4 },
    ]},
    { slug: "peakpackinglist", startTotal: 1400, endTotal: 3200, splits: [
      { sourceType: "DISPLAY", sourceName: "Mediavine", pct: 0.6 },
      { sourceType: "AFFILIATE", sourceName: "Amazon Associates", pct: 0.4 },
    ]},
    { slug: "budgetbackpacker", startTotal: 600, endTotal: 1400, splits: [
      { sourceType: "DISPLAY", sourceName: "Ezoic", pct: 0.4 },
      { sourceType: "AFFILIATE", sourceName: "Amazon Associates", pct: 0.6 },
    ]},
    { slug: "firsttimeinvestor", startTotal: 900, endTotal: 2100, splits: [
      { sourceType: "DISPLAY", sourceName: "Ezoic", pct: 0.4 },
      { sourceType: "AFFILIATE", sourceName: "Personal Capital", pct: 0.4 },
      { sourceType: "AFFILIATE", sourceName: "Betterment", pct: 0.2 },
    ]},
    { slug: "simplesavingsguide", startTotal: 400, endTotal: 890, splits: [
      { sourceType: "AFFILIATE", sourceName: "Betterment", pct: 0.6 },
      { sourceType: "AFFILIATE", sourceName: "Marcus by Goldman", pct: 0.4 },
    ]},
    { slug: "mortgagecalchelp", startTotal: 700, endTotal: 1650, splits: [
      { sourceType: "DISPLAY", sourceName: "Ezoic", pct: 0.4 },
      { sourceType: "AFFILIATE", sourceName: "LendingTree", pct: 0.4 },
      { sourceType: "AFFILIATE", sourceName: "Rocket Mortgage", pct: 0.2 },
    ]},
    { slug: "weekendrenovator", startTotal: 300, endTotal: 640, splits: [
      { sourceType: "AFFILIATE", sourceName: "Amazon Associates", pct: 0.6 },
      { sourceType: "AFFILIATE", sourceName: "Home Depot", pct: 0.4 },
    ]},
    { slug: "tiledaddy", startTotal: 130, endTotal: 120, splits: [
      { sourceType: "AFFILIATE", sourceName: "Amazon Associates", pct: 1.0 },
    ]},
    { slug: "drywallpro", startTotal: 60, endTotal: 0, splits: [
      { sourceType: "AFFILIATE", sourceName: "Amazon Associates", pct: 1.0 },
    ]},
    { slug: "pawsandplans", startTotal: 700, endTotal: 1780, splits: [
      { sourceType: "DISPLAY", sourceName: "Ezoic", pct: 0.4 },
      { sourceType: "AFFILIATE", sourceName: "Chewy", pct: 0.3 },
      { sourceType: "AFFILIATE", sourceName: "Amazon Associates", pct: 0.3 },
    ]},
    { slug: "seniorpetguide", startTotal: 1600, endTotal: 2400, splits: [
      { sourceType: "AFFILIATE", sourceName: "Chewy", pct: 0.5 },
      { sourceType: "AFFILIATE", sourceName: "Amazon Associates", pct: 0.3 },
      { sourceType: "AFFILIATE", sourceName: "Hill's Pet Nutrition", pct: 0.2 },
    ]},
  ];

  for (const curve of CURVES) {
    const siteId = sid(curve.slug);
    const siteTraffic = SITES.find(s => s.slug === curve.slug)?.monthlyTrafficCurrent ?? 10000;
    for (let i = 12; i >= 1; i--) {
      const { month, year } = monthsAgo(i);
      const t = (12 - i) / 11; // 0 at oldest, 1 at newest
      const totalRev = lerp(curve.startTotal, curve.endTotal, t);
      const monthTraffic = lerp(Math.round(siteTraffic * 0.6), siteTraffic, t);

      for (const split of curve.splits) {
        const rev = Math.round(totalRev * split.pct);
        const sessions = Math.round(monthTraffic * split.pct);
        const rpm = sessions > 0 ? (rev / sessions) * 1000 : null;
        const clicks = split.sourceType === "AFFILIATE" ? Math.round(sessions * 0.04) : null;
        const epc = clicks && clicks > 0 ? rev / clicks : null;

        await upsertSafe(`Rev:${curve.slug}/${month}/${year}/${split.sourceName}`, async () => {
          // Upsert on unique constraint
          const existing = await prisma.revenueEntry.findFirst({
            where: { tenantId: tid, siteId, month, year, sourceType: split.sourceType, sourceName: split.sourceName },
          });
          if (existing) {
            await prisma.revenueEntry.update({ where: { id: existing.id }, data: { revenue: rev, sessions, rpm, clicks, epc } });
          } else {
            await prisma.revenueEntry.create({ data: { tenantId: tid, siteId, month, year, sourceType: split.sourceType, sourceName: split.sourceName, revenue: rev, sessions, rpm, clicks, epc } });
          }
          counts.revenue++;
        });
      }
    }
  }
  console.log(`✅ Revenue entries: ${counts.revenue}\n`);

  // ── ACQUISITION TARGETS ──
  const TARGETS = [
    { domain: "hikingbootsexpert.com", stage: "RESEARCHING", niche: "Outdoor gear", currentMonthlyTraffic: 14000, currentMonthlyRevenue: 800, domainAuthority: 28, source: "Expired domain auction" },
    { domain: "campingchecklist.org", stage: "DUE_DILIGENCE", niche: "Outdoor gear", askingPrice: 28000, currentMonthlyTraffic: 22000, currentMonthlyRevenue: 1200, domainAuthority: 31, broker: "Motion Invest" },
    { domain: "budgetinvesting101.com", stage: "NEGOTIATING", niche: "Personal finance", askingPrice: 45000, offeredPrice: 38000, currentMonthlyTraffic: 19000, currentMonthlyRevenue: 1600, domainAuthority: 34, broker: "Empire Flippers" },
    { domain: "homepaintingguide.net", stage: "RESEARCHING", niche: "Home improvement", domainAuthority: 22, domainAge: 8, source: "Expired domain — GoDaddy Auctions", dueDiligenceNotes: "Aged domain, clean link profile, no content yet" },
    { domain: "puppytrainingfirst.com", stage: "DUE_DILIGENCE", niche: "Pet care", askingPrice: 15000, currentMonthlyTraffic: 8000, currentMonthlyRevenue: 420, domainAuthority: 26, broker: "Flippa" },
    { domain: "gardeningbasics.net", stage: "PASSED", niche: "Home improvement", askingPrice: 55000, currentMonthlyTraffic: 28000, currentMonthlyRevenue: 1400, domainAuthority: 38, decisionNotes: "Revenue multiple too high at 39x. Passed." },
  ];

  for (const t of TARGETS) {
    await upsertSafe(`Target:${t.domain}`, async () => {
      const existing = await prisma.acquisitionTarget.findFirst({ where: { tenantId: tid, domain: t.domain } });
      if (existing) {
        await prisma.acquisitionTarget.update({ where: { id: existing.id }, data: t });
      } else {
        await prisma.acquisitionTarget.create({ data: { tenantId: tid, ...t } });
      }
      counts.targets++;
    });
  }
  console.log(`✅ Acquisition targets: ${counts.targets}\n`);

  // ── AFFILIATE CONTENT BRIEFS (46 total) ──
  type BriefData = {
    siteSlug: string; targetKeyword: string; contentType: string; status: string;
    assignedWriterName?: string; refreshDue?: boolean;
    currentRankingPosition?: number; peakRankingPosition?: number;
    currentMonthlyTraffic?: number; attributedMonthlyRevenue?: number;
    publishedUrl?: string; publishedDate?: Date; wordCountTarget?: number;
  };

  function pubDate(daysAgo: number): Date {
    return new Date(Date.now() - daysAgo * 86400000);
  }

  const BRIEFS: BriefData[] = [
    // OUTDOOR — Published + refreshDue (2)
    { siteSlug: "trailgearreviews", targetKeyword: "osprey atmos vs stratos", contentType: "COMPARISON", status: "PUBLISHED", refreshDue: true, peakRankingPosition: 1, currentRankingPosition: 9, currentMonthlyTraffic: 800, attributedMonthlyRevenue: 120, publishedDate: pubDate(180), publishedUrl: "https://trailgearreviews.com/osprey-atmos-vs-stratos/", wordCountTarget: 3000, assignedWriterName: "Jake Turner" },
    { siteSlug: "peakpackinglist", targetKeyword: "best trekking pole brands", contentType: "LISTICLE", status: "PUBLISHED", refreshDue: true, peakRankingPosition: 2, currentRankingPosition: 8, currentMonthlyTraffic: 600, attributedMonthlyRevenue: 80, publishedDate: pubDate(210), publishedUrl: "https://peakpackinglist.com/best-trekking-pole-brands/", wordCountTarget: 2500, assignedWriterName: "Jake Turner" },
    // OUTDOOR — Published healthy (5)
    { siteSlug: "trailgearreviews", targetKeyword: "best trekking poles 2025", contentType: "LISTICLE", status: "PUBLISHED", currentRankingPosition: 3, peakRankingPosition: 3, currentMonthlyTraffic: 2400, attributedMonthlyRevenue: 380, publishedDate: pubDate(60), publishedUrl: "https://trailgearreviews.com/best-trekking-poles/", wordCountTarget: 3500, assignedWriterName: "Jake Turner" },
    { siteSlug: "trailgearreviews", targetKeyword: "ultralight backpacking gear", contentType: "ARTICLE", status: "PUBLISHED", currentRankingPosition: 7, peakRankingPosition: 5, currentMonthlyTraffic: 1800, attributedMonthlyRevenue: 290, publishedDate: pubDate(90), publishedUrl: "https://trailgearreviews.com/ultralight-backpacking-gear/", wordCountTarget: 4000, assignedWriterName: "Maria Gutierrez" },
    { siteSlug: "trailgearreviews", targetKeyword: "best hiking boots for wide feet", contentType: "LISTICLE", status: "PUBLISHED", currentRankingPosition: 4, peakRankingPosition: 4, currentMonthlyTraffic: 1200, attributedMonthlyRevenue: 190, publishedDate: pubDate(120), publishedUrl: "https://trailgearreviews.com/hiking-boots-wide-feet/", wordCountTarget: 2800, assignedWriterName: "Jake Turner" },
    { siteSlug: "peakpackinglist", targetKeyword: "lightweight sleeping bag comparison", contentType: "COMPARISON", status: "PUBLISHED", currentRankingPosition: 5, peakRankingPosition: 5, currentMonthlyTraffic: 900, attributedMonthlyRevenue: 140, publishedDate: pubDate(75), publishedUrl: "https://peakpackinglist.com/lightweight-sleeping-bags/", wordCountTarget: 3000, assignedWriterName: "Maria Gutierrez" },
    { siteSlug: "budgetbackpacker", targetKeyword: "best budget backpacking tent", contentType: "LISTICLE", status: "PUBLISHED", currentRankingPosition: 6, peakRankingPosition: 4, currentMonthlyTraffic: 700, attributedMonthlyRevenue: 90, publishedDate: pubDate(100), publishedUrl: "https://budgetbackpacker.net/best-budget-tent/", wordCountTarget: 2500, assignedWriterName: "Jake Turner" },
    // OUTDOOR — Other statuses (5)
    { siteSlug: "trailgearreviews", targetKeyword: "how to pack a backpacking pack", contentType: "HOW_TO", status: "REVIEW", wordCountTarget: 2000, assignedWriterName: "Maria Gutierrez" },
    { siteSlug: "peakpackinglist", targetKeyword: "trekking pole height guide", contentType: "HOW_TO", status: "IN_PROGRESS", wordCountTarget: 1500, assignedWriterName: "Jake Turner" },
    { siteSlug: "trailgearreviews", targetKeyword: "best trail running shoes 2025", contentType: "LISTICLE", status: "BRIEFED", wordCountTarget: 3000 },
    { siteSlug: "budgetbackpacker", targetKeyword: "backpacking food ideas", contentType: "ARTICLE", status: "IN_PROGRESS", wordCountTarget: 2000, assignedWriterName: "Maria Gutierrez" },
    { siteSlug: "peakpackinglist", targetKeyword: "osprey aura review", contentType: "REVIEW", status: "REVIEW", wordCountTarget: 2500, assignedWriterName: "Jake Turner" },
  ];

  // PERSONAL FINANCE briefs
  const FINANCE_BRIEFS: BriefData[] = [
    // Published + refreshDue (2)
    { siteSlug: "firsttimeinvestor", targetKeyword: "betterment vs wealthfront", contentType: "COMPARISON", status: "PUBLISHED", refreshDue: true, peakRankingPosition: 2, currentRankingPosition: 7, currentMonthlyTraffic: 1200, attributedMonthlyRevenue: 180, publishedDate: pubDate(200), publishedUrl: "https://firsttimeinvestor.io/betterment-vs-wealthfront/", wordCountTarget: 3500, assignedWriterName: "Sarah Chen" },
    { siteSlug: "firsttimeinvestor", targetKeyword: "roth ira income limits 2025", contentType: "ARTICLE", status: "PUBLISHED", refreshDue: true, peakRankingPosition: 3, currentRankingPosition: 10, currentMonthlyTraffic: 800, attributedMonthlyRevenue: 110, publishedDate: pubDate(240), publishedUrl: "https://firsttimeinvestor.io/roth-ira-income-limits/", wordCountTarget: 2000, assignedWriterName: "Sarah Chen" },
    // Published healthy (4)
    { siteSlug: "firsttimeinvestor", targetKeyword: "how to start investing with $1000", contentType: "HOW_TO", status: "PUBLISHED", currentRankingPosition: 4, peakRankingPosition: 4, currentMonthlyTraffic: 2100, attributedMonthlyRevenue: 320, publishedDate: pubDate(45), publishedUrl: "https://firsttimeinvestor.io/start-investing-1000/", wordCountTarget: 3000, assignedWriterName: "Sarah Chen" },
    { siteSlug: "firsttimeinvestor", targetKeyword: "index fund vs etf for beginners", contentType: "COMPARISON", status: "PUBLISHED", currentRankingPosition: 6, peakRankingPosition: 5, currentMonthlyTraffic: 1400, attributedMonthlyRevenue: 210, publishedDate: pubDate(80), publishedUrl: "https://firsttimeinvestor.io/index-fund-vs-etf/", wordCountTarget: 2800, assignedWriterName: "Sarah Chen" },
    { siteSlug: "simplesavingsguide", targetKeyword: "best high yield savings account 2025", contentType: "LISTICLE", status: "PUBLISHED", currentRankingPosition: 5, peakRankingPosition: 5, currentMonthlyTraffic: 900, attributedMonthlyRevenue: 130, publishedDate: pubDate(55), publishedUrl: "https://simplesavingsguide.com/best-hysa/", wordCountTarget: 2500, assignedWriterName: "Tom Bradley" },
    { siteSlug: "mortgagecalchelp", targetKeyword: "how much house can i afford", contentType: "HOW_TO", status: "PUBLISHED", currentRankingPosition: 3, peakRankingPosition: 3, currentMonthlyTraffic: 1600, attributedMonthlyRevenue: 240, publishedDate: pubDate(40), publishedUrl: "https://mortgagecalchelp.net/how-much-house/", wordCountTarget: 3000, assignedWriterName: "Tom Bradley" },
    // Other statuses (5)
    { siteSlug: "firsttimeinvestor", targetKeyword: "401k contribution limits 2025", contentType: "ARTICLE", status: "REVIEW", wordCountTarget: 1800, assignedWriterName: "Sarah Chen" },
    { siteSlug: "simplesavingsguide", targetKeyword: "what is a brokerage account", contentType: "ARTICLE", status: "IN_PROGRESS", wordCountTarget: 2000, assignedWriterName: "Tom Bradley" },
    { siteSlug: "firsttimeinvestor", targetKeyword: "best robo advisors", contentType: "LISTICLE", status: "BRIEFED", wordCountTarget: 3500 },
    { siteSlug: "mortgagecalchelp", targetKeyword: "mortgage refinance calculator", contentType: "HOW_TO", status: "REVIEW", wordCountTarget: 2000, assignedWriterName: "Tom Bradley" },
    { siteSlug: "simplesavingsguide", targetKeyword: "how to read a credit report", contentType: "HOW_TO", status: "BRIEFED", wordCountTarget: 2000 },
  ];

  // HOME IMPROVEMENT briefs
  const HOME_BRIEFS: BriefData[] = [
    // Published + refreshDue (1)
    { siteSlug: "tiledaddy", targetKeyword: "best tile saw for diy", contentType: "LISTICLE", status: "PUBLISHED", refreshDue: true, peakRankingPosition: 2, currentRankingPosition: 11, currentMonthlyTraffic: 400, attributedMonthlyRevenue: 40, publishedDate: pubDate(260), publishedUrl: "https://tiledaddy.com/best-tile-saw-diy/", wordCountTarget: 2500, assignedWriterName: "Mike Daniels" },
    // Published healthy (3)
    { siteSlug: "tiledaddy", targetKeyword: "how to tile a bathroom floor", contentType: "HOW_TO", status: "PUBLISHED", currentRankingPosition: 4, peakRankingPosition: 4, currentMonthlyTraffic: 1100, attributedMonthlyRevenue: 90, publishedDate: pubDate(90), publishedUrl: "https://tiledaddy.com/tile-bathroom-floor/", wordCountTarget: 3000, assignedWriterName: "Mike Daniels" },
    { siteSlug: "weekendrenovator", targetKeyword: "weekend deck build cost", contentType: "ARTICLE", status: "PUBLISHED", currentRankingPosition: 5, peakRankingPosition: 5, currentMonthlyTraffic: 800, attributedMonthlyRevenue: 70, publishedDate: pubDate(70), publishedUrl: "https://weekendrenovator.com/deck-build-cost/", wordCountTarget: 2000, assignedWriterName: "Mike Daniels" },
    { siteSlug: "weekendrenovator", targetKeyword: "drywall patching guide", contentType: "HOW_TO", status: "PUBLISHED", currentRankingPosition: 7, peakRankingPosition: 6, currentMonthlyTraffic: 600, attributedMonthlyRevenue: 50, publishedDate: pubDate(110), publishedUrl: "https://weekendrenovator.com/drywall-patching/", wordCountTarget: 1800, assignedWriterName: "Mike Daniels" },
    // Other statuses (3)
    { siteSlug: "tiledaddy", targetKeyword: "ceramic vs porcelain tile", contentType: "COMPARISON", status: "IN_PROGRESS", wordCountTarget: 2000, assignedWriterName: "Mike Daniels" },
    { siteSlug: "tiledaddy", targetKeyword: "how to grout tile", contentType: "HOW_TO", status: "REVIEW", wordCountTarget: 1500, assignedWriterName: "Mike Daniels" },
    { siteSlug: "weekendrenovator", targetKeyword: "deck stain comparison", contentType: "COMPARISON", status: "BRIEFED", wordCountTarget: 2500 },
  ];

  // PET CARE briefs
  const PET_BRIEFS: BriefData[] = [
    // Published + refreshDue (3)
    { siteSlug: "seniorpetguide", targetKeyword: "best dog food for senior dogs", contentType: "LISTICLE", status: "PUBLISHED", refreshDue: true, peakRankingPosition: 1, currentRankingPosition: 6, currentMonthlyTraffic: 1800, attributedMonthlyRevenue: 260, publishedDate: pubDate(190), publishedUrl: "https://seniorpetguide.com/best-dog-food-senior/", wordCountTarget: 4000, assignedWriterName: "Lisa Park" },
    { siteSlug: "seniorpetguide", targetKeyword: "senior dog joint supplements", contentType: "LISTICLE", status: "PUBLISHED", refreshDue: true, peakRankingPosition: 2, currentRankingPosition: 8, currentMonthlyTraffic: 1100, attributedMonthlyRevenue: 160, publishedDate: pubDate(220), publishedUrl: "https://seniorpetguide.com/joint-supplements/", wordCountTarget: 3000, assignedWriterName: "Lisa Park" },
    { siteSlug: "seniorpetguide", targetKeyword: "how often to walk a 10 year old dog", contentType: "ARTICLE", status: "PUBLISHED", refreshDue: true, peakRankingPosition: 3, currentRankingPosition: 9, currentMonthlyTraffic: 700, attributedMonthlyRevenue: 90, publishedDate: pubDate(250), publishedUrl: "https://seniorpetguide.com/walking-senior-dog/", wordCountTarget: 1800, assignedWriterName: "Lisa Park" },
    // Published healthy (4)
    { siteSlug: "pawsandplans", targetKeyword: "small dog apartment guide", contentType: "ARTICLE", status: "PUBLISHED", currentRankingPosition: 4, peakRankingPosition: 4, currentMonthlyTraffic: 1400, attributedMonthlyRevenue: 210, publishedDate: pubDate(50), publishedUrl: "https://pawsandplans.com/small-dog-apartment/", wordCountTarget: 2500, assignedWriterName: "Lisa Park" },
    { siteSlug: "pawsandplans", targetKeyword: "puppy vs adult food transition", contentType: "HOW_TO", status: "PUBLISHED", currentRankingPosition: 6, peakRankingPosition: 6, currentMonthlyTraffic: 900, attributedMonthlyRevenue: 130, publishedDate: pubDate(85), publishedUrl: "https://pawsandplans.com/puppy-adult-food-transition/", wordCountTarget: 2000, assignedWriterName: "Lisa Park" },
    { siteSlug: "pawsandplans", targetKeyword: "best dog food for small breeds", contentType: "LISTICLE", status: "PUBLISHED", currentRankingPosition: 5, peakRankingPosition: 5, currentMonthlyTraffic: 1200, attributedMonthlyRevenue: 180, publishedDate: pubDate(65), publishedUrl: "https://pawsandplans.com/best-dog-food-small-breeds/", wordCountTarget: 3000, assignedWriterName: "Lisa Park" },
    { siteSlug: "seniorpetguide", targetKeyword: "dog supplements for joint health", contentType: "ARTICLE", status: "PUBLISHED", currentRankingPosition: 3, peakRankingPosition: 3, currentMonthlyTraffic: 800, attributedMonthlyRevenue: 120, publishedDate: pubDate(30), publishedUrl: "https://seniorpetguide.com/dog-supplements-joint-health/", wordCountTarget: 2500, assignedWriterName: "Lisa Park" },
    // Other statuses (5)
    { siteSlug: "pawsandplans", targetKeyword: "best dog leash for pulling", contentType: "LISTICLE", status: "REVIEW", wordCountTarget: 2000, assignedWriterName: "Lisa Park" },
    { siteSlug: "pawsandplans", targetKeyword: "crate training guide", contentType: "HOW_TO", status: "IN_PROGRESS", wordCountTarget: 2500, assignedWriterName: "Lisa Park" },
    { siteSlug: "seniorpetguide", targetKeyword: "puppy vaccination schedule", contentType: "ARTICLE", status: "REVIEW", wordCountTarget: 1500, assignedWriterName: "Lisa Park" },
    { siteSlug: "pawsandplans", targetKeyword: "how to introduce a new dog", contentType: "HOW_TO", status: "IN_PROGRESS", wordCountTarget: 2000, assignedWriterName: "Lisa Park" },
    { siteSlug: "seniorpetguide", targetKeyword: "senior dog diet guide", contentType: "ARTICLE", status: "BRIEFED", wordCountTarget: 3000 },
  ];

  const ALL_BRIEFS = [...BRIEFS, ...FINANCE_BRIEFS, ...HOME_BRIEFS, ...PET_BRIEFS];
  console.log(`  Total briefs to seed: ${ALL_BRIEFS.length}`);

  for (const b of ALL_BRIEFS) {
    const siteId = sid(b.siteSlug);
    await upsertSafe(`Brief:${b.siteSlug}/${b.targetKeyword}`, async () => {
      const existing = await prisma.affiliateContentBrief.findFirst({
        where: { tenantId: tid, siteId, targetKeyword: b.targetKeyword },
      });
      const data: any = {
        contentType: b.contentType, status: b.status,
        assignedWriterName: b.assignedWriterName ?? null,
        wordCountTarget: b.wordCountTarget ?? null,
        refreshDue: b.refreshDue ?? false,
        currentRankingPosition: b.currentRankingPosition ?? null,
        peakRankingPosition: b.peakRankingPosition ?? null,
        currentMonthlyTraffic: b.currentMonthlyTraffic ?? null,
        attributedMonthlyRevenue: b.attributedMonthlyRevenue ?? null,
        publishedUrl: b.publishedUrl ?? null,
        publishedDate: b.publishedDate ?? null,
      };
      if (existing) {
        await prisma.affiliateContentBrief.update({ where: { id: existing.id }, data });
      } else {
        await prisma.affiliateContentBrief.create({ data: { tenantId: tid, siteId, targetKeyword: b.targetKeyword, ...data } });
      }
      counts.briefs++;
    });
  }
  console.log(`✅ Briefs: ${counts.briefs}\n`);

  // ── SITE VALUATIONS ──
  const eightMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 8, 15);

  const VALUATIONS = [
    { siteSlug: "seniorpetguide", monthlyNetProfit: 2000, multipleUsed: 36, estimatedValue: 72000, brokerListingStatus: "LISTED", listedPrice: 82000, broker: "Empire Flippers" },
    { siteSlug: "smalldogworld", monthlyNetProfit: 1900, multipleUsed: 36, estimatedValue: 68400, brokerListingStatus: "SOLD", salePrice: 68000, saleDate: eightMonthsAgo, broker: "Motion Invest" },
  ];

  for (const v of VALUATIONS) {
    const siteId = sid(v.siteSlug);
    await upsertSafe(`Valuation:${v.siteSlug}`, async () => {
      const existing = await prisma.siteValuation.findFirst({
        where: { tenantId: tid, siteId },
        orderBy: { valuationDate: "desc" },
      });
      const data: any = {
        monthlyNetProfit: v.monthlyNetProfit, multipleUsed: v.multipleUsed,
        estimatedValue: v.estimatedValue, brokerListingStatus: v.brokerListingStatus,
        listedPrice: v.listedPrice ?? null, salePrice: v.salePrice ?? null,
        saleDate: v.saleDate ?? null, broker: v.broker ?? null,
      };
      if (existing) {
        await prisma.siteValuation.update({ where: { id: existing.id }, data });
      } else {
        await prisma.siteValuation.create({ data: { tenantId: tid, siteId, ...data } });
      }
      counts.valuations++;
    });
  }
  console.log(`✅ Valuations: ${counts.valuations}\n`);

  // ── SUMMARY ──
  console.log(`\nSeeded: ${counts.sites} sites, ${counts.programs} programs, ${counts.networks} networks, ${counts.revenue} revenue entries, ${counts.briefs} briefs, ${counts.targets} targets, ${counts.valuations} valuations`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
