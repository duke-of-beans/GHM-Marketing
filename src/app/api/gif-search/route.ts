/**
 * GET /api/gif-search?q=<query>&limit=<n>
 * Proxies Tenor API. Uses TENOR_API_KEY if set, otherwise falls back to the
 * Tenor demo key (rate-limited but functional for low-traffic internal tools).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const TENOR_KEY = process.env.TENOR_API_KEY ?? "LIVDSRZULELA"; // Tenor demo key
const TENOR_BASE = "https://tenor.googleapis.com/v2";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "16"), 32);

  if (!q) return NextResponse.json({ results: [] });

  try {
    const url = new URL(`${TENOR_BASE}/search`);
    url.searchParams.set("q", q);
    url.searchParams.set("key", TENOR_KEY);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("media_filter", "gif,tinygif");
    url.searchParams.set("contentfilter", "medium");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      console.error(`[gif-search] Tenor API error: ${res.status} ${res.statusText}`);
      throw new Error(`Tenor ${res.status}`);
    }

    const data = await res.json();

    const results = (data.results ?? []).map((item: any) => {
      const tinygif = item.media_formats?.tinygif;
      const gif = item.media_formats?.gif;
      return {
        id: item.id,
        title: item.title ?? "",
        preview: tinygif?.url ?? gif?.url ?? "",
        url: gif?.url ?? tinygif?.url ?? "",
        dims: gif?.dims ?? tinygif?.dims ?? [200, 200],
      };
    });

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[gif-search]", err);
    return NextResponse.json({ results: [] });
  }
}
