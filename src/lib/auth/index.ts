import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  territoryId: number | null;
  territoryName: string | null;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { territory: true },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const passwordMatch = await compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!passwordMatch) {
          return null;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          territoryId: user.territoryId,
          territoryName: user.territory?.name ?? null,
        };
      },
    }),
  ],
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

        // Master-only routes
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
});
