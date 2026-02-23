/**
 * NAP Scan Cron — runs quarterly (first day of Jan, Apr, Jul, Oct at 3 AM UTC)
 * Scans all active clients for NAP citation consistency across directories.
 * Also available on-demand via POST /api/clients/[id]/citations/scan.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { runCitationScan } from "@/lib/enrichment/providers/nap-scraper/scanner";

export const maxDuration = 300;

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

  const clients = await prisma.clientProfile.findMany({
    where: { status: "active" },
    select: { id: true },
  });

  let scanned = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const client of clients) {
    try {
      await runCitationScan(client.id);
      scanned++;
    } catch (err) {
      failed++;
      errors.push(`Client ${client.id}: ${err}`);
      log.error({ cron: 'nap-scan', clientId: client.id, error: err }, 'NAP scan failed for client');
    }
  }

  return NextResponse.json({
    ok: true,
    scanned,
    failed,
    errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
  });
}
