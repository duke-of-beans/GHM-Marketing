import { Metadata } from "next";
import { getCurrentUserWithPermissions } from "@/lib/auth/api-permissions";
import { isElevated } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { RecurringTasksClient } from "@/components/tasks/recurring-tasks-client";

export const metadata: Metadata = { title: "Recurring Tasks" };

export default async function RecurringTasksPage() {
  const user = await getCurrentUserWithPermissions();
  if (!user) redirect("/login");
  if (!isElevated(user.role)) redirect("/tasks");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recurring Tasks</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Automate task creation on a schedule. Rules run daily at 06:00 UTC.
        </p>
      </div>
      <RecurringTasksClient />
    </div>
  );
}
