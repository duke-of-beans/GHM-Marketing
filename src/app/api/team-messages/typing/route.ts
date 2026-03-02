/**
 * POST /api/team-messages/typing
 * Fire-and-forget endpoint — registers the calling user as currently typing.
 * No DB write. Expires after 4s in the in-memory store.
 * Client fires this debounced (500ms) on compose box keystrokes.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setTyping } from "@/lib/team/typing-store";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const userName = (session.user as { name?: string }).name ?? "Someone";

  setTyping(userId, userName);

  return NextResponse.json({ ok: true });
}
