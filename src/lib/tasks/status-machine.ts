/**
 * Task Pipeline — Status Machine
 *
 * Defines valid status transitions, permission requirements,
 * and side effects for each transition.
 */

// ============================================================================
// STATUS DEFINITIONS
// ============================================================================

export const TASK_STATUSES = {
  queued: { label: "Queued", color: "gray", sortWeight: 0 },
  in_progress: { label: "In Progress", color: "blue", sortWeight: 1 },
  review: { label: "In Review", color: "amber", sortWeight: 2 },
  approved: { label: "Approved", color: "green", sortWeight: 3 },
  deployed: { label: "Deployed", color: "emerald", sortWeight: 4 },
  measuring: { label: "Measuring", color: "purple", sortWeight: 5 },
  complete: { label: "Complete", color: "teal", sortWeight: 6 },
  rejected: { label: "Rejected", color: "red", sortWeight: -1 },
  cancelled: { label: "Cancelled", color: "slate", sortWeight: -2 },
} as const;

export type TaskStatus = keyof typeof TASK_STATUSES;

// ============================================================================
// TRANSITION RULES
// ============================================================================

interface TransitionRule {
  to: TaskStatus;
  label: string; // Button text in UI
  requiresElevated: boolean; // Only admin/master can trigger
  requiresComment: boolean; // Must include a reason
}

/**
 * Map of valid transitions from each status.
 * If a transition isn't listed, it's not allowed.
 */
export const TRANSITIONS: Record<TaskStatus, TransitionRule[]> = {
  queued: [
    { to: "in_progress", label: "Start Work", requiresElevated: false, requiresComment: false },
    { to: "cancelled", label: "Cancel", requiresElevated: true, requiresComment: true },
  ],
  in_progress: [
    { to: "review", label: "Submit for Review", requiresElevated: false, requiresComment: false },
    { to: "queued", label: "Put Back", requiresElevated: false, requiresComment: false },
    { to: "cancelled", label: "Cancel", requiresElevated: true, requiresComment: true },
  ],
  review: [
    { to: "approved", label: "Approve", requiresElevated: true, requiresComment: false },
    { to: "in_progress", label: "Request Changes", requiresElevated: true, requiresComment: true },
    { to: "rejected", label: "Reject", requiresElevated: true, requiresComment: true },
  ],
  approved: [
    { to: "deployed", label: "Mark Deployed", requiresElevated: false, requiresComment: false },
    { to: "in_progress", label: "Reopen", requiresElevated: true, requiresComment: true },
  ],
  deployed: [
    { to: "measuring", label: "Start Measuring", requiresElevated: false, requiresComment: false },
    { to: "complete", label: "Mark Complete", requiresElevated: false, requiresComment: false },
  ],
  measuring: [
    { to: "complete", label: "Mark Complete", requiresElevated: false, requiresComment: false },
    { to: "in_progress", label: "Reopen", requiresElevated: true, requiresComment: true },
  ],
  complete: [
    { to: "in_progress", label: "Reopen", requiresElevated: true, requiresComment: true },
  ],
  rejected: [
    { to: "queued", label: "Re-queue", requiresElevated: true, requiresComment: false },
  ],
  cancelled: [
    { to: "queued", label: "Re-queue", requiresElevated: true, requiresComment: false },
  ],
};

// ============================================================================
// VALIDATION
// ============================================================================

export function isValidStatus(status: string): status is TaskStatus {
  return status in TASK_STATUSES;
}

export function getValidTransitions(currentStatus: TaskStatus, isElevated: boolean): TransitionRule[] {
  const rules = TRANSITIONS[currentStatus] || [];
  return rules.filter((r) => !r.requiresElevated || isElevated);
}

export function canTransition(
  fromStatus: string,
  toStatus: string,
  isElevated: boolean
): { allowed: boolean; requiresComment: boolean; error?: string } {
  if (!isValidStatus(fromStatus)) {
    return { allowed: false, requiresComment: false, error: `Invalid current status: ${fromStatus}` };
  }
  if (!isValidStatus(toStatus)) {
    return { allowed: false, requiresComment: false, error: `Invalid target status: ${toStatus}` };
  }

  const rules = TRANSITIONS[fromStatus];
  const rule = rules.find((r) => r.to === toStatus);

  if (!rule) {
    return { allowed: false, requiresComment: false, error: `Cannot move from "${fromStatus}" to "${toStatus}"` };
  }

  if (rule.requiresElevated && !isElevated) {
    return { allowed: false, requiresComment: false, error: `Only managers/admins can ${rule.label.toLowerCase()}` };
  }

  return { allowed: true, requiresComment: rule.requiresComment };
}

// ============================================================================
// PRIORITY
// ============================================================================

export const TASK_PRIORITIES = {
  P1: { label: "Critical", color: "red", sortWeight: 1 },
  P2: { label: "High", color: "orange", sortWeight: 2 },
  P3: { label: "Medium", color: "yellow", sortWeight: 3 },
  P4: { label: "Low", color: "green", sortWeight: 4 },
} as const;

export type TaskPriority = keyof typeof TASK_PRIORITIES;

// ============================================================================
// HELPERS
// ============================================================================

/** Active statuses that appear in the queue */
export const ACTIVE_STATUSES: TaskStatus[] = ["queued", "in_progress", "review", "approved"];

/** Terminal statuses that don't appear in queue by default */
export const TERMINAL_STATUSES: TaskStatus[] = ["deployed", "measuring", "complete", "rejected", "cancelled"];

/** Statuses that count as "done" for metrics */
export const DONE_STATUSES: TaskStatus[] = ["deployed", "measuring", "complete"];
