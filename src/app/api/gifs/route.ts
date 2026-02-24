/**
 * GET /api/gifs?q=query&limit=20
 * Proxies Tenor GIF search. Keeps API key server-side.
 * Falls back to Giphy if GIPHY_API_KEY is set and Tenor is unavailable.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const TENOR_KEY = process.env.TENOR_API_KEY ?? "AIzaSyAyimkuYQYF_FXVALexPzDistribution"; // public demo key
const GIPHY_KEY = process.env.GIPHY_API_KEY ?? null;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 30);

  try {
    if (q) {
      // Search
      const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${TENOR_KEY}&limit=${limit}&media_filter=gif,tinygif&contentfilter=medium`;
      const res = await fetch(url, { next: { revalidate: 60 } });
      const data = await res.json();
      const gifs = (data.results ?? []).map(normalizeTenor);
      return NextResponse.json({ gifs });
    } else {
      // Featured / trending
      const url = `https://tenor.googleapis.com/v2/featured?key=${TENOR_KEY}&limit=${limit}&media_filter=gif,tinygif&contentfilter=medium`;
      const res = await fetch(url, { next: { revalidate: 300 } });
      const data = await res.json();
      const gifs = (data.results ?? []).map(normalizeTenor);
      return NextResponse.json({ gifs });
    }
  } catch (err) {
    // Fallback: Giphy
    if (GIPHY_KEY) {
      try {
        const endpoint = q
          ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=${limit}&rating=pg-13`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=${limit}&rating=pg-13`;
        const res = await fetch(endpoint, { next: { revalidate: 60 } });
        const data = await res.json();
        const gifs = (data.data ?? []).map(normalizeGiphy);
        return NextResponse.json({ gifs });
      } catch {
        // both failed
      }
    }
    console.error("[gifs]", err);
    return NextResponse.json({ gifs: [] });
  }
}

function normalizeTenor(item: any) {
  const gif = item.media_formats?.gif ?? item.media_formats?.tinygif ?? {};
  const preview = item.media_formats?.tinygif ?? item.media_formats?.gif ?? {};
  return {
    id: item.id,
    url: gif.url ?? "",
    previewUrl: preview.url ?? gif.url ?? "",
    width: gif.dims?.[0] ?? 200,
    height: gif.dims?.[1] ?? 200,
    title: item.title ?? "",
  };
}

function normalizeGiphy(item: any) {
  return {
    id: item.id,
    url: item.images?.original?.url ?? "",
    previewUrl: item.images?.fixed_width_small?.url ?? item.images?.original?.url ?? "",
    width: parseInt(item.images?.original?.width ?? "200"),
    height: parseInt(item.images?.original?.height ?? "200"),
    title: item.title ?? "",
  };
}
