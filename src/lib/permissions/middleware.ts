/**
 * GHM Dashboard - Permission Middleware
 * Server-side permission enforcement for API routes
 */

import { NextResponse } from 'next/server';
import { UserPermissions, UserWithPermissions } from './types';
import { hasPermission, isMaster } from './checker';

/**
 * Require a specific permission
 * Throws 403 if user doesn't have permission
 */
export function requirePermission(
  user: UserWithPermissions | null | undefined,
  permission: keyof UserPermissions
): void {
  if (!user) {
    throw new PermissionError('Unauthorized', 401);
  }
  
  if (!hasPermission(user, permission)) {
    throw new PermissionError(
      `Permission denied: ${permission} required`,
      403
    );
  }
}

/**
 * Require master role
 * Use for hard-coded master-only features (settings, compensation, etc.)
 */
export function requireMaster(
  user: UserWithPermissions | null | undefined
): void {
  if (!user) {
    throw new PermissionError('Unauthorized', 401);
  }
  
  if (!isMaster(user)) {
    throw new PermissionError(
      'Master role required',
      403
    );
  }
}

/**
 * Check if user has permission (returns boolean, doesn't throw)
 */
export function checkPermission(
  user: UserWithPermissions | null | undefined,
  permission: keyof UserPermissions
): boolean {
  return hasPermission(user, permission);
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
  handler: (user: UserWithPermissions, ...args: T[]) => Promise<NextResponse>
) {
  return async (user: UserWithPermissions | null, ...args: T[]): Promise<NextResponse> => {
    try {
      requirePermission(user, permission);
      return await handler(user as UserWithPermissions, ...args);
    } catch (error) {
      return handlePermissionError(error);
    }
  };
}

/**
 * Wrap an API handler with master role check
 */
export function withMaster<T>(
  handler: (user: UserWithPermissions, ...args: T[]) => Promise<NextResponse>
) {
  return async (user: UserWithPermissions | null, ...args: T[]): Promise<NextResponse> => {
    try {
      requireMaster(user);
      return await handler(user as UserWithPermissions, ...args);
    } catch (error) {
      return handlePermissionError(error);
    }
  };
}
