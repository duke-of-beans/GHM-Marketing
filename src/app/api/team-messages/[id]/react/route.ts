/**
 * POST   /api/team-messages/[id]/react  — toggle a reaction (add if absent, remove if present)
 * Body: { emoji: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const messageId = parseInt(params.id);
  const { emoji } = await req.json();

  if (!emoji || typeof emoji !== "string" || emoji.length > 10) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }

  // Verify message exists
  const message = await prisma.teamMessage.findUnique({ where: { id: messageId }, select: { id: true } });
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Toggle: upsert creates, then check if it already existed
  const existing = await prisma.teamMessageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
  });

  if (existing) {
    await prisma.teamMessageReaction.delete({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });
    return NextResponse.json({ action: "removed", emoji });
  } else {
    await prisma.teamMessageReaction.create({
      data: { messageId, userId, emoji },
    });
    return NextResponse.json({ action: "added", emoji });
  }
}
