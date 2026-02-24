/**
 * GHM Dashboard - Permission Middleware
 * Server-side permission enforcement for API routes
 */

import { NextResponse } from 'next/server';
import { UserPermissions, UserWithPermissions } from './types';
import { hasPermission } from './checker';

/**
 * Require a specific permission
 * Throws 403 if user doesn't have permission
 */
export function requirePermission(
  user: Partial<UserWithPermissions> | null | undefined,
  permission: keyof UserPermissions
): void {
  if (!user) {
    throw new PermissionError('Unauthorized', 401);
  }
  
  // If user doesn't have permissions field (e.g., from session), deny access
  // API routes should fetch full user if permission checks needed
  if (!user.permissions || !hasPermission(user as UserWithPermissions, permission)) {
    throw new PermissionError(
      `Permission denied: ${permission} required`,
      403
    );
  }
}

/**
 * Require manager role
 * Use for hard-coded manager-only features (settings, compensation, etc.)
 */
export function requireMaster(
  user: { role?: string } | null | undefined
): void {
  if (!user) {
    throw new PermissionError('Unauthorized', 401);
  }
  
  if (user.role !== 'manager' && user.role !== 'admin') {
    throw new PermissionError(
      'Manager role required',
      403
    );
  }
}

/**
 * Check if user has permission (returns boolean, doesn't throw)
 */
export function checkPermission(
  user: Partial<UserWithPermissions> | null | undefined,
  permission: keyof UserPermissions
): boolean {
  if (!user?.permissions) return false;
  return hasPermission(user as UserWithPermissions, permission);
}

/**
 * Custom permission error
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Handle permission errors in API routes
 */
export function handlePermissionError(error: unknown): NextResponse {
  if (error instanceof PermissionError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }
  
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

/**
 * Wrap an API handler with permission check
 */
export function withPermission<T>(
  permission: keyof UserPermissions,
  handler: (user: any, ...args: T[]) => Promise<NextResponse>
) {
  return async (user: any, ...args: T[]): Promise<NextResponse> => {
    try {
      requirePermission(user, permission);
      return await handler(user, ...args);
    } catch (error) {
      return handlePermissionError(error);
    }
  };
}

/**
 * Wrap an API handler with master role check
 */
export function withMaster<T>(
  handler: (user: any, ...args: T[]) => Promise<NextResponse>
) {
  return async (user: any, ...args: T[]): Promise<NextResponse> => {
    try {
      requireMaster(user);
      return await handler(user, ...args);
    } catch (error) {
      return handlePermissionError(error);
    }
  };
}
