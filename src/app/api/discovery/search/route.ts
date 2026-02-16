import { NextRequest, NextResponse } from "next/server";
import { requireMaster } from "@/lib/auth/session";

const OUTSCRAPER_API_KEY = process.env.OUTSCRAPER_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    await requireMaster();

    const body = await req.json();
    const { keyword, location, minReviews = 10, minRating = 3.5, limit = 50 } = body;

    if (!keyword || !location) {
      return NextResponse.json(
        { error: "Keyword and location required" },
        { status: 400 }
      );
    }

    // Call Outscraper Maps API
    const query = `${keyword} in ${location}`;
    const outscraperUrl = `https://api.app.outscraper.com/maps/search-v3?query=${encodeURIComponent(query)}&limit=${limit}&language=en&region=us`;

    const response = await fetch(outscraperUrl, {
      headers: {
        "X-API-KEY": OUTSCRAPER_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Outscraper API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const businesses = data.data?.[0] || [];

    // Qualify and filter results
    const qualified = businesses
      .map((business: any) => {
        const reviewCount = business.reviews || 0;
        const rating = business.rating || 0;

        // Calculate qualification score
        const qualScore = calculateQualificationScore(business);

        return {
          placeId: business.place_id,
          name: business.name,
          address: business.full_address || business.address,
          phone: business.phone,
          website: business.site,
          rating,
          reviewCount,
          category: business.category || business.type || "Unknown",
          qualificationScore: qualScore.score,
          reasons: qualScore.reasons,
          rawData: business, // Store for import
        };
      })
      .filter((b: any) => b.reviewCount >= minReviews && b.rating >= minRating)
      .sort((a: any, b: any) => b.qualificationScore - a.qualificationScore);

    return NextResponse.json({
      success: true,
      results: qualified,
      total: qualified.length,
    });
  } catch (error) {
    console.error("Discovery search failed:", error);
    return NextResponse.json(
      { error: "Search failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Calculate qualification score (0-100) based on business characteristics
 */
function calculateQualificationScore(business: any): {
  score: number;
  reasons: string[];
} {
  let score = 50; // Base score
  const reasons: string[] = [];

  // Review count impact (max +20)
  const reviews = business.reviews || 0;
  if (reviews >= 100) {
    score += 20;
    reasons.push("High review count");
  } else if (reviews >= 50) {
    score += 15;
    reasons.push("Good review count");
  } else if (reviews >= 25) {
    score += 10;
  }

  // Rating impact (max +15)
  const rating = business.rating || 0;
  if (rating >= 4.5) {
    score += 15;
    reasons.push("Excellent rating");
  } else if (rating >= 4.0) {
    score += 10;
    reasons.push("Good rating");
  } else if (rating >= 3.5) {
    score += 5;
  }

  // Has website (+10)
  if (business.site) {
    score += 10;
    reasons.push("Has website");
  } else {
    reasons.push("⚠️ No website");
  }

  // Recent activity (+5)
  if (business.working_hours || business.popular_times) {
    score += 5;
  }

  // Business status
  if (business.status === "OPERATIONAL") {
    score += 5;
  }

  // Verified business (+5)
  if (business.verified) {
    score += 5;
    reasons.push("Verified");
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    reasons,
  };
}
