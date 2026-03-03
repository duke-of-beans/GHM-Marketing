// scripts/seed-tenants.ts
// Sprint 34 — Seed the Tenant table from TENANT_REGISTRY values.
// Run once: npx tsx scripts/seed-tenants.ts
// Safe to re-run — uses upsert on slug.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tenants = [
  {
    slug: "ghm",
    name: "GHM Digital Marketing",
    companyName: "GHM Digital Marketing Inc",
    companyTagline: "Digital Marketing Solutions",
    fromEmail: "noreply@ghmmarketing.com",
    fromName: "GHM Marketing",
    supportEmail: "support@ghmdigital.com",
    dashboardUrl: "https://ghm.covos.app",
    aiContext: "enterprise SEO services platform for local businesses",
    providers: {
      accounting: "wave",
      domain: "godaddy",
      payroll: "wave",
      email: "resend",
    },
    active: true,
  },
  {
    slug: "covosdemo",
    name: "COVOS Demo",
    companyName: "COVOS Demo Agency",
    companyTagline: "Powered by COVOS",
    fromEmail: "noreply@covos.app",
    fromName: "COVOS Demo",
    supportEmail: "support@covos.app",
    dashboardUrl: "https://covosdemo.covos.app",
    databaseUrl: process.env.COVOS_TEST_DATABASE_URL ?? undefined,
    logoUrl: "/logos/covos.png",
    providers: {
      accounting: "wave",
      domain: "godaddy",
      payroll: "wave",
      email: "resend",
    },
    active: true,
  },
];

async function main() {
  console.log("Seeding tenants table...\n");

  for (const t of tenants) {
    const result = await prisma.tenant.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        companyName: t.companyName,
        companyTagline: t.companyTagline,
        fromEmail: t.fromEmail,
        fromName: t.fromName,
        supportEmail: t.supportEmail,
        dashboardUrl: t.dashboardUrl,
        databaseUrl: t.databaseUrl,
        logoUrl: t.logoUrl,
        aiContext: t.aiContext,
        providers: t.providers,
        active: t.active,
      },
      create: {
        slug: t.slug,
        name: t.name,
        companyName: t.companyName,
        companyTagline: t.companyTagline,
        fromEmail: t.fromEmail,
        fromName: t.fromName,
        supportEmail: t.supportEmail,
        dashboardUrl: t.dashboardUrl,
        databaseUrl: t.databaseUrl,
        logoUrl: t.logoUrl,
        aiContext: t.aiContext,
        providers: t.providers,
        active: t.active,
      },
    });
    console.log(`  ✅ ${result.slug} (id=${result.id})`);
  }

  console.log("\nDone. Tenants seeded.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
