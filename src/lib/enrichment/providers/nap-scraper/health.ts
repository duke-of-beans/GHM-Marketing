/**
 * NAP Scraper — Health Monitor
 *
 * Runs weekly health checks on each directory adapter using known-good searches.
 * Marks adapters isDegraded after 2+ consecutive failures so they're excluded
 * from client health scores (prevents false negatives from broken selectors).
 *
 * Auto-recovers when a check succeeds after degradation.
 */

import { prisma } from "@/lib/db";
import { DIRECTORY_REGISTRY, DirectoryConfig } from "./registry";
import { scrapeDirectory } from "./scraper";

export interface HealthCheckResult {
  checked: number;
  passed: number;
  failed: number;
  degraded: string[];   // keys of newly degraded adapters
  recovered: string[];  // keys of adapters that recovered
}

// Known-good test case: a well-established business with broad directory presence
const TEST_BUSINESS = {
  business: "McDonald's",
  city: "Los Angeles",
  state: "CA",
};

const DEGRADATION_THRESHOLD = 2; // consecutive failures before marking degraded

export async function runHealthCheck(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    checked: 0,
    passed: 0,
    failed: 0,
    degraded: [],
    recovered: [],
  };

  for (const dir of DIRECTORY_REGISTRY) {
    if (dir.searchMethod === "outscraper") continue; // GBP handled separately
    result.checked++;

    let passed = false;
    try {
      const scraped = await scrapeDirectory(dir, TEST_BUSINESS);
      // Consider a pass if we got any data back (name or phone)
      passed = !!(scraped.name || scraped.phone);
    } catch {
      passed = false;
    }

    const now = new Date();

    // Upsert health record
    const existing = await prisma.directoryHealth.findUnique({
      where: { directoryKey: dir.key },
    });

    if (passed) {
      result.passed++;
      const wasDegrade = existing?.isDegraded ?? false;
      await prisma.directoryHealth.upsert({
        where: { directoryKey: dir.key },
        create: {
          directoryKey: dir.key,
          displayName: dir.displayName,
          lastSuccess: now,
          consecutiveFailures: 0,
          isDegraded: false,
          lastCheckedAt: now,
        },
        update: {
          lastSuccess: now,
          consecutiveFailures: 0,
          isDegraded: false,
          lastCheckedAt: now,
        },
      });
      if (wasDegrade) result.recovered.push(dir.key);
    } else {
      result.failed++;
      const failures = (existing?.consecutiveFailures ?? 0) + 1;
      const nowDegraded = failures >= DEGRADATION_THRESHOLD;
      await prisma.directoryHealth.upsert({
        where: { directoryKey: dir.key },
        create: {
          directoryKey: dir.key,
          displayName: dir.displayName,
          lastFailure: now,
          consecutiveFailures: failures,
          isDegraded: nowDegraded,
          lastCheckedAt: now,
        },
        update: {
          lastFailure: now,
          consecutiveFailures: failures,
          isDegraded: nowDegraded,
          lastCheckedAt: now,
        },
      });
      if (nowDegraded && !existing?.isDegraded) result.degraded.push(dir.key);
    }
  }

  return result;
}

export async function getHealthStatus() {
  return prisma.directoryHealth.findMany({ orderBy: { directoryKey: "asc" } });
}

// Returns set of directory keys that are healthy (not degraded)
export async function getActiveDirectoryKeys(): Promise<Set<string>> {
  const all = await prisma.directoryHealth.findMany({
    where: { isDegraded: false },
    select: { directoryKey: true },
  });

  // If no health records exist yet (fresh install), treat all as active
  if (all.length === 0) {
    return new Set(DIRECTORY_REGISTRY.map((d) => d.key));
  }

  return new Set(all.map((r) => r.directoryKey));
}
