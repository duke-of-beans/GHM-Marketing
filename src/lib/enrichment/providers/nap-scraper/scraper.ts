/**
 * NAP Scraper — Web Scraper
 *
 * Fetches a directory listing for a business and extracts Name, Address, Phone.
 * Returns null on failure — caller handles as "error" in scan results.
 *
 * Strategy:
 *   1. Fetch the search results page
 *   2. Find the first matching listing link
 *   3. If requiresDetailPage, fetch that URL and extract from detailSelectors
 *   4. Otherwise extract directly from search result selectors
 *
 * We use cheerio (server-side HTML parsing) — no browser needed.
 * fetch() is native in Next.js server environment.
 */

import { load } from "cheerio";
import type { DirectoryConfig } from "./registry";

export interface ScrapedNAP {
  name: string | null;
  address: string | null;
  phone: string | null;
  listingUrl: string | null;
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

const TIMEOUT_MS = 12000;

function buildSearchUrl(
  config: DirectoryConfig,
  params: { business: string; city: string; state: string }
): string {
  const pattern = config.searchUrlPattern ?? "";
  return pattern
    .replace("{business}", encodeURIComponent(params.business))
    .replace("{city}", encodeURIComponent(params.city))
    .replace("{state}", encodeURIComponent(params.state));
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractText($: ReturnType<typeof load>, selector: string): string | null {
  const el = $(selector).first();
  if (!el.length) return null;
  // For anchor tel: links, extract the text or strip tel: from href
  const href = el.attr("href");
  if (href?.startsWith("tel:")) return href.replace("tel:", "").trim();
  return el.text().trim() || null;
}

export async function scrapeDirectory(
  config: DirectoryConfig,
  params: { business: string; city: string; state: string }
): Promise<ScrapedNAP> {
  // Google Business uses Outscraper, handled separately
  if (config.searchMethod === "outscraper") {
    return { name: null, address: null, phone: null, listingUrl: null };
  }

  if (!config.selectors || !config.searchUrlPattern) {
    return { name: null, address: null, phone: null, listingUrl: null };
  }

  const searchUrl = buildSearchUrl(config, params);
  const searchHtml = await fetchHtml(searchUrl);
  if (!searchHtml) return { name: null, address: null, phone: null, listingUrl: null };

  const $search = load(searchHtml);

  if (!config.requiresDetailPage) {
    // Extract directly from search results
    return {
      name: extractText($search, config.selectors.name),
      address: extractText($search, config.selectors.address),
      phone: extractText($search, config.selectors.phone),
      listingUrl: searchUrl,
    };
  }

  // Follow listing link to detail page
  const linkEl = $search(config.selectors.listingLink).first();
  if (!linkEl.length) {
    return { name: null, address: null, phone: null, listingUrl: null };
  }

  let detailUrl = linkEl.attr("href") ?? "";
  if (detailUrl && !detailUrl.startsWith("http")) {
    // Relative URL — resolve against the search host
    const base = new URL(searchUrl);
    detailUrl = `${base.origin}${detailUrl}`;
  }
  if (!detailUrl) return { name: null, address: null, phone: null, listingUrl: null };

  const detailHtml = await fetchHtml(detailUrl);
  if (!detailHtml) return { name: null, address: null, phone: null, listingUrl: detailUrl };

  const $detail = load(detailHtml);
  const sel = config.detailSelectors ?? config.selectors;

  return {
    name: extractText($detail, sel.name),
    address: extractText($detail, sel.address),
    phone: extractText($detail, sel.phone),
    listingUrl: detailUrl,
  };
}
