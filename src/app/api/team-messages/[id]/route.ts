import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";
import { getUserPermissions } from "@/lib/auth/permissions";

// POST /api/team-messages/[id]/read — mark a message as read
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const messageId = parseInt(params.id);

  await prisma.teamMessageRead.upsert({
    where: { messageId_userId: { messageId, userId } },
    create: { messageId, userId },
    update: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

// PATCH /api/team-messages/[id] — update pin/priority (manage_team permission)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const permissionError = await withPermission(req, "manage_team");
  if (permissionError) return permissionError;

  const messageId = parseInt(params.id);
  const body = await req.json();
  const { isPinned, priority } = body;

  const updated = await prisma.teamMessage.update({
    where: { id: messageId },
    data: {
      ...(isPinned !== undefined && { isPinned }),
      ...(priority !== undefined && { priority }),
    },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  return NextResponse.json({ message: updated });
}

// DELETE /api/team-messages/[id] — author or manage_team can delete
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const messageId = parseInt(params.id);

  const message = await prisma.teamMessage.findUnique({ where: { id: messageId } });
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Author can always delete their own; otherwise check manage_team permission
  if (message.authorId !== userId) {
    const fullUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { permissions: true, permissionPreset: true, role: true },
    });
    const permissions = getUserPermissions({
      ...session.user,
      permissions: fullUser?.permissions,
      permissionPreset: fullUser?.permissionPreset,
    });
    if (!permissions.manage_team) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await prisma.teamMessage.delete({ where: { id: messageId } });
  return NextResponse.json({ ok: true });
}
