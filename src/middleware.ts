// src/middleware.ts
// Three responsibilities:
//   1. Correlation ID — generate x-request-id on every request for log tracing.
//   2. Tenant detection — extract subdomain, validate against registry,
//      inject x-tenant-slug header, redirect unknown tenants.
//   3. Auth — delegate to NextAuth for all protected routes.

import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { getTenantFromHost, TENANT_HEADER } from "@/lib/tenant";
import { randomUUID } from "crypto";

export const REQUEST_ID_HEADER = "x-request-id";

const { auth } = NextAuth(authConfig);

// Root domain landing page (no tenant subdomain)
const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "covos.app";

export async function middleware(request: NextRequest) {
  // ── 0. CORRELATION ID ────────────────────────────────────────────────────
  // Generate a request ID if not already present (e.g. from a load balancer).
  // Propagated on both the forwarded request and the response so client +
  // server logs can be correlated on a single request.
  const requestId =
    request.headers.get(REQUEST_ID_HEADER) ?? randomUUID().slice(0, 8);

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

    // Valid tenant — clone request and inject tenant slug + request ID headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(TENANT_HEADER, tenant.slug);
    requestHeaders.set(REQUEST_ID_HEADER, requestId);

    // Continue with modified headers (auth check happens next)
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set(TENANT_HEADER, tenant.slug);
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }

  // ── 2. AUTH (NextAuth) ───────────────────────────────────────────────────
  // Inject request ID before delegating to NextAuth so all downstream
  // handlers can read it from request headers.
  const modifiedRequest = new NextRequest(request, {
    headers: (() => {
      const h = new Headers(request.headers);
      h.set(REQUEST_ID_HEADER, requestId);
      return h;
    })(),
  });

  // Delegate all auth logic to existing NextAuth config.
  // This handles login redirects, role-based routing, etc.
  const authResponse = (await (auth(modifiedRequest as never) as unknown as Promise<NextResponse | Response | undefined>));
  
  if (authResponse instanceof Response) {
    const res = new NextResponse(authResponse.body, authResponse);
    res.headers.set(REQUEST_ID_HEADER, requestId);
    return res;
  }
  
  // auth() returned undefined (let through) — build a NextResponse to carry the header
  const passThroughResponse = NextResponse.next({
    request: { headers: modifiedRequest.headers },
  });
  passThroughResponse.headers.set(REQUEST_ID_HEADER, requestId);
  return passThroughResponse;
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
