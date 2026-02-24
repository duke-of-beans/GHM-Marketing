/**
 * Website Audit Engine — FEAT-024
 *
 * Combines:
 * 1. Google PageSpeed Insights API (performance, a11y, SEO, best practices scores + audits)
 * 2. Direct HTTP fetch for SSL, robots.txt, sitemap.xml, basic HTML parsing
 *
 * Requires: PAGESPEED_API_KEY in env (free, get at console.cloud.google.com)
 * Falls back to lightweight fetch-only audit if no key is set.
 */

export interface AuditIssue {
  category: "critical" | "recommended" | "optional";
  dimension: "performance" | "seo" | "accessibility" | "technical" | "content";
  title: string;
  description: string;
  impact?: string;
}

export interface AuditResult {
  scores: {
    performance: number | null;
    accessibility: number | null;
    seo: number | null;
    bestPractices: number | null;
  };
  meta: {
    title: string | null;
    description: string | null;
    h1: string | null;
    canonical: string | null;
    hasSitemap: boolean;
    hasRobots: boolean;
  };
  ssl: boolean;
  mobile: boolean;
  issues: AuditIssue[];
  raw: Record<string, unknown>;
}

const PAGESPEED_KEY = process.env.PAGESPEED_API_KEY ?? null;
const PAGESPEED_BASE = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export async function runWebsiteAudit(url: string): Promise<AuditResult> {
  const [psi, meta] = await Promise.allSettled([
    fetchPageSpeed(url),
    fetchMeta(url),
  ]);

  const psiData = psi.status === "fulfilled" ? psi.value : null;
  const metaData = meta.status === "fulfilled" ? meta.value : defaultMeta();

  const issues: AuditIssue[] = [];

  // ── Derive issues from PSI audits ──────────────────────────────────────────
  if (psiData?.lighthouseResult?.audits) {
    const audits = psiData.lighthouseResult.audits;

    // Performance
    if (audits["first-contentful-paint"]?.score < 0.5) {
      issues.push({ category: "critical", dimension: "performance", title: "Slow First Contentful Paint", description: `FCP is ${audits["first-contentful-paint"]?.displayValue ?? "slow"}. Users see a blank page too long.`, impact: "High bounce rate" });
    }
    if (audits["largest-contentful-paint"]?.score < 0.5) {
      issues.push({ category: "critical", dimension: "performance", title: "Poor Largest Contentful Paint", description: `LCP is ${audits["largest-contentful-paint"]?.displayValue ?? "slow"}. Google core web vital failing.`, impact: "Rankings penalty" });
    }
    if (audits["total-blocking-time"]?.score < 0.5) {
      issues.push({ category: "recommended", dimension: "performance", title: "High Total Blocking Time", description: `TBT is ${audits["total-blocking-time"]?.displayValue ?? "high"}. JS is blocking the main thread.` });
    }
    if (audits["unused-javascript"]?.score < 0.5) {
      issues.push({ category: "recommended", dimension: "performance", title: "Unused JavaScript", description: "Remove or defer JavaScript that isn't needed for the initial page load." });
    }
    if (audits["render-blocking-resources"]?.score < 0.5) {
      issues.push({ category: "recommended", dimension: "performance", title: "Render-Blocking Resources", description: "Stylesheets or scripts are delaying paint. Consider inlining critical CSS or deferring scripts." });
    }
    if (audits["uses-optimized-images"]?.score < 0.5) {
      issues.push({ category: "recommended", dimension: "performance", title: "Unoptimized Images", description: "Images could be resized, compressed, or served in next-gen formats (WebP/AVIF)." });
    }

    // SEO
    if (audits["meta-description"]?.score === 0) {
      issues.push({ category: "critical", dimension: "seo", title: "Missing Meta Description", description: "No meta description found. Search engines use this in results snippets.", impact: "Lower CTR" });
    }
    if (audits["document-title"]?.score === 0) {
      issues.push({ category: "critical", dimension: "seo", title: "Missing Page Title", description: "No <title> tag found.", impact: "Not indexable" });
    }
    if (audits["crawlable-anchors"]?.score < 1) {
      issues.push({ category: "recommended", dimension: "seo", title: "Non-Crawlable Links", description: "Some links may not be crawlable by search engines." });
    }
    if (audits["hreflang"]?.score < 1) {
      issues.push({ category: "optional", dimension: "seo", title: "hreflang Issues", description: "hreflang attributes may be missing or misconfigured for multi-language content." });
    }
    if (audits["canonical"]?.score === 0) {
      issues.push({ category: "recommended", dimension: "seo", title: "Missing Canonical Tag", description: "No canonical URL specified. Duplicate content risk." });
    }
    if (audits["structured-data"]?.score === 0) {
      issues.push({ category: "optional", dimension: "seo", title: "No Structured Data", description: "Consider adding Schema.org markup (LocalBusiness, Product, FAQ) for rich results." });
    }

    // Accessibility
    if (audits["image-alt"]?.score < 1) {
      issues.push({ category: "recommended", dimension: "accessibility", title: "Images Missing Alt Text", description: "Images without alt attributes are inaccessible to screen readers and hurt SEO." });
    }
    if (audits["color-contrast"]?.score < 1) {
      issues.push({ category: "recommended", dimension: "accessibility", title: "Low Color Contrast", description: "Some text may be difficult to read due to insufficient contrast ratio." });
    }
  }

  // ── Issues from meta fetch ──────────────────────────────────────────────────
  if (!metaData.hasSitemap) {
    issues.push({ category: "recommended", dimension: "technical", title: "No Sitemap Found", description: "sitemap.xml was not found at the root. Sitemaps help search engines discover all pages.", impact: "Incomplete indexing" });
  }
  if (!metaData.hasRobots) {
    issues.push({ category: "recommended", dimension: "technical", title: "No robots.txt Found", description: "robots.txt was not found. Without it, crawlers use default behavior which may crawl unwanted pages." });
  }
  if (!metaData.ssl) {
    issues.push({ category: "critical", dimension: "technical", title: "No HTTPS", description: "The site is not served over HTTPS. Modern browsers show security warnings and Google penalizes non-HTTPS sites.", impact: "Trust + rankings" });
  }
  if (!metaData.h1) {
    issues.push({ category: "recommended", dimension: "content", title: "Missing H1 Tag", description: "No H1 heading found. Every page should have exactly one H1 that describes the main topic." });
  }
  if (!metaData.description && !psiData) {
    issues.push({ category: "critical", dimension: "seo", title: "Missing Meta Description", description: "No meta description found. Search engines use this in results snippets.", impact: "Lower CTR" });
  }

  // Sort: critical first
  const order = { critical: 0, recommended: 1, optional: 2 };
  issues.sort((a, b) => order[a.category] - order[b.category]);

  const lhr = psiData?.lighthouseResult;
  return {
    scores: {
      performance: lhr ? Math.round((lhr.categories?.performance?.score ?? 0) * 100) : null,
      accessibility: lhr ? Math.round((lhr.categories?.accessibility?.score ?? 0) * 100) : null,
      seo: lhr ? Math.round((lhr.categories?.seo?.score ?? 0) * 100) : null,
      bestPractices: lhr ? Math.round((lhr.categories?.["best-practices"]?.score ?? 0) * 100) : null,
    },
    meta: metaData,
    ssl: metaData.ssl,
    mobile: metaData.mobile,
    issues,
    raw: psiData ?? {},
  };
}

// ── PageSpeed Insights fetch ──────────────────────────────────────────────────
async function fetchPageSpeed(url: string): Promise<Record<string, any>> {
  const params = new URLSearchParams({ url, strategy: "mobile" });
  if (PAGESPEED_KEY) params.set("key", PAGESPEED_KEY);
  params.set("category", "performance");
  params.append("category", "accessibility");
  params.append("category", "seo");
  params.append("category", "best-practices");

  const res = await fetch(`${PAGESPEED_BASE}?${params}`, {
    next: { revalidate: 0 }, // never cache — fresh on every audit
  });
  if (!res.ok) throw new Error(`PageSpeed API returned ${res.status}`);
  return res.json();
}

// ── Direct HTTP meta fetch ────────────────────────────────────────────────────
async function fetchMeta(url: string): Promise<AuditResult["meta"] & { ssl: boolean; mobile: boolean }> {
  const ssl = url.startsWith("https://");
  let title: string | null = null;
  let description: string | null = null;
  let h1: string | null = null;
  let canonical: string | null = null;
  let hasSitemap = false;
  let hasRobots = false;
  let mobile = false;

  try {
    const [htmlRes, robotsRes, sitemapRes] = await Promise.allSettled([
      fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; GHMBot/1.0)" }, signal: AbortSignal.timeout(10000) }),
      fetch(new URL("/robots.txt", url).href, { signal: AbortSignal.timeout(5000) }),
      fetch(new URL("/sitemap.xml", url).href, { signal: AbortSignal.timeout(5000) }),
    ]);

    if (robotsRes.status === "fulfilled" && robotsRes.value.ok) hasRobots = true;
    if (sitemapRes.status === "fulfilled" && sitemapRes.value.ok) hasSitemap = true;

    if (htmlRes.status === "fulfilled" && htmlRes.value.ok) {
      const html = await htmlRes.value.text();
      title = extractMeta(html, "title");
      description = extractMeta(html, "description");
      h1 = extractH1(html);
      canonical = extractCanonical(html);
      mobile = html.includes("viewport");
    }
  } catch {
    // silent — return defaults
  }

  return { title, description, h1, canonical, hasSitemap, hasRobots, ssl, mobile };
}

function defaultMeta(): AuditResult["meta"] & { ssl: boolean; mobile: boolean } {
  return { title: null, description: null, h1: null, canonical: null, hasSitemap: false, hasRobots: false, ssl: false, mobile: false };
}

function extractMeta(html: string, name: string): string | null {
  if (name === "title") {
    const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return m?.[1]?.trim() ?? null;
  }
  const m = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"));
  return m?.[1]?.trim() ?? null;
}

function extractH1(html: string): string | null {
  const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  return m?.[1]?.trim() ?? null;
}

function extractCanonical(html: string): string | null {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return m?.[1]?.trim() ?? null;
}
