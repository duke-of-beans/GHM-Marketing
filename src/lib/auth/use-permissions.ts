"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { UserPermissions, PermissionKey } from "@/lib/auth/permissions";

/**
 * Client-side hook to check user permissions
 * Fetches permissions once and caches them
 */
export function usePermissions() {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<UserPermissions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      if (!session?.user) {
        setPermissions({});
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/permissions");
        if (res.ok) {
          const data = await res.json();
          setPermissions(data.permissions || {});
        }
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
        setPermissions({});
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [session]);

  return { permissions, loading };
}

/**
 * Check if user has a specific permission
 */
export function useHasPermission(permission: PermissionKey): boolean {
  const { permissions } = usePermissions();
  return permissions[permission] === true;
}

/**
 * Check if user has ANY of the specified permissions
 */
export function useHasAnyPermission(...requiredPermissions: PermissionKey[]): boolean {
  const { permissions } = usePermissions();
  return requiredPermissions.some((perm) => permissions[perm] === true);
}

/**
 * Check if user has ALL of the specified permissions
 */
export function useHasAllPermissions(...requiredPermissions: PermissionKey[]): boolean {
  const { permissions } = usePermissions();
  return requiredPermissions.every((perm) => permissions[perm] === true);
}

/**
 * Component wrapper that only renders children if user has permission
 */
export function WithPermission({
  permission,
  children,
  fallback = null,
}: {
  permission: PermissionKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hasPermission = useHasPermission(permission);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Component wrapper that renders children if user has ANY permission
 */
export function WithAnyPermission({
  permissions,
  children,
  fallback = null,
}: {
  permissions: PermissionKey[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hasAny = useHasAnyPermission(...permissions);
  return hasAny ? <>{children}</> : <>{fallback}</>;
}
