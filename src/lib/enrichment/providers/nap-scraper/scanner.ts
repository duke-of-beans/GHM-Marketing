/**
 * NAP Scanner — Orchestrates a full citation scan for one client.
 *
 * Flow:
 *   1. Pull canonical NAP from ClientProfile/Lead
 *   2. Get active (non-degraded) directories
 *   3. Scrape each directory in parallel (with concurrency cap)
 *   4. Run fuzzy matcher on each result
 *   5. Calculate weighted health score
 *   6. Store CitationScan record
 *   7. Auto-create ClientTask for each mismatch/missing
 *   8. Update healthScore on ClientProfile
 */

import { prisma } from "@/lib/db";
import {
  DIRECTORY_REGISTRY,
  DIRECTORY_MAP,
  IMPORTANCE_WEIGHTS,
} from "./registry";
import { scrapeDirectory } from "./scraper";
import { compareNAP, NAPComparison } from "./matcher";
import { getActiveDirectoryKeys } from "./health";
import { fetchGMBFull } from "../outscraper";

export interface DirectoryResult {
  key: string;
  displayName: string;
  importance: string;
  status: NAPComparison["status"];
  confidence: number;
  nameMatch: boolean;
  addressMatch: boolean;
  phoneMatch: boolean;
  details: string[];
  listingUrl: string | null;
  foundName: string | null;
  foundAddress: string | null;
  foundPhone: string | null;
}

export interface CitationScanResult {
  clientId: number;
  totalChecked: number;
  matches: number;
  mismatches: number;
  missing: number;
  errors: number;
  healthScore: number;
  results: DirectoryResult[];
}

// Cap parallel scrapes to avoid rate-limiting
const CONCURRENCY = 4;

async function runBatch<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency: number
) {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.all(items.slice(i, i + concurrency).map(fn));
  }
}

function calculateHealthScore(results: DirectoryResult[]): number {
  let weightedTotal = 0;
  let weightedMatches = 0;

  for (const r of results) {
    if (r.status === "missing" && r.confidence === 0) continue; // truly not listed — neutral
    const dir = DIRECTORY_MAP.get(r.key);
    const weight = IMPORTANCE_WEIGHTS[dir?.importance ?? "medium"];
    weightedTotal += weight;
    if (r.status === "match") weightedMatches += weight;
    else if (r.status === "partial") weightedMatches += weight * 0.5;
  }

  if (weightedTotal === 0) return 100;
  return Math.round((weightedMatches / weightedTotal) * 100);
}

export async function runCitationScan(clientId: number): Promise<CitationScanResult> {
  const client = await prisma.clientProfile.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      businessName: true,
      lead: {
        select: {
          phone: true,
          address: true,
          city: true,
          state: true,
          website: true,
        },
      },
    },
  });

  if (!client) throw new Error(`Client ${clientId} not found`);

  const canonical = {
    name: client.businessName,
    address: [client.lead.address, client.lead.city, client.lead.state]
      .filter(Boolean)
      .join(", "),
    phone: client.lead.phone ?? "",
  };

  const params = {
    business: client.businessName,
    city: client.lead.city ?? "",
    state: client.lead.state ?? "",
  };

  const activeKeys = await getActiveDirectoryKeys();
  const directoriesToScan = DIRECTORY_REGISTRY.filter((d) => activeKeys.has(d.key));

  const results: DirectoryResult[] = [];

  await runBatch(directoriesToScan, async (dir) => {
    let foundNAP = { name: null as string | null, address: null as string | null, phone: null as string | null, listingUrl: null as string | null };

    try {
      if (dir.key === "google_business") {
        // Use Outscraper GMB data (already paid for via enrichment)
        const gmb = await fetchGMBFull(
          client.businessName,
          client.lead.city ?? "",
          client.lead.state ?? ""
        );
        if (gmb) {
          foundNAP = {
            name: gmb.name ?? null,
            address: gmb.full_address ?? null,
            phone: gmb.phone ?? null,
            listingUrl: null,
          };
        }
      } else {
        foundNAP = await scrapeDirectory(dir, params);
      }
    } catch {
      // Treat scrape failure as an error entry but continue
    }

    const comparison = compareNAP(canonical, {
      name: foundNAP.name,
      address: foundNAP.address,
      phone: foundNAP.phone,
    });

    results.push({
      key: dir.key,
      displayName: dir.displayName,
      importance: dir.importance,
      ...comparison,
      listingUrl: foundNAP.listingUrl,
      foundName: foundNAP.name,
      foundAddress: foundNAP.address,
      foundPhone: foundNAP.phone,
    });
  }, CONCURRENCY);

  // Tally
  const matches = results.filter((r) => r.status === "match").length;
  const mismatches = results.filter((r) => r.status === "mismatch" || r.status === "partial").length;
  const missing = results.filter((r) => r.status === "missing").length;
  const errors = results.filter((r) => r.confidence === 0 && r.status !== "missing").length;
  const healthScore = calculateHealthScore(results);

  // Store CitationScan
  await prisma.citationScan.create({
    data: {
      clientId,
      totalChecked: results.length,
      matches,
      mismatches,
      missing,
      errors,
      healthScore,
      results: results as unknown as object[],
    },
  });

  // Update client health score field (re-use healthScore column if available, else skip)
  // healthScore on ClientProfile is the composite SEO score — we don't overwrite it here
  // The citation health score lives in the CitationScan record

  // Auto-create tasks for mismatches and missing listings
  for (const r of results) {
    if (r.status === "mismatch" || r.status === "partial") {
      const issue = r.details.join("; ");
      await prisma.clientTask.create({
        data: {
          clientId,
          title: `Fix NAP on ${r.displayName}: ${issue}`,
          category: "Local SEO",
          priority: r.importance === "critical" ? "P1" : r.importance === "high" ? "P2" : "P3",
          status: "queued",
          source: "citation_scan",
          description: `Citation inconsistency detected on ${r.displayName}.\n\nExpected:\n  Name: ${canonical.name}\n  Address: ${canonical.address}\n  Phone: ${canonical.phone}\n\nFound:\n  Name: ${r.foundName ?? "—"}\n  Address: ${r.foundAddress ?? "—"}\n  Phone: ${r.foundPhone ?? "—"}\n\nIssues: ${issue}`,
        },
      }).catch(() => {}); // non-fatal if duplicate
    }

    if (r.status === "missing") {
      await prisma.clientTask.create({
        data: {
          clientId,
          title: `Create listing on ${r.displayName}`,
          category: "Local SEO",
          priority: r.importance === "critical" ? "P1" : r.importance === "high" ? "P2" : "P3",
          status: "queued",
          source: "citation_scan",
          description: `${client.businessName} does not appear to have a listing on ${r.displayName}. Creating a listing with correct NAP will improve local search consistency.`,
        },
      }).catch(() => {});
    }
  }

  return {
    clientId,
    totalChecked: results.length,
    matches,
    mismatches,
    missing,
    errors,
    healthScore,
    results,
  };
}
