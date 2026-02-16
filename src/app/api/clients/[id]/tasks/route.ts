import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getClientTasks, createTask } from "@/lib/db/clients";
import type { SessionUser } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "master") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "master") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
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

  return NextResponse.json({ success: true, data: task }, { status: 201 });
}
