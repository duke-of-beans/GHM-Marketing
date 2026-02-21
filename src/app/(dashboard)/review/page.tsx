import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { ReviewQueue } from "@/components/review/review-queue";

export default async function ReviewPage() {
  await requirePermission("manage_clients");

  // ── Task-based reviews ───────────────────────────────────────────────────
  // BUG-008 FIX: Status machine stores "review" (no hyphen). Was querying "in-review" — never matched.
  const tasksInReview = await prisma.clientTask.findMany({
    where: {
      status: "review",
    },
    include: {
      client: {
        select: {
          id: true,
          businessName: true,
        },
      },
    },
    orderBy: [
      { priority: "asc" },
      { createdAt: "desc" },
    ],
  });

  // ── Content-based reviews ────────────────────────────────────────────────
  // BUG-007 FIX: Content Studio items submitted for review live in ClientContent, not ClientTask.
  // The review queue must show both so approval reaches the correct record in each system.
  const contentInReview = await prisma.clientContent.findMany({
    where: {
      status: "review",
    },
    include: {
      client: {
        select: {
          id: true,
          businessName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalItems = tasksInReview.length + contentInReview.length;

  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const staleTaskCount = tasksInReview.filter(
    (t) => new Date(t.updatedAt) < fiveDaysAgo
  ).length;
  const staleContentCount = contentInReview.filter(
    (c) => new Date(c.updatedAt) < fiveDaysAgo
  ).length;
  const staleCount = staleTaskCount + staleContentCount;

  const subtitle = totalItems === 0
    ? "No items awaiting review right now"
    : [
        `${totalItems} ${totalItems === 1 ? "item" : "items"} awaiting review`,
        tasksInReview.length > 0 && `${tasksInReview.length} task ${tasksInReview.length === 1 ? "draft" : "drafts"}`,
        contentInReview.length > 0 && `${contentInReview.length} content ${contentInReview.length === 1 ? "piece" : "pieces"}`,
        staleCount > 0 && `⚠️ ${staleCount} waiting over 5 days`,
      ].filter(Boolean).join(" · ");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Review</h1>
        <p className={`text-sm ${staleCount > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
          {subtitle}
        </p>
      </div>

      <ReviewQueue tasks={tasksInReview} contentItems={contentInReview} />
    </div>
  );
}
