import { requirePermission } from "@/lib/auth/permissions";
import { BugsPageClient } from "@/components/bugs/bugs-page-client";

export default async function BugsPage() {
  await requirePermission("manage_settings");

  return <BugsPageClient />;
}
