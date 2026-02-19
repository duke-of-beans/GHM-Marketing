import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  territoryId: number | null;
  territoryName: string | null;
};

export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // Added in full auth config
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in: stamp all fields from the authorize() return value
      if (user) {
        const authUser = user as unknown as AuthUser;
        token.id = authUser.id;
        token.role = authUser.role;
        token.territoryId = authUser.territoryId;
        token.territoryName = authUser.territoryName;
        token.dbCheckedAt = Date.now();
        return token;
      }

      // Subsequent requests: re-fetch role from DB every 5 minutes so that
      // role changes made by admins propagate without forcing a logout.
      const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
      const lastCheck = (token.dbCheckedAt as number | undefined) ?? 0;

      if (Date.now() - lastCheck > REFRESH_INTERVAL_MS) {
        try {
          // Dynamic import avoids circular-dependency issues in edge middleware
          const { prisma } = await import("@/lib/db");
          const freshUser = await prisma.user.findUnique({
            where: { id: parseInt(token.id as string, 10) },
            select: {
              role: true,
              isActive: true,
              territoryId: true,
              territory: { select: { name: true } },
            },
          });

          if (!freshUser || !freshUser.isActive) {
            // User deactivated — invalidate session by removing the id
            token.id = undefined;
          } else {
            token.role = freshUser.role;
            token.territoryId = freshUser.territoryId;
            token.territoryName = freshUser.territory?.name ?? null;
          }
        } catch {
          // Non-fatal: if DB check fails, keep the existing token values
        }
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
      // Token invalidated (user deactivated mid-session)
      const user = authSession?.user as unknown as AuthUser | undefined;
      if (isLoggedIn && !user?.id) {
        return Response.redirect(new URL("/login", nextUrl));
      }
      const isOnDashboard =
        nextUrl.pathname.startsWith("/master") ||
        nextUrl.pathname.startsWith("/sales") ||
        nextUrl.pathname.startsWith("/leads") ||
        nextUrl.pathname.startsWith("/reports");
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      if (isOnDashboard) {
        if (!isLoggedIn) return false;
        if (nextUrl.pathname.startsWith("/master")) {
          if (user?.role !== "master") {
            return Response.redirect(new URL("/sales", nextUrl));
          }
        }
        return true;
      }

      if (isOnLogin && isLoggedIn) {
        const redirectTo = user?.role === "master" ? "/master" : "/sales";
        return Response.redirect(new URL(redirectTo, nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
