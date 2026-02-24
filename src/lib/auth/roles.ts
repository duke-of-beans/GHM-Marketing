/**
 * Client-safe role utilities.
 * These are pure functions/constants with NO server-only imports,
 * safe to use in both "use client" and server components.
 */

export type AppRole = "admin" | "manager" | "sales";

/** Human-readable role labels for display. */
export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  manager: "Manager",
  sales: "Sales Rep",
};

/**
 * True for roles that have elevated (manager-level or above) access.
 * Replaces scattered `role === "manager"` checks so admin is automatically included.
 */
export function isElevated(role: string): boolean {
  return role === "admin" || role === "manager";
}
