import { prisma } from "@/lib/db";

/**
 * Upsell Detection Engine
 * Analyzes scan data to identify product upsell opportunities
 */

// Gap categories mapped to product categories
const GAP_TO_PRODUCT_MAP: Record<string, string[]> = {
  "content-gap": ["content", "blog-package"],
  "technical-seo": ["technical-seo", "site-audit"],
  "link-building": ["link-building", "pr-outreach"],
  "review-management": ["review-mgmt", "reputation"],
  "competitor-outranking": ["competitive-analysis", "content"],
  "keyword-ranking": ["seo-package", "content"],
  "local-search": ["local-seo", "gmb-optimization"],
  "mobile-performance": ["technical-seo", "performance"],
  "page-speed": ["technical-seo", "performance"],
};

interface UpsellOpportunity {
  productId: number;
  productName: string;
  category: string;
  gapCategory: string;
  opportunityScore: number;
  reasoning: string;
  projectedMrr: number;
  projectedRoi: number | null;
}

/**
 * Detect upsell opportunities for a client based on scan data
 */
export async function detectUpsellOpportunities(clientId: number, scanId?: number) {
  // Get latest scan if not provided
  let scan;
  if (scanId) {
    scan = await prisma.competitiveScan.findUnique({
      where: { id: scanId },
    });
  } else {
    scan = await prisma.competitiveScan.findFirst({
      where: { clientId },
      orderBy: { scanDate: "desc" },
    });
  }

  if (!scan) {
    return [];
  }

  // Get client profile for context
  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    return [];
  }

  // Extract alerts from scan
  const alerts = scan.alerts as any;
  const criticalAlerts = alerts?.critical || [];
  const warningAlerts = alerts?.warning || [];
  const allAlerts = [...criticalAlerts, ...warningAlerts];

  // Get available products
  const products = await prisma.product.findMany({
    where: { isActive: true },
  });

  const opportunities: UpsellOpportunity[] = [];

  // Analyze each alert for upsell potential
  for (const alert of allAlerts) {
    const gapCategory = categorizeAlert(alert);
    const matchingProducts = findMatchingProducts(gapCategory, products);

    for (const product of matchingProducts) {
      const opportunityScore = calculateOpportunityScore(alert, client, product);
      
      // Only create opportunities with score >= 60
      if (opportunityScore >= 60) {
        opportunities.push({
          productId: product.id,
          productName: product.name,
          category: product.category || "general",
          gapCategory,
          opportunityScore,
          reasoning: generateReasoning(alert, product),
          projectedMrr: Number(product.price),
          projectedRoi: calculateProjectedRoi(product, client),
        });
      }
    }
  }

  // Deduplicate by product (keep highest score)
  const deduped = deduplicateByProduct(opportunities);

  return deduped.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

/**
 * Save detected opportunities to database
 */
export async function saveUpsellOpportunities(
  clientId: number,
  scanId: number,
  opportunities: UpsellOpportunity[]
) {
  const created: any[] = [];

  for (const opp of opportunities) {
    // Check if this opportunity already exists
    const existing = await prisma.upsellOpportunity.findFirst({
      where: {
        clientId,
        productId: opp.productId,
        status: { in: ["detected", "presented"] },
      },
    });

    if (!existing) {
      const newOpportunity = await prisma.upsellOpportunity.create({
        data: {
          clientId,
          productId: opp.productId,
          scanId,
          opportunityScore: opp.opportunityScore,
          gapCategory: opp.gapCategory,
          reasoning: opp.reasoning,
          projectedMrr: opp.projectedMrr,
          projectedRoi: opp.projectedRoi,
        },
      });
      created.push(newOpportunity);
    }
  }

  return created;
}

/**
 * Categorize an alert into a gap category
 */
function categorizeAlert(alert: any): string {
  const title = alert.title?.toLowerCase() || "";
  const description = alert.description?.toLowerCase() || "";
  const combined = `${title} ${description}`;

  if (combined.includes("content") || combined.includes("blog")) {
    return "content-gap";
  }
  if (combined.includes("technical") || combined.includes("crawl") || combined.includes("index")) {
    return "technical-seo";
  }
  if (combined.includes("link") || combined.includes("backlink") || combined.includes("authority")) {
    return "link-building";
  }
  if (combined.includes("review") || combined.includes("rating")) {
    return "review-management";
  }
  if (combined.includes("competitor") || combined.includes("outrank")) {
    return "competitor-outranking";
  }
  if (combined.includes("keyword") || combined.includes("ranking")) {
    return "keyword-ranking";
  }
  if (combined.includes("local") || combined.includes("map") || combined.includes("gmb")) {
    return "local-search";
  }
  if (combined.includes("mobile") || combined.includes("responsive")) {
    return "mobile-performance";
  }
  if (combined.includes("speed") || combined.includes("performance") || combined.includes("load")) {
    return "page-speed";
  }

  return "general";
}

/**
 * Find products that match a gap category
 */
function findMatchingProducts(gapCategory: string, products: any[]) {
  const matchingCategories = GAP_TO_PRODUCT_MAP[gapCategory] || [];
  
  return products.filter((p) => 
    matchingCategories.some((cat) => 
      p.category?.toLowerCase().includes(cat.toLowerCase()) ||
      p.name?.toLowerCase().includes(cat.toLowerCase())
    )
  );
}

/**
 * Calculate opportunity score (0-100)
 */
function calculateOpportunityScore(alert: any, client: any, product: any): number {
  let score = 50; // Base score

  // Severity impact
  if (alert.severity === "critical") {
    score += 30;
  } else if (alert.severity === "warning") {
    score += 15;
  }

  // Client health score impact (lower health = higher opportunity)
  const healthScore = client.healthScore || 50;
  if (healthScore < 40) {
    score += 15;
  } else if (healthScore < 60) {
    score += 10;
  }

  // Product pricing model impact (monthly recurring preferred)
  if (product.pricingModel === "monthly") {
    score += 5;
  }

  // Ensure score is within 0-100 range
  return Math.min(100, Math.max(0, score));
}

/**
 * Generate human-readable reasoning
 */
function generateReasoning(alert: any, product: any): string {
  return `${alert.title || "Issue detected"}: ${product.name} can address this gap and improve performance.`;
}

/**
 * Calculate projected ROI percentage
 */
function calculateProjectedRoi(product: any, client: any): number | null {
  // Simple heuristic: ROI based on product type and client retainer
  const productPrice = Number(product.price);
  const retainerAmount = Number(client.retainerAmount);

  if (productPrice === 0) return null;

  // Estimate 20-40% improvement in results based on product type
  const estimatedImpact = 0.3; // 30% average
  const projectedValue = retainerAmount * estimatedImpact;
  const roi = ((projectedValue - productPrice) / productPrice) * 100;

  return Math.round(roi);
}

/**
 * Deduplicate opportunities by product, keeping highest score
 */
function deduplicateByProduct(opportunities: UpsellOpportunity[]): UpsellOpportunity[] {
  const byProduct = new Map<number, UpsellOpportunity>();

  for (const opp of opportunities) {
    const existing = byProduct.get(opp.productId);
    if (!existing || opp.opportunityScore > existing.opportunityScore) {
      byProduct.set(opp.productId, opp);
    }
  }

  return Array.from(byProduct.values());
}
