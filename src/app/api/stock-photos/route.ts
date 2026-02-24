/**
 * GET /api/stock-photos?q=query&page=1&per_page=20&source=unsplash|pexels
 * Proxies Unsplash and Pexels. Keeps API keys server-side.
 * Returns normalized photo objects regardless of source.
 *
 * Unsplash: free, requires attribution (photographer name + link in UI)
 * Pexels: free, no attribution required but appreciated
 *
 * env: UNSPLASH_ACCESS_KEY, PEXELS_API_KEY
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY ?? null;
const PEXELS_KEY = process.env.PEXELS_API_KEY ?? null;

export interface StockPhoto {
  id: string;
  source: "unsplash" | "pexels";
  thumbUrl: string;
  regularUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  description: string | null;
  photographer: string;
  photographerUrl: string;
  photoPageUrl: string; // required for Unsplash attribution
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const perPage = Math.min(20, parseInt(searchParams.get("per_page") ?? "20"));
  const source = searchParams.get("source") ?? (UNSPLASH_KEY ? "unsplash" : PEXELS_KEY ? "pexels" : "demo");

  if (!q) return NextResponse.json({ photos: [], total: 0 });

  try {
    if (source === "unsplash" && UNSPLASH_KEY) {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}&orientation=landscape`;
      const res = await fetch(url, {
        headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
        next: { revalidate: 300 },
      });
      if (!res.ok) throw new Error(`Unsplash ${res.status}`);
      const data = await res.json();
      const photos: StockPhoto[] = (data.results ?? []).map((p: any) => ({
        id: p.id,
        source: "unsplash",
        thumbUrl: p.urls.thumb,
        regularUrl: p.urls.regular,
        fullUrl: p.urls.full,
        width: p.width,
        height: p.height,
        description: p.alt_description ?? p.description ?? null,
        photographer: p.user.name,
        photographerUrl: p.user.links.html + "?utm_source=ghm_dashboard&utm_medium=referral",
        photoPageUrl: p.links.html + "?utm_source=ghm_dashboard&utm_medium=referral",
      }));
      return NextResponse.json({ photos, total: data.total ?? photos.length, source: "unsplash" });
    }

    if (source === "pexels" && PEXELS_KEY) {
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&page=${page}&per_page=${perPage}&orientation=landscape`;
      const res = await fetch(url, {
        headers: { Authorization: PEXELS_KEY },
        next: { revalidate: 300 },
      });
      if (!res.ok) throw new Error(`Pexels ${res.status}`);
      const data = await res.json();
      const photos: StockPhoto[] = (data.photos ?? []).map((p: any) => ({
        id: String(p.id),
        source: "pexels",
        thumbUrl: p.src.medium,
        regularUrl: p.src.large,
        fullUrl: p.src.original,
        width: p.width,
        height: p.height,
        description: p.alt ?? null,
        photographer: p.photographer,
        photographerUrl: p.photographer_url,
        photoPageUrl: p.url,
      }));
      return NextResponse.json({ photos, total: data.total_results ?? photos.length, source: "pexels" });
    }

    // No API keys — return empty with guidance
    return NextResponse.json({
      photos: [],
      total: 0,
      message: "Set UNSPLASH_ACCESS_KEY or PEXELS_API_KEY in environment to enable stock photos.",
    });
  } catch (err) {
    console.error("[stock-photos]", err);
    return NextResponse.json({ photos: [], total: 0, error: "Search failed" }, { status: 500 });
  }
}
