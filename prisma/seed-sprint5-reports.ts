/**
 * Seed Sprint 5 — AI Reports
 * - TaskChecklistTemplate: "monthly_report"
 * - RecurringTaskRule: Monthly Client Report (runs 1st of month at 9am, all active clients)
 *
 * Run: npx tsx prisma/seed-sprint5-reports.ts
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Sprint 5 AI Reports...\n");

  // ── TaskChecklistTemplate: monthly_report ──────────────────────────────────
  const existingTemplate = await prisma.taskChecklistTemplate.findFirst({
    where: { name: "Monthly Client Report" },
  });

  let templateId: number;

  if (existingTemplate) {
    console.log("  ⏭  Skipped (exists): Monthly Client Report checklist template");
    templateId = existingTemplate.id;
  } else {
    const template = await prisma.taskChecklistTemplate.create({
      data: {
        name: "Monthly Client Report",
        category: "reporting",
        description: "Standard monthly client performance report checklist",
        items: [
          { label: "Compile ranking data",            sortOrder: 1 },
          { label: "Compile site health data",        sortOrder: 2 },
          { label: "Compile GBP metrics",             sortOrder: 3 },
          { label: "Generate AI narratives",          sortOrder: 4 },
          { label: "Review report",                   sortOrder: 5 },
          { label: "Generate PDF / HTML export",      sortOrder: 6 },
          { label: "Send to client",                  sortOrder: 7 },
        ],
        isActive: true,
      },
    });
    templateId = template.id;
    console.log(`  ✅ Created: Monthly Client Report checklist template (id: ${templateId})`);
  }

  // ── RecurringTaskRule: Monthly Client Report ───────────────────────────────
  const existingRule = await prisma.recurringTaskRule.findFirst({
    where: { name: "Monthly Client Report" },
  });

  if (existingRule) {
    console.log("  ⏭  Skipped (exists): Monthly Client Report recurring rule");
  } else {
    const nextRun = new Date();
    nextRun.setDate(1);
    nextRun.setHours(9, 0, 0, 0);
    // If the 1st already passed this month, schedule for next month
    if (nextRun <= new Date()) {
      nextRun.setMonth(nextRun.getMonth() + 1);
    }

    const rule = await prisma.recurringTaskRule.create({
      data: {
        name: "Monthly Client Report",
        clientId: null, // null = applies to all active clients
        category: "reporting",
        title: "Generate monthly report for {clientName}",
        description: "Compile performance data, generate AI narratives, and deliver monthly SEO report to client.",
        priority: "P2",
        cronExpression: "0 9 1 * *", // 1st of month at 9am
        checklistTemplateId: templateId,
        isActive: true,
        nextRunAt: nextRun,
      },
    });

    console.log(`  ✅ Created: Monthly Client Report recurring rule (id: ${rule.id}, next run: ${nextRun.toISOString()})`);
  }

  console.log("\n✅ Sprint 5 seed complete.");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
