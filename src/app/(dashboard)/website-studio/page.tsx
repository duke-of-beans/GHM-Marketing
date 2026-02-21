import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/permissions";
import { WebsiteStudioLanding } from "@/components/studio/website-studio-landing";

/**
 * /website-studio — top-level Website Studio entry point.
 *
 * UX-002: Promoted from client detail tab to first-class nav entry.
 * Renders StudioClientPicker → WebsiteStudioTab once a client is selected.
 * Supports ?clientId=123 for deep links from client records.
 */
export default async function WebsiteStudioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  await requirePermission("manage_clients");

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <WebsiteStudioLanding />
    </div>
  );
}
