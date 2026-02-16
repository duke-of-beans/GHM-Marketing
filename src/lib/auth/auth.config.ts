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
      if (user) {
        const authUser = user as unknown as AuthUser;
        token.id = authUser.id;
        token.role = authUser.role;
        token.territoryId = authUser.territoryId;
        token.territoryName = authUser.territoryName;
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
      const isOnDashboard =
        nextUrl.pathname.startsWith("/master") ||
        nextUrl.pathname.startsWith("/sales") ||
        nextUrl.pathname.startsWith("/leads") ||
        nextUrl.pathname.startsWith("/reports");
      const isOnLogin = nextUrl.pathname.startsWith("/login");

      if (isOnDashboard) {
        if (!isLoggedIn) return false;
        if (nextUrl.pathname.startsWith("/master")) {
          const user = authSession?.user as unknown as AuthUser | undefined;
          if (user?.role !== "master") {
            return Response.redirect(new URL("/sales", nextUrl));
          }
        }
        return true;
      }

      if (isOnLogin && isLoggedIn) {
        const user = authSession?.user as unknown as AuthUser | undefined;
        const redirectTo = user?.role === "master" ? "/master" : "/sales";
        return Response.redirect(new URL(redirectTo, nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
