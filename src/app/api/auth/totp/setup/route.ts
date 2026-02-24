/**
 * POST /api/auth/totp/setup
 *
 * Initiate 2FA setup for the authenticated user.
 * Returns the otpauth:// URI (for QR display) and the plaintext secret.
 * The secret is stored encrypted in the DB but NOT marked enabled yet.
 * User must verify with a valid code via /api/auth/totp/verify before 2FA is active.
 *
 * Allowed roles: admin, master only.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { generateSecret, encryptSecret, buildOtpAuthUri, generateBackupCodes } from "@/lib/totp";
import type { UserRole } from "@prisma/client";

const ALLOWED_ROLES: UserRole[] = ["admin", "manager"];

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = parseInt((session?.user as { id?: string })?.id ?? "", 10);

  if (!session?.user || isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = (session.user as { role?: UserRole }).role;
  if (!userRole || !ALLOWED_ROLES.includes(userRole)) {
    return NextResponse.json({ error: "2FA is only required for admin and master accounts" }, { status: 403 });
  }

  const reqLog = log.child({
    requestId: req.headers.get("x-request-id") ?? undefined,
    userId,
    route: "POST /api/auth/totp/setup",
  });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, totpEnabled: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.totpEnabled) {
      return NextResponse.json(
        { error: "2FA is already enabled. Disable it first to re-enroll." },
        { status: 409 }
      );
    }

    // Generate new secret + backup codes
    const secret = generateSecret();
    const encryptedSecret = encryptSecret(secret);
    const { plaintext: backupCodes, hashed: hashedBackupCodes } = generateBackupCodes();

    // Store encrypted secret + hashed backup codes (not enabled yet — needs verification)
    await prisma.user.update({
      where: { id: userId },
      data: {
        totpSecret: encryptedSecret,
        totpBackupCodes: JSON.stringify(hashedBackupCodes),
        totpEnabled: false, // still false until verified
      },
    });

    const otpAuthUri = buildOtpAuthUri(user.email, secret);

    reqLog.info({ action: "totp_setup_initiated" }, "TOTP setup initiated");

    return NextResponse.json({
      otpAuthUri,
      secret, // Show plaintext once so user can manually enter in authenticator app
      backupCodes, // Show plaintext once — user must save these
    });
  } catch (error) {
    reqLog.error({ error }, "TOTP setup failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
