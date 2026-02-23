// src/middleware.ts
// Two responsibilities:
//   1. Tenant detection — extract subdomain, validate against registry,
//      inject x-tenant-slug header, redirect unknown tenants.
//   2. Auth — delegate to NextAuth for all protected routes.

import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { getTenantFromHost, TENANT_HEADER } from "@/lib/tenant";

const { auth } = NextAuth(authConfig);

// Root domain landing page (no tenant subdomain)
const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "covos.app";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // ── 1. TENANT DETECTION ──────────────────────────────────────────────────

  const isRootDomain =
    host === ROOT_DOMAIN ||
    host === `www.${ROOT_DOMAIN}` ||
    host.startsWith("localhost") ||        // local dev without subdomain
    host.startsWith("ghm-marketing");      // Vercel preview URLs

  if (!isRootDomain) {
    const tenant = getTenantFromHost(host);

    if (!tenant) {
      // Unknown subdomain — redirect to root domain with a message
      const rootUrl = new URL(`https://${ROOT_DOMAIN}`);
      rootUrl.searchParams.set("error", "unknown-tenant");
      return NextResponse.redirect(rootUrl);
    }

    // Valid tenant — clone request and inject tenant slug header
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(TENANT_HEADER, tenant.slug);

    // Continue with modified headers (auth check happens next)
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set(TENANT_HEADER, tenant.slug);
    return response;
  }

  // ── 2. AUTH (NextAuth) ───────────────────────────────────────────────────
  // Delegate all auth logic to existing NextAuth config.
  // This handles login redirects, role-based routing, etc.
  return auth(request as never) as unknown as NextResponse;
}

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     * - _next (static files, images, etc.)
     * - favicon.ico, robots.txt, manifest, icons
     * - Public API auth endpoints
     */
    "/((?!_next|favicon\\.ico|robots\\.txt|manifest\\.json|icons/).*)",
  ],
};
