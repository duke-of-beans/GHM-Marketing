/**
 * Default Dashboard Layouts — per role
 *
 * Sprint 35 / UX-FEAT-003
 *
 * First-time users get a role-appropriate layout instead of empty/random order.
 * Once set, the layout is persisted to `user.dashboardLayout` and never overwritten.
 *
 * Grid: 12 columns, each row unit ≈ 80px
 */

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

/**
 * Admin / Manager layout — bird's-eye operational view
 *
 * Row 0: Revenue metrics (wide) + Client Health
 * Row 1: Team Activity + Goals tracker
 * Row 2: Quick Actions
 */
export const ADMIN_DEFAULT_LAYOUT: LayoutItem[] = [
  { i: "revenue-metrics",   x: 0, y: 0, w: 7, h: 3, minW: 4, minH: 2 },
  { i: "client-health",     x: 7, y: 0, w: 5, h: 3, minW: 3, minH: 2 },
  { i: "team-activity",     x: 0, y: 3, w: 6, h: 3, minW: 4, minH: 2 },
  { i: "goals-tracker",     x: 6, y: 3, w: 6, h: 3, minW: 3, minH: 2 },
  { i: "quick-actions",     x: 0, y: 6, w: 12, h: 2, minW: 6, minH: 2 },
];

/**
 * Sales Rep layout — pipeline-focused, earnings visible
 *
 * Row 0: My Pipeline (wide) + Assigned Clients
 * Row 1: Needs Attention + Sales Tools
 * Row 2: My Earnings
 */
export const SALES_REP_DEFAULT_LAYOUT: LayoutItem[] = [
  { i: "my-pipeline",       x: 0, y: 0, w: 7, h: 3, minW: 4, minH: 2 },
  { i: "assigned-clients",  x: 7, y: 0, w: 5, h: 3, minW: 3, minH: 2 },
  { i: "needs-attention",   x: 0, y: 3, w: 6, h: 3, minW: 4, minH: 2 },
  { i: "sales-tools",       x: 6, y: 3, w: 6, h: 3, minW: 3, minH: 2 },
  { i: "my-earnings",       x: 0, y: 6, w: 12, h: 2, minW: 6, minH: 2 },
];

/**
 * Get the default layout for a given role.
 * Falls back to admin layout for unrecognized roles.
 */
export function getDefaultLayoutForRole(role: string): LayoutItem[] {
  switch (role) {
    case "ADMIN":
    case "OWNER":
    case "MANAGER":
      return ADMIN_DEFAULT_LAYOUT;
    case "SALES_REP":
    case "JUNIOR_REP":
      return SALES_REP_DEFAULT_LAYOUT;
    default:
      return ADMIN_DEFAULT_LAYOUT;
  }
}
