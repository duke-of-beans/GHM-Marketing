/**
 * GHM Dashboard - Permission Checker
 * Utilities for checking user permissions
 */

import { UserPermissions, UserWithPermissions, isUserPermissions } from './types';
import { getDefaultPermissionsForRole } from './presets';

/**
 * Check if a user has a specific permission
 * @param user User object with permissions
 * @param permission Permission key to check
 * @returns true if user has the permission
 */
export function hasPermission(
  user: UserWithPermissions | null | undefined,
  permission: keyof UserPermissions
): boolean {
  if (!user) return false;
  
  // Master-only features bypass permission system
  if (user.role === 'master' && isMasterOnlyFeature(permission)) {
    return true;
  }
  
  // Validate permissions object
  if (!isUserPermissions(user.permissions)) {
    console.warn('Invalid permissions object, using role defaults');
    const defaults = getDefaultPermissionsForRole(user.role);
    return defaults[permission];
  }
  
  return user.permissions[permission] === true;
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(
  user: UserWithPermissions | null | undefined,
  permissions: (keyof UserPermissions)[]
): boolean {
  return permissions.some(p => hasPermission(user, p));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(
  user: UserWithPermissions | null | undefined,
  permissions: (keyof UserPermissions)[]
): boolean {
  return permissions.every(p => hasPermission(user, p));
}

/**
 * Check if permission is a master-only feature
 * These never get permission toggles
 */
function isMasterOnlyFeature(permission: keyof UserPermissions): boolean {
  // Master-only features are NOT in the permission system
  // They're hard-coded to role checks in the UI
  return false;
}

/**
 * Get user's role (for backwards compatibility with role-based checks)
 */
export function getUserRole(user: UserWithPermissions | null | undefined): 'master' | 'sales' | null {
  return user?.role ?? null;
}

/**
 * Check if user is master (for hard-coded master features)
 */
export function isMaster(user: UserWithPermissions | null | undefined): boolean {
  return user?.role === 'master';
}

/**
 * Check if user can access Settings panel
 * Hard-coded to master role only
 */
export function canAccessSettings(user: UserWithPermissions | null | undefined): boolean {
  return isMaster(user);
}

/**
 * Check if user can manage compensation
 * Hard-coded to master role only
 */
export function canManageCompensation(user: UserWithPermissions | null | undefined): boolean {
  return isMaster(user);
}

/**
 * Check if user can manage user permissions
 * Hard-coded to master role only
 */
export function canManageUserPermissions(user: UserWithPermissions | null | undefined): boolean {
  return isMaster(user);
}

/**
 * Helper to build permission-aware navigation items
 */
export function filterNavItemsByPermissions<T extends { permission?: keyof UserPermissions }>(
  items: T[],
  user: UserWithPermissions | null | undefined
): T[] {
  return items.filter(item => {
    if (!item.permission) return true; // No permission required
    return hasPermission(user, item.permission);
  });
}

/**
 * Get summary of what user can do (for debugging/display)
 */
export function getPermissionSummary(user: UserWithPermissions | null | undefined): {
  role: string;
  preset: string;
  enabledPermissions: (keyof UserPermissions)[];
  disabledPermissions: (keyof UserPermissions)[];
} | null {
  if (!user) return null;
  
  const permissions = user.permissions;
  if (!isUserPermissions(permissions)) {
    return null;
  }
  
  const enabled: (keyof UserPermissions)[] = [];
  const disabled: (keyof UserPermissions)[] = [];
  
  (Object.keys(permissions) as (keyof UserPermissions)[]).forEach(key => {
    if (permissions[key]) {
      enabled.push(key);
    } else {
      disabled.push(key);
    }
  });
  
  return {
    role: user.role,
    preset: user.permissionPreset,
    enabledPermissions: enabled,
    disabledPermissions: disabled,
  };
}
