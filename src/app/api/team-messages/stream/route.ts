/**
 * GET /api/team-messages/stream
 * Server-Sent Events — pushes a lightweight "message" event when new
 * team messages arrive. Client re-fetches on each event rather than
 * receiving full payloads (stateless, simple, cheap).
 *
 * Heartbeat: 25s to survive proxy timeouts.
 * Poll interval: 5s DB check on new message id.
 * Auto-close: 4.5 min (under Vercel's 5-min function cap — client reconnects).
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const userId = parseInt(session.user.id);
  const userRole = (session.user as any).role as string;

  const audienceFilter = {
    OR: [
      { audienceType: "all" },
      { audienceType: "role", audienceValue: userRole },
      { audienceType: "user", recipientId: userId },
      { authorId: userId },
    ],
  };

  const latestAtStart = await prisma.teamMessage.findFirst({
    where: { parentId: null, ...audienceFilter },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  let lastSeenId = latestAtStart?.id ?? 0;
  let closed = false;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (data: string) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(data)); }
        catch { closed = true; }
      };

      enqueue("event: connected\ndata: ok\n\n");

      const heartbeat = setInterval(() => enqueue(": heartbeat\n\n"), 25_000);

      const poll = setInterval(async () => {
        if (closed) return;
        try {
          const newest = await prisma.teamMessage.findFirst({
            where: { parentId: null, id: { gt: lastSeenId }, ...audienceFilter },
            orderBy: { createdAt: "desc" },
            select: { id: true },
          });
          if (newest && newest.id > lastSeenId) {
            lastSeenId = newest.id;
            enqueue(`event: message\ndata: ${newest.id}\n\n`);
          }
        } catch { /* skip tick on DB error */ }
      }, 5_000);

      const timeout = setTimeout(() => {
        closed = true;
        clearInterval(heartbeat);
        clearInterval(poll);
        enqueue("event: reconnect\ndata: timeout\n\n");
        try { controller.close(); } catch { /* already closed */ }
      }, 270_000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(heartbeat);
        clearInterval(poll);
        clearTimeout(timeout);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
