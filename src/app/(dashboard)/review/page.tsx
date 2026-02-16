import { requireMaster } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ReviewQueue } from "@/components/review/review-queue";

export default async function ReviewPage() {
  const user = await requireMaster();

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
        <h1 className="text-2xl font-bold">Content Review Queue</h1>
        <p className="text-sm text-muted-foreground">
          {tasksInReview.length} {tasksInReview.length === 1 ? "task" : "tasks"} awaiting review
        </p>
      </div>

      <ReviewQueue tasks={tasksInReview} />
    </div>
  );
}
