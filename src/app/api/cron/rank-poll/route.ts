/**
 * Rank Poll Cron — runs every 10 minutes
 * Checks DataForSEO for completed tasks, stores RankSnapshot records.
 * Calculates position delta vs previous snapshot for alert generation.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSerpResults } from "@/lib/enrichment/providers/dataforseo";

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

  // Fetch pending tasks posted in the last 24 hours, not yet resolved
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 24);

  const pending = await prisma.pendingRankTask.findMany({
    where: { resolvedAt: null, postedAt: { gte: cutoff } },
    select: { id: true, taskId: true, clientId: true, keywordId: true, zipCode: true, keyword: true },
    take: 200, // cap per poll cycle
  });

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, resolved: 0, pending: 0 });
  }

  const taskIds = pending.map((p) => p.taskId);
  const results = await getSerpResults(taskIds);

  let resolved = 0;
  const now = new Date();

  for (const result of results) {
    // Match result back to pending task by taskId
    const pendingTask = pending.find((p) => p.taskId === result.taskId);
    if (!pendingTask) continue;

    // Get previous snapshot for delta calculation
    const previous = await prisma.rankSnapshot.findFirst({
      where: { keywordId: pendingTask.keywordId },
      orderBy: { scanDate: "desc" },
      select: { organicPosition: true, localPackPosition: true },
    });

    // Resolve local pack position for this client's domain
    // Find entry in local pack that matches client domain (partial match on title)
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { id: pendingTask.clientId },
      select: { businessName: true, lead: { select: { website: true } } },
    });

    let localPackPosition: number | null = null;
    let localPackBusiness: string | null = result.localPackEntries[0]?.title ?? null;

    if (clientProfile) {
      const businessName = clientProfile.businessName.toLowerCase();
      const matchedEntry = result.localPackEntries.find(
        (e) =>
          e.title.toLowerCase().includes(businessName) ||
          businessName.includes(e.title.toLowerCase().slice(0, 8))
      );
      localPackPosition = matchedEntry?.position ?? null;
    }

    await prisma.rankSnapshot.create({
      data: {
        keywordId: pendingTask.keywordId,
        clientId: pendingTask.clientId,
        scanDate: now,
        organicPosition: result.organicPosition,
        localPackPosition,
        rankingUrl: result.rankingUrl,
        localPackBusiness,
        serpFeatures: result.serpFeatures,
        zipCode: pendingTask.zipCode,
        previousOrganic: previous?.organicPosition ?? null,
        previousLocalPack: previous?.localPackPosition ?? null,
      },
    });

    // Mark task resolved
    await prisma.pendingRankTask.update({
      where: { id: pendingTask.id },
      data: { resolvedAt: now },
    });

    resolved++;
  }

  // Clean up tasks older than 48 hours (DataForSEO results expire)
  const cleanup = new Date();
  cleanup.setHours(cleanup.getHours() - 48);
  await prisma.pendingRankTask.deleteMany({
    where: { postedAt: { lt: cleanup } },
  });

  return NextResponse.json({
    ok: true,
    resolved,
    pending: pending.length - resolved,
    checked: taskIds.length,
  });
}
