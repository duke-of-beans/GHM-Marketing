import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getClientTasks, createTask } from "@/lib/db/clients";
import { prisma } from "@/lib/db";
import { sendPushToUsers } from "@/lib/push";
import { withPermission } from "@/lib/auth/api-permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const { id } = await params;
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);

  const tasks = await getClientTasks(parseInt(id), {
    status: searchParams.status || undefined,
    category: searchParams.category || undefined,
    priority: searchParams.priority || undefined,
  });

  return NextResponse.json({ success: true, data: tasks });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const permissionError = await withPermission(request, "manage_clients");
  if (permissionError) return permissionError;

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (!body.title || !body.category) {
    return NextResponse.json(
      { success: false, error: "title and category are required" },
      { status: 400 }
    );
  }

  const task = await createTask(parseInt(id), {
    title: body.title,
    description: body.description,
    category: body.category,
    priority: body.priority,
    source: body.source,
    assignedTo: body.assignedTo,
    targetKeywords: body.targetKeywords,
    competitorRef: body.competitorRef,
    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
  });

  // Fire push if a specific user was assigned and global setting is enabled
  if (body.assignedTo) {
    const settings = await prisma.globalSettings.findFirst({ select: { pushTasksEnabled: true } });
    if (settings?.pushTasksEnabled !== false) {
      // assignedTo is a string username/identifier in the ClientTask schema, not a userId
      // Try to find a matching user by name or email for notification
      const assignee = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { equals: body.assignedTo, mode: "insensitive" } },
            { email: { equals: body.assignedTo, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });
      if (assignee) {
        const clientData = await prisma.clientProfile.findFirst({
          where: { id: parseInt(id) },
          select: { businessName: true },
        });
        await sendPushToUsers([assignee.id], {
          title: "📋 New task assigned",
          body: `${task.title}${clientData ? ` — ${clientData.businessName}` : ""}`,
          url: `/clients/${id}?tab=tasks`,
          tag: `task-${task.id}`,
        });
      }
    }
  }

  return NextResponse.json({ success: true, data: task }, { status: 201 });
}