/**
 * GHM Dashboard - Permissions System
 * Exports all permission-related utilities
 */

// Types
export type {
  UserPermissions,
  PermissionPreset,
  UserWithPermissions,
} from './types';

export {
  PERMISSION_CATEGORIES,
  PERMISSION_LABELS,
  PERMISSION_DESCRIPTIONS,
  MASTER_ONLY_FEATURES,
  isUserPermissions,
} from './types';

// Presets
export {
  SALES_BASIC_PRESET,
  SALES_ADVANCED_PRESET,
  MASTER_LITE_PRESET,
  MASTER_FULL_PRESET,
  PERMISSION_PRESETS,
  PRESET_METADATA,
  getPreset,
  getDefaultPermissionsForRole,
  matchesPreset,
  detectPreset,
} from './presets';

// Checker utilities
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserRole,
  isMaster,
  canAccessSettings,
  canManageCompensation,
  canManageUserPermissions,
  filterNavItemsByPermissions,
  getPermissionSummary,
} from './checker';

// Middleware (server-side)
export {
  requirePermission,
  requireMaster,
  requireAnyPermission,
  requireAllPermissions,
  withPermission,
  withMasterOnly,
} from './middleware';
