import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/bug-reports
 * Submit a bug report or feature request. Any authenticated user.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      type = "bug",
      title,
      description,
      category = "other",
      severity = "medium",
      pageUrl = "",
      userAgent = "",
      screenResolution = "",
      browserInfo,
      consoleErrors,
      networkErrors,
      recentActions,
      sessionData,
    } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const report = await prisma.bugReport.create({
      data: {
        userId: parseInt(session.user.id),
        userEmail: session.user.email ?? "",
        userName: session.user.name ?? "",
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        pageUrl,
        userAgent,
        screenResolution,
        browserInfo: browserInfo ?? undefined,
        consoleErrors: consoleErrors ?? undefined,
        networkErrors: networkErrors ?? undefined,
        recentActions: recentActions ?? undefined,
        sessionData: sessionData ?? undefined,
      },
    });

    return NextResponse.json({ data: { id: report.id } }, { status: 201 });
  } catch (error) {
    console.error("Bug report submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit bug report" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bug-reports
 * List bug reports. Admin only.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const severity = searchParams.get("severity");

    const where: any = {};
    if (status && status !== "all") where.status = status;
    if (type && type !== "all") where.type = type;
    if (category && category !== "all") where.category = category;
    if (severity && severity !== "all") where.severity = severity;

    const reports = await prisma.bugReport.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true } },
        resolver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error("Bug report list error:", error);
    return NextResponse.json(
      { error: "Failed to load bug reports" },
      { status: 500 }
    );
  }
}
