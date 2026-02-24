import { requirePermission } from "@/lib/auth/permissions";
import { TerritoriesClient } from "@/components/territories/territories-client";

export default async function TerritoriesPage() {
  await requirePermission("manage_territories");

  return <TerritoriesClient />;
}
