/**
 * NAP Health Check Cron — runs weekly (Sunday at 4 AM UTC)
 * Tests each directory adapter with a known-good search.
 * Marks broken adapters isDegraded so they're excluded from client scores.
 */

import { NextResponse } from "next/server";
import { runHealthCheck } from "@/lib/enrichment/providers/nap-scraper/health";

export const maxDuration = 120;

function isCronAuthorized(req: Request): boolean {
  const secret = req.headers.get("x-cron-secret");
  if (secret === process.env.CRON_SECRET) return true;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runHealthCheck();

  return NextResponse.json({ ok: true, ...result });
}
