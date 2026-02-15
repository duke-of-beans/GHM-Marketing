import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNoteSchema } from "@/lib/validations";
import type { SessionUser } from "@/lib/auth/session";
import { territoryFilter } from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ success: false, error: "Invalid lead ID" }, { status: 400 });
  }

  const user = session.user as unknown as SessionUser;
  const baseFilter = territoryFilter(user);

  // Verify lead access
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...baseFilter },
    select: { id: true },
  });

  if (!lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  const notes = await prisma.note.findMany({
    where: { leadId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
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

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ success: false, error: "Invalid lead ID" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = createNoteSchema.safeParse({ ...body, leadId });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid note", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = session.user as unknown as SessionUser;
  const baseFilter = territoryFilter(user);

  // Verify lead access
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, ...baseFilter },
    select: { id: true },
  });

  if (!lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  const note = await prisma.note.create({
    data: {
      leadId,
      userId: Number(user.id),
      content: parsed.data.content,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ success: true, data: note }, { status: 201 });
}
