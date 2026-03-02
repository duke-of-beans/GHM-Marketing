/**
 * GET /api/team-messages/stream
 * Server-Sent Events — pushes lightweight events when new team messages arrive
 * or when users are typing. Client re-fetches messages on each "message" event.
 *
 * Events emitted:
 *   connected  — on open
 *   message    — new message id (client re-fetches)
 *   typing     — JSON array of { userId, name } currently typing
 *   reconnect  — client should reconnect (sent before auto-close)
 *
 * Heartbeat: 25s to survive proxy timeouts.
 * Message poll: 5s DB check for new message id.
 * Typing poll: 2s in-memory check (best-effort, ephemeral).
 * Auto-close: 4.5 min (under Vercel's 5-min function cap — client reconnects).
 */

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveTypers } from "@/lib/team/typing-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const userId = parseInt(session.user.id);
  const userRole = (session.user as { role?: string }).role as string;

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

      // Poll DB for new messages every 5s
      const messagePoll = setInterval(async () => {
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

      // Poll typing store every 2s (best-effort, in-memory)
      let lastTypingSnapshot = "";
      const typingPoll = setInterval(() => {
        if (closed) return;
        const typers = getActiveTypers(userId);
        const snapshot = JSON.stringify(typers);
        if (snapshot !== lastTypingSnapshot) {
          lastTypingSnapshot = snapshot;
          enqueue(`event: typing\ndata: ${snapshot}\n\n`);
        }
      }, 2_000);

      const timeout = setTimeout(() => {
        closed = true;
        clearInterval(heartbeat);
        clearInterval(messagePoll);
        clearInterval(typingPoll);
        enqueue("event: reconnect\ndata: timeout\n\n");
        try { controller.close(); } catch { /* already closed */ }
      }, 270_000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(heartbeat);
        clearInterval(messagePoll);
        clearInterval(typingPoll);
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
