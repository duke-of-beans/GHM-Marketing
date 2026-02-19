import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

// Re-export client-safe utilities so existing server imports keep working
export { ROLE_LABELS, isElevated } from "./roles";
export type { AppRole } from "./roles";
import { isElevated } from "./roles";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  territoryId: number | null;
  territoryName: string | null;
};

/**
 * Get the current authenticated user or redirect to login.
 */
export async function getCurrentUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

/**
 * Require elevated (master or admin) role, or redirect to sales dashboard.
 */
export async function requireMaster(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!isElevated(user.role)) redirect("/sales");
  return user;
}

/**
 * Require admin role specifically, or redirect to master dashboard.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (user.role !== "admin") redirect("/master");
  return user;
}

/**
 * Build a Prisma where clause that respects territory boundaries.
 * Elevated users (admin/master) see all; sales reps see only their territory.
 */
export function territoryFilter(user: SessionUser) {
  if (isElevated(user.role)) return {};
  return { territoryId: user.territoryId ?? -1 };
}
