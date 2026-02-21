import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TasksPageClient } from "@/components/tasks/tasks-page-client";

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <TasksPageClient
        currentUserId={parseInt(session.user.id)}
        currentUserRole={session.user.role}
      />
    </div>
  );
}
