// src/hooks/use-tenant.ts
// Client-side tenant hook.
// Reads tenant slug from a data attribute stamped on <html> by the root layout.

"use client";

import { useEffect, useState } from "react";
import type { TenantConfig } from "@/lib/tenant";
import { TENANT_REGISTRY } from "@/lib/tenant";

/**
 * Returns the current tenant config on the client, or null on the root domain.
 *
 * Works by reading window.location.hostname at runtime — no server round-trip.
 */
export function useTenant(): TenantConfig | null {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    if (parts.length < 2) return;

    const slug = parts[0].toLowerCase();
    const found = TENANT_REGISTRY[slug];
    if (found?.active) setTenant(found);
  }, []);

  return tenant;
}
