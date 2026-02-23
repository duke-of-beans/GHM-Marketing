/**
 * Seed: Sprint 2 Site Health Alert Rules
 * Run: npx ts-node prisma/seed-sprint2-health-rules.ts
 *
 * Adds default AlertRule records for site health degradation.
 * Safe to run multiple times (upserts by name).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rules = [
  {
    name: "Mobile performance drop — warning",
    description: "Mobile PageSpeed score dropped 10+ points since last scan",
    sourceType: "health",
    conditionType: "threshold",
    conditionConfig: { field: "mobileDelta", operator: "lte", value: -10 },
    severity: "warning",
    autoCreateTask: false,
    notifyOnTrigger: true,
    cooldownMinutes: 10080, // 7 days
  },
  {
    name: "Mobile performance drop — critical",
    description: "Mobile PageSpeed score dropped 20+ points since last scan",
    sourceType: "health",
    conditionType: "threshold",
    conditionConfig: { field: "mobileDelta", operator: "lte", value: -20 },
    severity: "critical",
    autoCreateTask: true,
    taskTemplate: {
      title: "Site speed critical: {clientName} mobile performance drop",
      category: "ops",
      priority: "P1",
      contentBrief: {
        instructions: "Investigate PageSpeed regression. Check recent deploys, plugin changes, image sizes, render-blocking resources.",
      },
    },
    notifyOnTrigger: true,
    cooldownMinutes: 10080,
  },
  {
    name: "LCP over 4 seconds",
    description: "Largest Contentful Paint exceeds 4 seconds (poor threshold)",
    sourceType: "health",
    conditionType: "threshold",
    conditionConfig: { field: "lcpOver4s", operator: "eq", value: true },
    severity: "warning",
    autoCreateTask: false,
    notifyOnTrigger: true,
    cooldownMinutes: 10080,
  },
  {
    name: "CLS over 0.25",
    description: "Cumulative Layout Shift exceeds 0.25 (poor threshold)",
    sourceType: "health",
    conditionType: "threshold",
    conditionConfig: { field: "clsOver025", operator: "eq", value: true },
    severity: "warning",
    autoCreateTask: false,
    notifyOnTrigger: true,
    cooldownMinutes: 10080,
  },
];

async function main() {
  console.log("🌱 Seeding Sprint 2 site health alert rules...\n");

  for (const rule of rules) {
    const existing = await prisma.alertRule.findFirst({ where: { name: rule.name } });
    if (existing) {
      console.log(`  ⏭  Already exists: ${rule.name}`);
    } else {
      await prisma.alertRule.create({ data: rule });
      console.log(`  ✅ Created: ${rule.name}`);
    }
  }

  console.log(`\n✅ Done — ${rules.length} rules processed.`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
