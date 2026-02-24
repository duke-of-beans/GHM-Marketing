// ============================================================================
// Bulk Operations — Shared Types
// Consistent request/response shape across all bulk routes
// ============================================================================

export type BulkOperationResult = {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{ id: number; message: string }>;
  summary?: string;
};

export type BulkLeadOperation =
  | { operation: "stage"; params: { stage: string } }
  | { operation: "assign"; params: { salesRepId: number | null } }
  | { operation: "archive"; params?: Record<string, never> }
  | { operation: "delete"; params?: Record<string, never> }
  | { operation: "enrich"; params?: { force?: boolean } };

export type BulkClientOperation =
  | { operation: "status"; params: { status: string } }
  | { operation: "assign_rep"; params: { salesRepId: number | null } }
  | { operation: "assign_manager"; params: { masterManagerId: number | null } }
  | { operation: "scan"; params?: Record<string, never> }
  | { operation: "report"; params?: { send?: boolean } };

export type BulkContentOperation =
  | { operation: "approve"; params?: Record<string, never> }
  | { operation: "reject"; params?: Record<string, never> }
  | { operation: "archive"; params?: Record<string, never> }
  | { operation: "assign"; params: { assignedToId: number | null } };

export type BulkTaskOperation =
  | { operation: "close"; params?: Record<string, never> }
  | { operation: "reassign"; params: { assignedToId: number | null } }
  | { operation: "create_for_clients"; params: {
      clientIds: number[];
      title: string;
      type: string;
      description?: string;
      dueOffset?: number;
    }};

export type BulkUserOperation =
  | { operation: "role"; params: { role: "admin" | "master" | "sales" } }
  | { operation: "position"; params: { positionId: number | null } }
  | { operation: "territory"; params: { territoryId: number | null } }
  | { operation: "deactivate"; params?: Record<string, never> }
  | { operation: "activate"; params?: Record<string, never> }
  | { operation: "reset_onboarding"; params?: Record<string, never> };

export type BulkRequest<T> = { ids: number[] } & T;

export function bulkResponse(
  results: { id: number; error?: string }[],
  overrideSummary?: string
): Response {
  const errors = results.filter(r => r.error).map(r => ({ id: r.id, message: r.error! }));
  const processed = results.length - errors.length;
  const body: BulkOperationResult = {
    success: errors.length === 0,
    processed,
    failed: errors.length,
    errors,
    summary: overrideSummary ?? `${processed} succeeded, ${errors.length} failed`,
  };
  return Response.json(body, { status: errors.length === results.length ? 400 : 200 });
}
