import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addClientNote } from "@/lib/db/clients";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { isElevated } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (!isElevated(user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);

  const where: Record<string, unknown> = { clientId: parseInt(id) };
  if (searchParams.type) where.type = searchParams.type;
  if (searchParams.taskId) where.taskId = parseInt(searchParams.taskId);
  if (searchParams.pinned === "true") where.isPinned = true;

  const notes = await prisma.clientNote.findMany({
    where,
    include: {
      author: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ success: true, data: notes });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (!isElevated(user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  if (!body.content || !body.type) {
    return NextResponse.json(
      { success: false, error: "content and type are required" },
      { status: 400 }
    );
  }

  const note = await addClientNote({
    clientId: parseInt(id),
    authorId: parseInt(user.id),
    content: body.content,
    type: body.type,
    taskId: body.taskId ? parseInt(body.taskId) : undefined,
    isPinned: body.isPinned || false,
    tags: body.tags,
  });

  return NextResponse.json({ success: true, data: note }, { status: 201 });
}
