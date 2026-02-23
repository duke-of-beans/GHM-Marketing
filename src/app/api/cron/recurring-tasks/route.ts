/**
 * GET /api/cron/recurring-tasks
 * Vercel cron: runs daily at 06:00 UTC
 * Evaluates RecurringTaskRule records and creates ClientTask instances for due rules.
 */

import { NextResponse } from "next/server";
import { processRecurringTasks } from "@/lib/ops/recurring-tasks";
import { log } from "@/lib/logger";

export const maxDuration = 60;

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

  const result = await processRecurringTasks();

  log.info({ cron: 'recurring-tasks', rulesProcessed: result.rulesProcessed, tasksCreated: result.tasksCreated.length, errors: result.errors }, 'Recurring tasks processed');

  return NextResponse.json({
    ok: true,
    rulesProcessed: result.rulesProcessed,
    tasksCreated: result.tasksCreated.length,
    errors: result.errors,
  });
}
