"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { UserPermissions, PermissionKey } from "@/lib/auth/permissions";

const CACHE_KEY = "user_permissions";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

type CachedPermissions = {
  permissions: UserPermissions;
  timestamp: number;
};

/**
 * Client-side hook to check user permissions
 * Caches permissions in memory and localStorage for performance
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

      // Check localStorage cache first
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { permissions: cachedPerms, timestamp }: CachedPermissions = JSON.parse(cached);
          const isExpired = Date.now() - timestamp > CACHE_DURATION;
          
          if (!isExpired) {
            setPermissions(cachedPerms);
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to read permissions cache:", error);
      }

      // Fetch from API if cache miss or expired
      try {
        const res = await fetch("/api/auth/permissions");
        if (res.ok) {
          const data = await res.json();
          const newPermissions = data.permissions || {};
          
          setPermissions(newPermissions);
          
          // Cache in localStorage
          try {
            const cacheData: CachedPermissions = {
              permissions: newPermissions,
              timestamp: Date.now(),
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
          } catch (error) {
            console.error("Failed to cache permissions:", error);
          }
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
 * Clear permission cache (call when permissions are updated)
 */
export function clearPermissionCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error("Failed to clear permission cache:", error);
  }
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
  permissions: requiredPermissions,
  children,
  fallback = null,
}: {
  permissions: PermissionKey[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { permissions: userPermissions } = usePermissions();
  const hasAny = requiredPermissions.some((perm) => userPermissions[perm] === true);
  return hasAny ? <>{children}</> : <>{fallback}</>;
}
