import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";
import { decryptSecret, verifyCode, verifyBackupCode } from "@/lib/totp";
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
        totpCode: { label: "2FA Code", type: "text" },
        isBackupCode: { label: "Is Backup Code", type: "text" },
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

        // ── 2FA enforcement (admin + master accounts only) ──────────────────
        // If the user has 2FA enabled, require a valid TOTP code at login.
        // If they don't have it enabled but are admin/master, they can still
        // log in — 2FA enrollment is encouraged but not yet forced (sprint 1).
        if (user.totpEnabled && user.totpSecret) {
          const totpCode = credentials.totpCode as string | undefined;
          if (!totpCode) {
            // Signal to the UI that 2FA is required
            // Returning null with a specific error is NextAuth's mechanism
            throw new Error("2FA_REQUIRED");
          }

          const secret = decryptSecret(user.totpSecret);
          const useBackup = (credentials.isBackupCode as string) === "true";

          let codeValid = false;
          if (useBackup) {
            const hashedCodes: string[] = JSON.parse(user.totpBackupCodes ?? "[]");
            const remaining = verifyBackupCode(totpCode, hashedCodes);
            if (remaining !== null) {
              codeValid = true;
              // Consume backup code
              await prisma.user.update({
                where: { id: user.id },
                data: { totpBackupCodes: JSON.stringify(remaining) },
              });
            }
          } else {
            codeValid = verifyCode(totpCode.replace(/\s/g, ""), secret);
          }

          if (!codeValid) {
            throw new Error("INVALID_TOTP_CODE");
          }
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
