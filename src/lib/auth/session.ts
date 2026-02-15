import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";

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
 * Use in Server Components and Server Actions.
 */
export async function getCurrentUser(): Promise<SessionUser> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session.user as SessionUser;
}

/**
 * Require master role or redirect to sales dashboard.
 */
export async function requireMaster(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (user.role !== "master") {
    redirect("/sales");
  }

  return user;
}

/**
 * Build a Prisma where clause that respects territory boundaries.
 * Master sees all, sales reps see only their territory.
 */
export function territoryFilter(user: SessionUser) {
  if (user.role === "master") {
    return {}; // No filter - master sees everything
  }

  return {
    territoryId: user.territoryId ?? -1, // -1 matches nothing if no territory
  };
}
