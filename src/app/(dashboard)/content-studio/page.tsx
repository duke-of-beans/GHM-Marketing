import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/permissions";
import { ContentStudioLanding } from "@/components/studio/content-studio-landing";

/**
 * /content-studio — top-level Content Studio entry point.
 *
 * UX-002: Promoted from client detail tab to first-class nav entry.
 * Renders StudioClientPicker → ContentStudioTab once a client is selected.
 * Supports ?clientId=123 for deep links from client records.
 */
export default async function ContentStudioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  await requirePermission("manage_clients");

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <ContentStudioLanding />
    </div>
  );
}
