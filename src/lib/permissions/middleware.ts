/**
 * GHM Dashboard - Permission Middleware
 * Server-side permission enforcement for API routes
 */

import { NextResponse } from 'next/server';
import { UserPermissions, UserWithPermissions } from './types';
import { hasPermission, isMaster } from './checker';

/**
 * Require a specific permission for an API route
 * Throws 401 if not authenticated, 403 if lacks permission
 * 
 * Usage in API route:
 * ```ts
 * const user = await getAuthenticatedUser(request);
 * requirePermission(user, 'canViewAllClients');
 * // Continue with route logic...
 * ```
 */
export function requirePermission(
  user: UserWithPermissions | null | undefined,
  permission: keyof UserPermissions
): void {
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  
  if (!hasPermission(user, permission)) {
    throw new Error('FORBIDDEN');
  }
}

/**
 * Require master role (for hard-coded master features)
 */
export function requireMaster(user: UserWithPermissions | null | undefined): void {
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  
  if (!isMaster(user)) {
    throw new Error('FORBIDDEN');
  }
}

/**
 * Require ANY of the specified permissions
 */
export function requireAnyPermission(
  user: UserWithPermissions | null | undefined,
  permissions: (keyof UserPermissions)[]
): void {
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  
  const hasAny = permissions.some(p => hasPermission(user, p));
  if (!hasAny) {
    throw new Error('FORBIDDEN');
  }
}

/**
 * Require ALL of the specified permissions
 */
export function requireAllPermissions(
  user: UserWithPermissions | null | undefined,
  permissions: (keyof UserPermissions)[]
): void {
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  
  const hasAll = permissions.every(p => hasPermission(user, p));
  if (!hasAll) {
    throw new Error('FORBIDDEN');
  }
}

/**
 * Helper to wrap permission check with proper error responses
 * 
 * Usage:
 * ```ts
 * export async function GET(request: NextRequest) {
 *   return withPermission(request, 'canViewAllClients', async (user) => {
 *     // Your route logic here
 *     return NextResponse.json({ data: '...' });
 *   });
 * }
 * ```
 */
export async function withPermission<T>(
  user: UserWithPermissions | null | undefined,
  permission: keyof UserPermissions,
  handler: (user: UserWithPermissions) => Promise<T>
): Promise<T | NextResponse> {
  try {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!hasPermission(user, permission)) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }
    
    return await handler(user);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    throw error;
  }
}

/**
 * Helper to wrap master-only routes
 */
export async function withMasterOnly<T>(
  user: UserWithPermissions | null | undefined,
  handler: (user: UserWithPermissions) => Promise<T>
): Promise<T | NextResponse> {
  try {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!isMaster(user)) {
      return NextResponse.json(
        { error: 'Forbidden - master access required' },
        { status: 403 }
      );
    }
    
    return await handler(user);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    throw error;
  }
}
