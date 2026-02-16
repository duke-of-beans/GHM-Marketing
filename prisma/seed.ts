import { PrismaClient, PricingModel } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1. Master User
  const masterPassword = await hash("changeme123", 10);
  const master = await prisma.user.upsert({
    where: { email: "david@ghmmarketing.com" },
    update: {},
    create: {
      email: "david@ghmmarketing.com",
      passwordHash: masterPassword,
      name: "David Kirsch",
      role: "master",
    },
  });
  console.log(`✅ Master user: ${master.email}`);

  // 2. Territories
  const territories = await Promise.all([
    prisma.territory.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: "Los Angeles Metro",
        cities: ["Los Angeles", "Santa Monica", "Beverly Hills", "Burbank", "Glendale", "Pasadena", "Culver City", "West Hollywood"],
        zipCodes: [],
        states: ["CA"],
      },
    }),
    prisma.territory.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: "San Fernando Valley",
        cities: ["Simi Valley", "Thousand Oaks", "Northridge", "Van Nuys", "Sherman Oaks", "Encino", "Woodland Hills", "Calabasas"],
        zipCodes: [],
        states: ["CA"],
      },
    }),
    prisma.territory.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: "Orange County",
        cities: ["Irvine", "Anaheim", "Santa Ana", "Huntington Beach", "Costa Mesa", "Newport Beach", "Fullerton", "Orange"],
        zipCodes: [],
        states: ["CA"],
      },
    }),
  ]);
  console.log(`✅ Territories: ${territories.map((t) => t.name).join(", ")}`);

  // 3. Sales Reps
  const repPassword = await hash("changeme123", 10);
  const reps = await Promise.all([
    prisma.user.upsert({
      where: { email: "rep1@ghmmarketing.com" },
      update: {},
      create: { email: "rep1@ghmmarketing.com", passwordHash: repPassword, name: "Alex Johnson", role: "sales", territoryId: territories[0].id },
    }),
    prisma.user.upsert({
      where: { email: "rep2@ghmmarketing.com" },
      update: {},
      create: { email: "rep2@ghmmarketing.com", passwordHash: repPassword, name: "Sarah Chen", role: "sales", territoryId: territories[1].id },
    }),
  ]);
  console.log(`✅ Sales reps: ${reps.map((r) => r.name).join(", ")}`);

  // 4. Product Catalog
  const products = await Promise.all([
    prisma.product.upsert({ where: { sku: "SEO-BASIC" }, update: {}, create: { name: "SEO Basic", description: "Local SEO optimization, 10 keywords", sku: "SEO-BASIC", category: "SEO Services", price: 499.00, pricingModel: PricingModel.monthly, displayOrder: 1 } }),
    prisma.product.upsert({ where: { sku: "SEO-PREMIUM" }, update: {}, create: { name: "SEO Premium", description: "Advanced SEO, 25 keywords, content", sku: "SEO-PREMIUM", category: "SEO Services", price: 999.00, pricingModel: PricingModel.monthly, displayOrder: 2 } }),
    prisma.product.upsert({ where: { sku: "SEO-ENTERPRISE" }, update: {}, create: { name: "SEO Enterprise", description: "Full SEO suite, unlimited keywords", sku: "SEO-ENTERPRISE", category: "SEO Services", price: 2499.00, pricingModel: PricingModel.monthly, displayOrder: 3 } }),
    prisma.product.upsert({ where: { sku: "WEB-BASIC" }, update: {}, create: { name: "Website Basic", description: "Professional 5-page website", sku: "WEB-BASIC", category: "Web Design", price: 2500.00, pricingModel: PricingModel.one_time, displayOrder: 4 } }),
    prisma.product.upsert({ where: { sku: "WEB-ECOMM" }, update: {}, create: { name: "Website E-Commerce", description: "Full e-commerce site with cart", sku: "WEB-ECOMM", category: "Web Design", price: 5000.00, pricingModel: PricingModel.one_time, displayOrder: 5 } }),
    prisma.product.upsert({ where: { sku: "CONTENT-BLOG" }, update: {}, create: { name: "Blog Post", description: "SEO-optimized blog post (1000 words)", sku: "CONTENT-BLOG", category: "Content Marketing", price: 150.00, pricingModel: PricingModel.one_time, displayOrder: 6 } }),
    prisma.product.upsert({ where: { sku: "CONTENT-PKG" }, update: {}, create: { name: "Content Package", description: "4 blog posts per month", sku: "CONTENT-PKG", category: "Content Marketing", price: 499.00, pricingModel: PricingModel.monthly, displayOrder: 7 } }),
  ]);
  console.log(`✅ Products: ${products.length} items`);

  // 5. Lead Sources
  const sources = await Promise.all([
    prisma.leadSource.upsert({ where: { id: 1 }, update: {}, create: { name: "Outscraper Import", type: "scrape", costPerLead: 0.03 } }),
    prisma.leadSource.upsert({ where: { id: 2 }, update: {}, create: { name: "Google Ads", type: "paid", costPerLead: 15.00 } }),
    prisma.leadSource.upsert({ where: { id: 3 }, update: {}, create: { name: "Referral", type: "referral" } }),
    prisma.leadSource.upsert({ where: { id: 4 }, update: {}, create: { name: "Cold Outreach", type: "organic" } }),
  ]);
  console.log(`✅ Lead sources: ${sources.map((s) => s.name).join(", ")}`);

  console.log("\n🎉 Database seeded successfully!");
  console.log("\n📋 Login credentials:");
  console.log("   Master: david@ghmmarketing.com / changeme123");
  console.log("   Rep 1:  rep1@ghmmarketing.com / changeme123");
  console.log("   Rep 2:  rep2@ghmmarketing.com / changeme123");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
