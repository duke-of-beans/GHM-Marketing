/**
 * GHM Dashboard - Permission Checker
 * Utilities for checking user permissions
 */

import { UserPermissions, UserWithPermissions } from './types';
import { SALES_BASIC_PRESET } from './presets';

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  user: UserWithPermissions | null | undefined,
  permission: keyof UserPermissions
): boolean {
  if (!user) return false;
  
  // Owner role has all permissions (except master-only features handled elsewhere)
  if (user.role === 'master') {
    // Masters get all permissions by default
    return user.permissions[permission] ?? true;
  }
  
  // Sales reps check their specific permissions
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
 * Check if user is a master (for hard-coded master-only features)
 */
export function isMaster(user: UserWithPermissions | null | undefined): boolean {
  return user?.role === 'master';
}

/**
 * Get safe permissions object with defaults
 */
export function getSafePermissions(
  permissions: unknown
): UserPermissions {
  // If permissions is invalid or empty, return default
  if (!permissions || typeof permissions !== 'object') {
    return SALES_BASIC_PRESET;
  }
  
  const perms = permissions as Partial<UserPermissions>;
  
  // Return with defaults for any missing keys
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
 * (either owns it, or has canViewAllClients)
 */
export function canViewClient(
  user: UserWithPermissions | null | undefined,
  clientUserId: number | null
): boolean {
  if (!user) return false;
  
  // Masters can view all clients
  if (user.role === 'master') return true;
  
  // Can view all clients permission
  if (hasPermission(user, 'canViewAllClients')) return true;
  
  // Can view own clients
  return clientUserId === user.id;
}

/**
 * Check if user can edit a specific client
 * (either owns it, or has canEditClients for all)
 */
export function canEditClient(
  user: UserWithPermissions | null | undefined,
  clientUserId: number | null
): boolean {
  if (!user) return false;
  
  // Masters can edit all clients
  if (user.role === 'master') return true;
  
  // Can edit all clients permission
  if (hasPermission(user, 'canEditClients')) return true;
  
  // Can edit own clients (if they're assigned to them)
  return clientUserId === user.id;
}
