import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

/**
 * Edge-safe auth config – imported by middleware.
 * CRITICAL: No Prisma, no bcrypt, no heavy deps here.
 * DB-dependent logic (role refresh) lives in ./index.ts
 */

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  territoryId: number | null;
  territoryName: string | null;
};

// Paths that don't require authentication.
// Use exact strings for short paths; prefix match is applied with startsWith below.
const PUBLIC_PATHS = [
  "/login",
  "/welcome",
  "/brochure",
  "/comp-sheet",
  "/territory-map",
  "/auth",          // /auth/forgot-password, /auth/reset-password
  "/public",        // /api/public/* already bypasses auth, but cover page routes too
];

// Paths that are truly public landing pages (never redirect logged-in users away from them)
// e.g. your marketing site pages hosted on the same domain
const MARKETING_PATHS = ["/", "/about", "/pricing", "/contact", "/privacy", "/terms"];

// Paths that require manager/admin role
const ELEVATED_PATHS = ["/manager", "/permissions", "/audit"];

export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // Added in full auth config (./index.ts)
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in: stamp fields from authorize() return
      if (user) {
        const authUser = user as unknown as AuthUser;
        token.id = authUser.id;
        token.role = authUser.role;
        token.territoryId = authUser.territoryId;
        token.territoryName = authUser.territoryName;
        token.dbCheckedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as unknown as AuthUser;
        sessionUser.id = token.id as string;
        sessionUser.role = token.role as UserRole;
        sessionUser.territoryId = token.territoryId as number | null;
        sessionUser.territoryName = token.territoryName as string | null;
      }
      return session;
    },
    async authorized({ auth: authSession, request: { nextUrl } }) {
      const isLoggedIn = !!authSession?.user;
      const user = authSession?.user as unknown as AuthUser | undefined;
      const path = nextUrl.pathname;

      // Token invalidated (user deactivated mid-session)
      if (isLoggedIn && !user?.id) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      // Marketing / truly-public pages: always allow, never redirect logged-in users away
      const isMarketing = MARKETING_PATHS.some((p) => path === p);
      if (isMarketing) return true;

      // Auth/app public paths: allow unauthenticated; redirect logged-in users to their dashboard
      const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
      if (isPublic) {
        if (isLoggedIn) {
          const dest = user?.role === "manager" || user?.role === "admin" ? "/manager" : "/sales";
          return Response.redirect(new URL(dest, nextUrl));
        }
        return true;
      }

      // API routes: let through (API-level auth handles them)
      if (path.startsWith("/api/")) {
        return true;
      }

      // Everything else requires authentication
      if (!isLoggedIn) return false;

      // Elevated paths require master or admin role
      const needsElevated = ELEVATED_PATHS.some((p) => path.startsWith(p));
      if (needsElevated && user?.role === "sales") {
        return Response.redirect(new URL("/sales", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
