import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getClients, getPortfolioStats } from "@/lib/db/clients";
import type { SessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "master") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);

  const [clients, stats] = await Promise.all([
    getClients({
      status: searchParams.status || "active",
      healthMin: searchParams.healthMin ? parseInt(searchParams.healthMin) : undefined,
      healthMax: searchParams.healthMax ? parseInt(searchParams.healthMax) : undefined,
    }),
    getPortfolioStats(),
  ]);

  return NextResponse.json({ success: true, data: { clients, stats } });
}
