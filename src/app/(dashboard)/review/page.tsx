import { requirePermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { ReviewQueue } from "@/components/review/review-queue";

export default async function ReviewPage() {
  await requirePermission("manage_clients");

  // Get all tasks in review status
  const tasksInReview = await prisma.clientTask.findMany({
    where: {
      status: "in-review",
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
      { priority: "asc" }, // P1, P2, P3
      { createdAt: "desc" },
    ],
  });

  // Count tasks waiting more than 5 days
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const staleCount = tasksInReview.filter(
    (t) => new Date(t.updatedAt) < fiveDaysAgo
  ).length;

  const subtitle = tasksInReview.length === 0
    ? "No tasks awaiting review right now"
    : [
        `${tasksInReview.length} ${tasksInReview.length === 1 ? "task" : "tasks"} awaiting review`,
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

      <ReviewQueue tasks={tasksInReview} />
    </div>
  );
}
