/**
 * PUT /api/notifications/read
 * Body: { ids?: number[] }  — omit ids to mark all as read
 */

import { NextRequest, NextResponse } from "next/server";
import { markNotificationsRead } from "@/lib/ops/notification-service";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUserWithPermissions();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const ids: number[] | undefined = body.ids;

    await markNotificationsRead(parseInt(user.id), ids);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PUT /api/notifications/read]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
