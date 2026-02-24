/**
 * GHM Dashboard - Permission Presets
 * Template configurations for common permission patterns
 */

import { UserPermissions, PermissionPreset } from './types';

/**
 * Preset 1: Sales Basic (Default for new reps)
 */
export const SALES_BASIC_PRESET: UserPermissions = {
  canViewAllClients: false,
  canEditClients: false,
  canManageTasks: false,
  canAccessContentStudio: false,
  canAccessDiscovery: true,
  canClaimAnyLead: false,
  canReassignLeads: false,
  canViewCompetitiveScans: false,
  canTriggerScans: false,
  canAccessVoiceCapture: false,
  canViewTeamAnalytics: false,
  canViewOthersEarnings: false,
  canGenerateReports: false,
  canReportBugs: true,
  canAccessOwnDashboard: true,
};

/**
 * Preset 2: Sales Advanced (High performers)
 */
export const SALES_ADVANCED_PRESET: UserPermissions = {
  canViewAllClients: false,
  canEditClients: false,
  canManageTasks: false,
  canAccessContentStudio: true,
  canAccessDiscovery: true,
  canClaimAnyLead: false,
  canReassignLeads: false,
  canViewCompetitiveScans: true,
  canTriggerScans: false,
  canAccessVoiceCapture: true,
  canViewTeamAnalytics: false,
  canViewOthersEarnings: false,
  canGenerateReports: true,
  canReportBugs: true,
  canAccessOwnDashboard: true,
};

/**
 * Preset 3: Manager Lite (Post-sale manager)
 */
export const MANAGER_LITE_PRESET: UserPermissions = {
  canViewAllClients: true,
  canEditClients: true,
  canManageTasks: true,
  canAccessContentStudio: true,
  canAccessDiscovery: true,
  canClaimAnyLead: false,
  canReassignLeads: false,
  canViewCompetitiveScans: true,
  canTriggerScans: false,
  canAccessVoiceCapture: true,
  canViewTeamAnalytics: false,
  canViewOthersEarnings: false,
  canGenerateReports: true,
  canReportBugs: true,
  canAccessOwnDashboard: true,
};

/**
 * Preset 4: Manager Full
 */
export const MANAGER_FULL_PRESET: UserPermissions = {
  canViewAllClients: true,
  canEditClients: true,
  canManageTasks: true,
  canAccessContentStudio: true,
  canAccessDiscovery: true,
  canClaimAnyLead: true,
  canReassignLeads: true,
  canViewCompetitiveScans: true,
  canTriggerScans: true,
  canAccessVoiceCapture: true,
  canViewTeamAnalytics: true,
  canViewOthersEarnings: true,
  canGenerateReports: true,
  canReportBugs: true,
  canAccessOwnDashboard: true,
};

export const PERMISSION_PRESETS: Record<PermissionPreset, UserPermissions | null> = {
  sales_basic: SALES_BASIC_PRESET,
  sales_advanced: SALES_ADVANCED_PRESET,
  manager_lite: MANAGER_LITE_PRESET,
  manager_full: MANAGER_FULL_PRESET,
  custom: null,
};

export const PRESET_METADATA: Record<PermissionPreset, {
  label: string;
  description: string;
  recommendedFor: string;
}> = {
  sales_basic: {
    label: 'Sales Basic',
    description: 'Minimal access for new sales representatives',
    recommendedFor: 'New sales reps, entry-level team members',
  },
  sales_advanced: {
    label: 'Sales Advanced',
    description: 'Enhanced access for high-performing sales reps',
    recommendedFor: 'Top performers, senior sales reps',
  },
  manager_lite: {
    label: 'Manager Lite',
    description: 'Client management without full manager privileges',
    recommendedFor: 'Post-sale managers, client success roles',
  },
  manager_full: {
    label: 'Manager Full',
    description: 'Full manager access to all features',
    recommendedFor: 'Operations managers, team leads',
  },
  custom: {
    label: 'Custom',
    description: 'Manually configured permissions',
    recommendedFor: 'Unique roles requiring custom access',
  },
};

export function getPreset(presetName: PermissionPreset): UserPermissions | null {
  return PERMISSION_PRESETS[presetName];
}

export function getDefaultPermissionsForRole(role: string): UserPermissions {
  return (role === 'manager' || role === 'admin') ? MANAGER_FULL_PRESET : SALES_BASIC_PRESET;
}

export function matchesPreset(
  permissions: UserPermissions,
  presetName: Exclude<PermissionPreset, 'custom'>
): boolean {
  const preset = PERMISSION_PRESETS[presetName];
  if (!preset) return false;
  
  return Object.keys(preset).every(
    (key) => permissions[key as keyof UserPermissions] === preset[key as keyof UserPermissions]
  );
}

export function detectPreset(permissions: UserPermissions): PermissionPreset {
  const presets: Exclude<PermissionPreset, 'custom'>[] = [
    'sales_basic',
    'sales_advanced',
    'manager_lite',
    'manager_full',
  ];
  
  for (const presetName of presets) {
    if (matchesPreset(permissions, presetName)) {
      return presetName;
    }
  }
  
  return 'custom';
}
