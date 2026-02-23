/**
 * Seed Sprint 4 — Cluster Manager
 * - website_deployment TaskChecklistTemplate
 * - website_stale AlertRule
 * Run: npx tsx prisma/seed-sprint4-cluster.ts
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Sprint 4 Cluster Manager...\n");

  // ── website_deployment checklist template ─────────────────────────────────
  const existingTemplate = await prisma.taskChecklistTemplate.findFirst({
    where: { category: "website_deployment" },
  });

  if (existingTemplate) {
    console.log("  ⏭  Skipped (exists): website_deployment template");
  } else {
    await prisma.taskChecklistTemplate.create({
      data: {
        name:        "Website Deployment Checklist",
        category:    "website_deployment",
        description: "Standard pre-launch verification for satellite site deployments",
        items: [
          { label: "DNS records configured and propagated",    sortOrder: 1 },
          { label: "SSL certificate active (HTTPS green)",     sortOrder: 2 },
          { label: "Google Analytics installed and firing",    sortOrder: 3 },
          { label: "Google Search Console verified",           sortOrder: 4 },
          { label: "Client approval received",                 sortOrder: 5 },
          { label: "Go-live notification sent to client",      sortOrder: 6 },
        ],
      },
    });
    console.log("  ✅ Created: website_deployment TaskChecklistTemplate");
  }

  // ── website staleness alert rule ──────────────────────────────────────────
  const existingRule = await prisma.alertRule.findFirst({
    where: { name: "Website content may be stale" },
  });

  if (existingRule) {
    console.log("  ⏭  Skipped (exists): website staleness alert rule");
  } else {
    await prisma.alertRule.create({
      data: {
        name:            "Website content may be stale",
        description:     "No deployment detected beyond the property's staleness threshold",
        sourceType:      "health",
        conditionType:   "threshold",
        conditionConfig: { field: "isStale", operator: "eq", value: true },
        severity:        "warning",
        notifyOnTrigger: true,
        autoCreateTask:  false,
        cooldownMinutes: 10080, // 7 days — don't re-fire weekly
        isActive:        true,
      },
    });
    console.log("  ✅ Created: website staleness alert rule");
  }

  console.log("\n✅ Done.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
