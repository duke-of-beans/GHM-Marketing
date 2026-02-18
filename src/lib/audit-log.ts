import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";

export type AuditAction =
  | "page_access"
  | "api_call"
  | "permission_check"
  | "permission_denied"
  | "data_export"
  | "data_create"
  | "data_update"
  | "data_delete"
  | "login"
  | "logout"
  | "settings_update"
  | "user_create"
  | "user_update"
  | "user_delete";

export type AuditStatus = "success" | "denied" | "error";

export interface AuditLogParams {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  action: AuditAction;
  resource?: string;
  permission?: string;
  method?: string;
  status: AuditStatus;
  statusCode?: number;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  duration?: number;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(params: AuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userName: params.userName,
        userEmail: params.userEmail,
        userRole: params.userRole,
        action: params.action,
        resource: params.resource,
        permission: params.permission,
        method: params.method,
        status: params.status,
        statusCode: params.statusCode,
        errorMessage: params.errorMessage,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata as Record<string, unknown>,
        duration: params.duration,
      },
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Log a page access
 */
export async function logPageAccess(params: {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  page: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await createAuditLog({
    ...params,
    action: "page_access",
    resource: params.page,
    status: "success",
    statusCode: 200,
  });
}

/**
 * Log an API call
 */
export async function logApiCall(params: {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  endpoint: string;
  method: string;
  statusCode: number;
  duration?: number;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
}) {
  await createAuditLog({
    ...params,
    action: "api_call",
    resource: params.endpoint,
    status: params.statusCode >= 200 && params.statusCode < 300 ? "success" : "error",
  });
}

/**
 * Log a permission check
 */
export async function logPermissionCheck(params: {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  permission: string;
  resource: string;
  granted: boolean;
  ipAddress?: string;
  userAgent?: string;
}) {
  await createAuditLog({
    ...params,
    action: params.granted ? "permission_check" : "permission_denied",
    status: params.granted ? "success" : "denied",
    statusCode: params.granted ? 200 : 403,
  });
}

/**
 * Log a data export
 */
export async function logDataExport(params: {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  exportType: string;
  recordCount?: number;
  ipAddress?: string;
  userAgent?: string;
}) {
  await createAuditLog({
    ...params,
    action: "data_export",
    resource: params.exportType,
    status: "success",
    metadata: { recordCount: params.recordCount },
  });
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(params: {
  userId?: number;
  action?: AuditAction;
  status?: AuditStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  
  if (params.userId) where.userId = params.userId;
  if (params.action) where.action = params.action;
  if (params.status) where.status = params.status;
  
  if (params.startDate || params.endDate) {
    where.timestamp = {};
    if (params.startDate) where.timestamp.gte = params.startDate;
    if (params.endDate) where.timestamp.lte = params.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: params.limit || 100,
      skip: params.offset || 0,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get audit summary statistics
 */
export async function getAuditStats(params: {
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};
  
  if (params.startDate || params.endDate) {
    where.timestamp = {};
    if (params.startDate) where.timestamp.gte = params.startDate;
    if (params.endDate) where.timestamp.lte = params.endDate;
  }

  const [
    totalActions,
    deniedActions,
    uniqueUsers,
    actionsByType,
  ] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({ where: { ...where, status: "denied" } }),
    prisma.auditLog.groupBy({
      by: ["userId"],
      where,
      _count: { userId: true },
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      where,
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
    }),
  ]);

  return {
    totalActions,
    deniedActions,
    uniqueUsers: uniqueUsers.length,
    actionsByType: actionsByType.map((a) => ({
      action: a.action,
      count: a._count.action,
    })),
  };
}
