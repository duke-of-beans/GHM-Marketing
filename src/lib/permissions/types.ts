/**
 * GHM Dashboard - Granular Permission System
 * Type definitions for feature-flag based permissions
 */

export interface UserPermissions {
  // ==========================================
  // CLIENT MANAGEMENT
  // ==========================================
  canViewAllClients: boolean;      // See all clients (not just own deals)
  canEditClients: boolean;          // Edit client profiles
  canManageTasks: boolean;          // Create/assign tasks for clients
  canAccessContentStudio: boolean;  // Generate content for clients
  
  // ==========================================
  // SALES & DISCOVERY
  // ==========================================
  canAccessDiscovery: boolean;      // Use lead discovery tools
  canClaimAnyLead: boolean;         // Claim leads outside assigned territory
  canReassignLeads: boolean;        // Move leads between reps
  
  // ==========================================
  // INTELLIGENCE & SCANNING
  // ==========================================
  canViewCompetitiveScans: boolean; // See competitive intel data
  canTriggerScans: boolean;         // Manually trigger competitive scans
  canAccessVoiceCapture: boolean;   // Use SCRVNR voice capture system
  
  // ==========================================
  // ANALYTICS & REPORTING
  // ==========================================
  canViewTeamAnalytics: boolean;    // See company-wide metrics
  canViewOthersEarnings: boolean;   // See other reps' commissions
  canGenerateReports: boolean;      // Create client reports
  
  // ==========================================
  // SYSTEM FEATURES (Global - Not Togglable)
  // ==========================================
  canReportBugs: boolean;           // Bug reporting (controlled by global settings)
  canAccessOwnDashboard: boolean;   // Personal metrics (always true for all users)
}

/**
 * Permission preset identifiers
 */
export type PermissionPreset = 
  | 'sales_basic'      // Default for new sales reps
  | 'sales_advanced'   // High performers
  | 'master_lite'      // Post-sale manager (Arian's use case)
  | 'master_full'      // Full manager
  | 'custom';          // Manually configured

/**
 * Feature categories for UI organization
 */
export const PERMISSION_CATEGORIES = {
  CLIENT_MANAGEMENT: {
    label: 'Client Management',
    permissions: [
      'canViewAllClients',
      'canEditClients',
      'canManageTasks',
      'canAccessContentStudio',
    ] as (keyof UserPermissions)[],
  },
  SALES_DISCOVERY: {
    label: 'Sales & Discovery',
    permissions: [
      'canAccessDiscovery',
      'canClaimAnyLead',
      'canReassignLeads',
    ] as (keyof UserPermissions)[],
  },
  INTELLIGENCE: {
    label: 'Intelligence & Scanning',
    permissions: [
      'canViewCompetitiveScans',
      'canTriggerScans',
      'canAccessVoiceCapture',
    ] as (keyof UserPermissions)[],
  },
  ANALYTICS: {
    label: 'Analytics & Reporting',
    permissions: [
      'canViewTeamAnalytics',
      'canViewOthersEarnings',
      'canGenerateReports',
    ] as (keyof UserPermissions)[],
  },
} as const;

/**
 * Permission labels for UI display
 */
export const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  // Client Management
  canViewAllClients: 'View All Clients',
  canEditClients: 'Edit Client Profiles',
  canManageTasks: 'Manage Client Tasks',
  canAccessContentStudio: 'Access Content Studio',
  
  // Sales & Discovery
  canAccessDiscovery: 'Access Lead Discovery',
  canClaimAnyLead: 'Claim Any Lead',
  canReassignLeads: 'Reassign Leads',
  
  // Intelligence
  canViewCompetitiveScans: 'View Competitive Scans',
  canTriggerScans: 'Trigger Scans',
  canAccessVoiceCapture: 'Voice Capture (SCRVNR)',
  
  // Analytics
  canViewTeamAnalytics: 'View Team Analytics',
  canViewOthersEarnings: "View Others' Earnings",
  canGenerateReports: 'Generate Reports',
  
  // System
  canReportBugs: 'Report Bugs',
  canAccessOwnDashboard: 'Access Own Dashboard',
};

/**
 * Permission descriptions for tooltips
 */
export const PERMISSION_DESCRIPTIONS: Record<keyof UserPermissions, string> = {
  // Client Management
  canViewAllClients: 'View all clients in the system, not just own assigned clients',
  canEditClients: 'Edit client profiles, settings, and configurations',
  canManageTasks: 'Create, assign, and manage tasks for clients',
  canAccessContentStudio: 'Generate and manage content for clients',
  
  // Sales & Discovery
  canAccessDiscovery: 'Use lead discovery tools to find new prospects',
  canClaimAnyLead: 'Claim leads outside assigned territory',
  canReassignLeads: 'Move leads between sales representatives',
  
  // Intelligence
  canViewCompetitiveScans: 'View competitive intelligence and scan results',
  canTriggerScans: 'Manually trigger competitive scans for clients',
  canAccessVoiceCapture: 'Capture and manage brand voice profiles',
  
  // Analytics
  canViewTeamAnalytics: 'View company-wide performance metrics and analytics',
  canViewOthersEarnings: 'See commission and earnings data for other team members',
  canGenerateReports: 'Create and download client performance reports',
  
  // System
  canReportBugs: 'Submit bug reports and technical issues',
  canAccessOwnDashboard: 'View personal dashboard and metrics',
};

/**
 * Master-only features that NEVER get permission toggles
 * These are hard-coded to role="master" or role="owner"
 */
export const MASTER_ONLY_FEATURES = [
  'settings_panel',
  'compensation_management',
  'user_permission_management',
  'api_key_configuration',
  'global_system_configuration',
] as const;

/**
 * Type guard to check if a user has a specific permission
 */
export function isUserPermissions(obj: unknown): obj is UserPermissions {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const permissions = obj as Record<string, unknown>;
  
  // Check all required permissions exist and are boolean
  const requiredKeys: (keyof UserPermissions)[] = [
    'canViewAllClients',
    'canEditClients',
    'canManageTasks',
    'canAccessContentStudio',
    'canAccessDiscovery',
    'canClaimAnyLead',
    'canReassignLeads',
    'canViewCompetitiveScans',
    'canTriggerScans',
    'canAccessVoiceCapture',
    'canViewTeamAnalytics',
    'canViewOthersEarnings',
    'canGenerateReports',
    'canReportBugs',
    'canAccessOwnDashboard',
  ];
  
  return requiredKeys.every(
    (key) => key in permissions && typeof permissions[key] === 'boolean'
  );
}

/**
 * User with permissions (from database)
 */
export interface UserWithPermissions {
  id: number;
  role: 'master' | 'sales';
  permissions: UserPermissions;
  permissionPreset: PermissionPreset;
}
