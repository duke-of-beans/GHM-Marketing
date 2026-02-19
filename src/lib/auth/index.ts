import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";
import type { UserRole } from "@prisma/client";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  territoryId: number | null;
  territoryName: string | null;
};

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // Override jwt to add DB role refresh (Node.js only, not edge)
    async jwt({ token, user }) {
      // Initial sign-in
      if (user) {
        const authUser = user as unknown as AuthUser;
        token.id = authUser.id;
        token.role = authUser.role;
        token.territoryId = authUser.territoryId;
        token.territoryName = authUser.territoryName;
        token.dbCheckedAt = Date.now();
        return token;
      }

      // Re-fetch role from DB every 5 minutes so admin changes propagate
      const lastCheck = (token.dbCheckedAt as number | undefined) ?? 0;
      if (Date.now() - lastCheck > REFRESH_INTERVAL_MS) {
        try {
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
            token.id = undefined;
          } else {
            token.role = freshUser.role;
            token.territoryId = freshUser.territoryId;
            token.territoryName = freshUser.territory?.name ?? null;
          }
        } catch {
          // Non-fatal: keep existing token values
        }
        token.dbCheckedAt = Date.now();
      }

      return token;
    },
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
});
