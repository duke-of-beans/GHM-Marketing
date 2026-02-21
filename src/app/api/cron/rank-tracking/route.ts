/**
 * Rank Tracking Cron — runs daily at 1 AM UTC (before daily-scans at 2 AM)
 * Posts biweekly rank check tasks to DataForSEO standard queue.
 * Results arrive ~5 min later and are picked up by rank-poll.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { postSerpTasks } from "@/lib/enrichment/providers/dataforseo";
import { logProviderCall } from "@/lib/enrichment/cost-tracker";

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

  // Only scan clients due for biweekly refresh (last scan >13 days ago or never)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 13);

  const clients = await prisma.clientProfile.findMany({
    where: {
      status: "active",
      keywordTrackers: { some: { isActive: true } },
    },
    select: {
      id: true,
      lead: { select: { website: true, city: true, state: true, zipCode: true } },
      keywordTrackers: {
        where: { isActive: true },
        select: { id: true, keyword: true },
      },
    },
  });

  let totalPosted = 0;
  let totalSkipped = 0;
  const errors: string[] = [];

  for (const client of clients) {
    if (client.keywordTrackers.length === 0) continue;

    const zipCode = client.lead.zipCode ?? "";
    if (!zipCode) { totalSkipped += client.keywordTrackers.length; continue; }

    const tasks = client.keywordTrackers.map((kw) => ({
      keyword: kw.keyword,
      zipCode,
      domain: client.lead.website?.replace(/^https?:\/\//, "").replace(/\/.*$/, "") ?? "",
      tag: `${client.id}_${kw.id}`,
    }));

    try {
      const t0 = Date.now();
      const taskIds = await postSerpTasks(tasks);
      const latencyMs = Date.now() - t0;
      const costUsd = taskIds.length * 0.0006;

      await logProviderCall({
        provider: "dataforseo",
        operation: "serp_task_post",
        clientId: client.id,
        cacheHit: false,
        costUsd,
        latencyMs,
        success: taskIds.length > 0,
      });

      if (taskIds.length > 0) {
        // Store pending task records
        await prisma.pendingRankTask.createMany({
          data: taskIds.map((taskId, i) => ({
            taskId,
            clientId: client.id,
            keywordId: client.keywordTrackers[i]?.id ?? client.keywordTrackers[0].id,
            zipCode,
            keyword: client.keywordTrackers[i]?.keyword ?? "",
          })),
          skipDuplicates: true,
        });
        totalPosted += taskIds.length;
      }
    } catch (err) {
      errors.push(`Client ${client.id}: ${err}`);
      totalSkipped += client.keywordTrackers.length;
    }
  }

  return NextResponse.json({
    ok: true,
    totalPosted,
    totalSkipped,
    clients: clients.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
