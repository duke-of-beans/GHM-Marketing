import { getGBPClient } from "@/lib/enrichment/providers/google-business/client";
import { fetchInsights } from "@/lib/enrichment/providers/google-business/insights";
import { listReviews } from "@/lib/enrichment/providers/google-business/reviews";
import { listPosts } from "@/lib/enrichment/providers/google-business/posts";

export interface GBPPerformanceSection {
  hasData: boolean;
  connected: boolean;
  insights: {
    impressionsSearch: number;
    impressionsMaps: number;
    websiteClicks: number;
    callClicks: number;
    directionRequests: number;
    period: string;
  } | null;
  reviews: {
    total: number;
    averageRating: number | null;
    newInPeriod: number;
    unanswered: number;
    recentSnippets: Array<{ rating: number; snippet: string; date: string }>;
  } | null;
  posts: {
    publishedInPeriod: number;
  } | null;
}

export async function generateGBPPerformanceSection(
  clientId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<GBPPerformanceSection> {
  const empty: GBPPerformanceSection = {
    hasData: false,
    connected: false,
    insights: null,
    reviews: null,
    posts: null,
  };

  const gbp = await getGBPClient(clientId);
  if (!gbp) return empty;

  const daysBack = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / 86400000);

  try {
    const [insightsData, reviewsData, postsData] = await Promise.allSettled([
      fetchInsights(gbp, daysBack),
      listReviews(gbp, 100),
      listPosts(gbp),
    ]);

    // Aggregate daily insights into period totals
    const insightsSection = (() => {
      if (insightsData.status !== "fulfilled") return null;
      const { daily } = insightsData.value;
      const inRange = daily.filter((d) => {
        const dt = new Date(d.date);
        return dt >= periodStart && dt <= periodEnd;
      });
      if (inRange.length === 0) return null;
      const sum = inRange.reduce(
        (acc, d) => ({
          impressionsSearch: acc.impressionsSearch + d.impressionsMobile + (d.impressionsDesktop > 0 ? d.impressionsDesktop : 0),
          impressionsMaps: acc.impressionsMaps + d.impressionsDesktop,
          websiteClicks: acc.websiteClicks + d.websiteClicks,
          callClicks: acc.callClicks + d.callClicks,
          directionRequests: acc.directionRequests + d.directionRequests,
        }),
        { impressionsSearch: 0, impressionsMaps: 0, websiteClicks: 0, callClicks: 0, directionRequests: 0 }
      );
      return {
        ...sum,
        period: `${periodStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${periodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      };
    })();

    // Reviews
    const reviewsSection = (() => {
      if (reviewsData.status !== "fulfilled") return null;
      const reviews = reviewsData.value;
      if (reviews.length === 0) return null;
      const periodReviews = reviews.filter((r) => {
        const d = new Date(r.createTime);
        return d >= periodStart && d <= periodEnd;
      });
      const unanswered = reviews.filter((r) => r.replyText === null).length;
      const ratings = reviews.map((r) => r.rating).filter((r) => r > 0);
      const avgRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null;
      const recentSnippets = reviews.slice(0, 3).map((r) => ({
        rating: r.rating,
        snippet: r.comment.slice(0, 120),
        date: r.createTime,
      }));
      return { total: reviews.length, averageRating: avgRating, newInPeriod: periodReviews.length, unanswered, recentSnippets };
    })();

    // Posts
    const postsSection = (() => {
      if (postsData.status !== "fulfilled") return null;
      const posts = postsData.value;
      const periodPosts = posts.filter((p) => {
        const d = new Date(p.createTime);
        return d >= periodStart && d <= periodEnd;
      });
      return { publishedInPeriod: periodPosts.length };
    })();

    return {
      hasData: !!(insightsSection || reviewsSection),
      connected: true,
      insights: insightsSection,
      reviews: reviewsSection,
      posts: postsSection,
    };
  } catch {
    return { ...empty, connected: true };
  }
}
