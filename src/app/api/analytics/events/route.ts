import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/analytics/events
// Lightweight event ingestion — fire-and-forget from client components.
// No auth overhead beyond session check; silently drops if unauthenticated.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      // Unauthenticated — silently drop (don't expose 401 for analytics calls)
      return NextResponse.json({ ok: true });
    }

    const body = await req.json();
    const { eventType, page, feature, metadata, sessionId } = body;

    if (!eventType) return NextResponse.json({ ok: true });

    await prisma.dashboardEvent.create({
      data: {
        userId: Number(session.user.id),
        eventType: String(eventType).slice(0, 64),
        page: page ? String(page).slice(0, 256) : null,
        feature: feature ? String(feature).slice(0, 128) : null,
        metadata: metadata ?? undefined,
        sessionId: sessionId ? String(sessionId).slice(0, 64) : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Analytics must never crash the caller
    return NextResponse.json({ ok: true });
  }
}
