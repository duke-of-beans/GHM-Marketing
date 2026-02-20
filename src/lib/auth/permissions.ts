import { redirect } from "next/navigation";
import { getCurrentUser, SessionUser, isElevated } from "./session";

/**
 * Permission categories matching the UI permission management system
 */
export type PermissionKey =
  | "view_all_leads"
  | "manage_leads"
  | "view_all_clients"
  | "manage_clients"
  | "view_analytics"
  | "manage_team"
  | "manage_territories"
  | "manage_products"
  | "view_payments"
  | "manage_payments"
  | "manage_settings";

/**
 * UserPermissions interface matching database JSON structure
 */
export interface UserPermissions {
  view_all_leads?: boolean;
  manage_leads?: boolean;
  view_all_clients?: boolean;
  manage_clients?: boolean;
  view_analytics?: boolean;
  manage_team?: boolean;
  manage_territories?: boolean;
  manage_products?: boolean;
  view_payments?: boolean;
  manage_payments?: boolean;
  manage_settings?: boolean;
}

/**
 * Permission presets matching database permissionPreset field
 */
export const PERMISSION_PRESETS: Record<string, UserPermissions> = {
  sales_basic: {
    view_all_leads: false,
    manage_leads: true,
    view_all_clients: false,
    manage_clients: true,
    view_analytics: false,
    manage_team: false,
    manage_territories: false,
    manage_products: false,
    view_payments: false,
    manage_payments: false,
    manage_settings: false,
  },
  sales_advanced: {
    view_all_leads: true,
    manage_leads: true,
    view_all_clients: true,
    manage_clients: true,
    view_analytics: true,
    manage_team: false,
    manage_territories: false,
    manage_products: false,
    view_payments: true,
    manage_payments: false,
    manage_settings: false,
  },
  master_lite: {
    view_all_leads: true,
    manage_leads: true,
    view_all_clients: true,
    manage_clients: true,
    view_analytics: true,
    manage_team: true,
    manage_territories: false,
    manage_products: true,
    view_payments: true,
    manage_payments: true,
    manage_settings: true,
  },
  master_full: {
    view_all_leads: true,
    manage_leads: true,
    view_all_clients: true,
    manage_clients: true,
    view_analytics: true,
    manage_team: true,
    manage_territories: true,
    manage_products: true,
    view_payments: true,
    manage_payments: true,
    manage_settings: true,
  },
};

/**
 * Get effective permissions for a user
 * Combines preset permissions with custom overrides
 */
export function getUserPermissions(user: SessionUser & { permissions?: unknown; permissionPreset?: string }): UserPermissions {
  // Admin role always gets all permissions — no preset or override needed
  if ((user as any).role === "admin") {
    return Object.fromEntries(
      (Object.keys(PERMISSION_PRESETS.master_full) as PermissionKey[]).map((k) => [k, true])
    ) as UserPermissions;
  }

  // Start with preset permissions
  const preset = user.permissionPreset || "sales_basic";
  const basePermissions = PERMISSION_PRESETS[preset] || PERMISSION_PRESETS.sales_basic;

  // Apply custom overrides if present
  if (user.permissions && typeof user.permissions === "object") {
    return { ...basePermissions, ...user.permissions };
  }

  return basePermissions;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  user: SessionUser & { permissions?: unknown; permissionPreset?: string },
  permission: PermissionKey
): boolean {
  const permissions = getUserPermissions(user);
  return permissions[permission] === true;
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(
  user: SessionUser & { permissions?: unknown; permissionPreset?: string },
  ...requiredPermissions: PermissionKey[]
): boolean {
  const permissions = getUserPermissions(user);
  return requiredPermissions.every((perm) => permissions[perm] === true);
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(
  user: SessionUser & { permissions?: unknown; permissionPreset?: string },
  ...requiredPermissions: PermissionKey[]
): boolean {
  const permissions = getUserPermissions(user);
  return requiredPermissions.some((perm) => permissions[perm] === true);
}

/**
 * Require specific permission or redirect
 * Use in Server Components and Server Actions
 */
export async function requirePermission(permission: PermissionKey): Promise<SessionUser> {
  const user = await getCurrentUser();
  
  // Fetch full user data with permissions from database
  const { prisma } = await import("@/lib/db");
  const fullUser = await prisma.user.findUnique({
    where: { id: parseInt(user.id) },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      territoryId: true,
      permissions: true,
      permissionPreset: true,
      territory: {
        select: { name: true },
      },
    },
  });

  if (!fullUser) {
    redirect("/login");
  }

  const userWithPermissions = {
    ...user,
    permissions: fullUser.permissions,
    permissionPreset: fullUser.permissionPreset,
  };

  if (!hasPermission(userWithPermissions, permission)) {
    // Redirect to appropriate dashboard based on role
    redirect(user.role === "master" ? "/master" : "/sales");
  }

  return user;
}

/**
 * Require ANY of the specified permissions or redirect
 */
export async function requireAnyPermission(...permissions: PermissionKey[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  
  const { prisma } = await import("@/lib/db");
  const fullUser = await prisma.user.findUnique({
    where: { id: parseInt(user.id) },
    select: {
      id: true,
      permissions: true,
      permissionPreset: true,
    },
  });

  if (!fullUser) {
    redirect("/login");
  }

  const userWithPermissions = {
    ...user,
    permissions: fullUser.permissions,
    permissionPreset: fullUser.permissionPreset,
  };

  if (!hasAnyPermission(userWithPermissions, ...permissions)) {
    redirect(isElevated(user.role) ? "/master" : "/sales");
  }

  return user;
}

/**
 * Require ALL of the specified permissions or redirect
 */
export async function requireAllPermissions(...permissions: PermissionKey[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  
  const { prisma } = await import("@/lib/db");
  const fullUser = await prisma.user.findUnique({
    where: { id: parseInt(user.id) },
    select: {
      id: true,
      permissions: true,
      permissionPreset: true,
    },
  });

  if (!fullUser) {
    redirect("/login");
  }

  const userWithPermissions = {
    ...user,
    permissions: fullUser.permissions,
    permissionPreset: fullUser.permissionPreset,
  };

  if (!hasAllPermissions(userWithPermissions, ...permissions)) {
    redirect(isElevated(user.role) ? "/master" : "/sales");
  }

  return user;
}
