// src/app/not-a-tenant/page.tsx
// Sprint 34 — Error page for unknown tenant subdomains.
// TODO: COVOS_LANDING_PAGE_NEEDED — replace with proper COVOS landing page.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unknown Tenant — COVOS",
  description: "This subdomain is not configured.",
};

export default function NotATenantPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          This subdomain isn&apos;t configured
        </h1>
        <p className="text-muted-foreground">
          The subdomain you&apos;re trying to reach doesn&apos;t match any
          registered tenant on the COVOS platform.
        </p>
        <a
          href="https://covos.app"
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Visit covos.app
        </a>
      </div>
    </div>
  );
}
