import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/team-messages — fetch messages visible to the current user
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const userRole = (session.user as any).role as string;
  const { searchParams } = new URL(req.url);
  const feed = searchParams.get("feed") === "true";
  const limit = parseInt(searchParams.get("limit") ?? "50");

  // Messages visible to this user:
  // 1. Sent by this user
  // 2. audience = "all"
  // 3. audience = "role" and audienceValue matches their role
  // 4. audience = "user" and recipientId = this user
  // Only top-level messages (no parentId) — replies are nested
  const messages = await prisma.teamMessage.findMany({
    where: {
      parentId: null,
      OR: [
        { authorId: userId },
        { audienceType: "all" },
        { audienceType: "role", audienceValue: userRole },
        { audienceType: "user", recipientId: userId },
      ],
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
      recipient: { select: { id: true, name: true, role: true } },
      replies: {
        include: {
          author: { select: { id: true, name: true, role: true } },
          reads: { where: { userId }, select: { readAt: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      reads: { where: { userId }, select: { readAt: true } },
    },
    orderBy: [
      { isPinned: "desc" },
      { createdAt: "desc" },
    ],
    take: feed ? 20 : limit,
  });

  // Unread count — messages (and replies in threads) not yet read by this user
  const unreadCount = await prisma.teamMessage.count({
    where: {
      parentId: null,
      reads: { none: { userId } },
      OR: [
        { audienceType: "all" },
        { audienceType: "role", audienceValue: userRole },
        { audienceType: "user", recipientId: userId },
      ],
    },
  });

  return NextResponse.json({ messages, unreadCount });
}

// POST /api/team-messages — create a new message
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const body = await req.json();
  const { content, audienceType = "all", audienceValue, recipientId, parentId, priority = "normal", isPinned = false } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  // Only masters can pin or set urgent priority
  const userRole = (session.user as any).role;
  const canPin = userRole === "master";

  const message = await prisma.teamMessage.create({
    data: {
      content: content.trim(),
      authorId: userId,
      audienceType,
      audienceValue: audienceValue ?? null,
      recipientId: recipientId ? parseInt(recipientId) : null,
      parentId: parentId ? parseInt(parentId) : null,
      priority,
      isPinned: canPin ? isPinned : false,
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
      recipient: { select: { id: true, name: true, role: true } },
      reads: true,
    },
  });

  // Auto-mark as read for the author
  await prisma.teamMessageRead.create({
    data: { messageId: message.id, userId },
  });

  return NextResponse.json({ message }, { status: 201 });
}
