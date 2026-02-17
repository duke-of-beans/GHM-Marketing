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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Review</h1>
        <p className="text-sm text-muted-foreground">
          Review and approve content drafts before they go live for clients — {tasksInReview.length} {tasksInReview.length === 1 ? "task" : "tasks"} awaiting review
        </p>
      </div>

      <ReviewQueue tasks={tasksInReview} />
    </div>
  );
}
