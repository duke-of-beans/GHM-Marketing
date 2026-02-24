/**
 * GHM Dashboard - Permission Checker
 * Utilities for checking user permissions
 */

import { UserPermissions, UserWithPermissions } from './types';
import { SALES_BASIC_PRESET } from './presets';

/** True for admin or manager roles. */
function isElevated(role: string): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Check if a user has a specific permission.
 * Elevated users (admin/manager) default to true for any permission.
 */
export function hasPermission(
  user: UserWithPermissions | null | undefined,
  permission: keyof UserPermissions
): boolean {
  if (!user) return false;
  if (isElevated(user.role)) return user.permissions[permission] ?? true;
  return user.permissions[permission] ?? false;
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(
  user: UserWithPermissions | null | undefined,
  permissions: (keyof UserPermissions)[]
): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(
  user: UserWithPermissions | null | undefined,
  permissions: (keyof UserPermissions)[]
): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if user has elevated access (admin or manager).
 * Replaces isMaster() — use this for manager-level gates.
 */
export function isMaster(user: UserWithPermissions | null | undefined): boolean {
  return isElevated(user?.role ?? '');
}

/**
 * Check if user is admin (owner-level only).
 */
export function isAdmin(user: UserWithPermissions | null | undefined): boolean {
  return user?.role === 'admin';
}

/**
 * Get safe permissions object with defaults
 */
export function getSafePermissions(permissions: unknown): UserPermissions {
  if (!permissions || typeof permissions !== 'object') {
    return SALES_BASIC_PRESET;
  }

  const perms = permissions as Partial<UserPermissions>;
  return {
    canViewAllClients: perms.canViewAllClients ?? false,
    canEditClients: perms.canEditClients ?? false,
    canManageTasks: perms.canManageTasks ?? false,
    canAccessContentStudio: perms.canAccessContentStudio ?? false,
    canAccessDiscovery: perms.canAccessDiscovery ?? true,
    canClaimAnyLead: perms.canClaimAnyLead ?? false,
    canReassignLeads: perms.canReassignLeads ?? false,
    canViewCompetitiveScans: perms.canViewCompetitiveScans ?? false,
    canTriggerScans: perms.canTriggerScans ?? false,
    canAccessVoiceCapture: perms.canAccessVoiceCapture ?? false,
    canViewTeamAnalytics: perms.canViewTeamAnalytics ?? false,
    canViewOthersEarnings: perms.canViewOthersEarnings ?? false,
    canGenerateReports: perms.canGenerateReports ?? false,
    canReportBugs: perms.canReportBugs ?? true,
    canAccessOwnDashboard: perms.canAccessOwnDashboard ?? true,
  };
}

/**
 * Filter users that have a specific permission
 */
export function filterUsersByPermission(
  users: UserWithPermissions[],
  permission: keyof UserPermissions
): UserWithPermissions[] {
  return users.filter(user => hasPermission(user, permission));
}

/**
 * Check if user can view a specific client
 */
export function canViewClient(
  user: UserWithPermissions | null | undefined,
  clientUserId: number | null
): boolean {
  if (!user) return false;
  if (isElevated(user.role)) return true;
  if (hasPermission(user, 'canViewAllClients')) return true;
  return clientUserId === user.id;
}

/**
 * Check if user can edit a specific client
 */
export function canEditClient(
  user: UserWithPermissions | null | undefined,
  clientUserId: number | null
): boolean {
  if (!user) return false;
  if (isElevated(user.role)) return true;
  if (hasPermission(user, 'canEditClients')) return true;
  return clientUserId === user.id;
}
