/**
 * POST /api/auth/totp/verify
 *
 * Two purposes:
 *   1. Enrollment verification: Confirm a TOTP code is valid after /setup,
 *      which activates 2FA (sets totpEnabled = true).
 *   2. Login step (used by NextAuth authorize hook): Verify code during sign-in.
 *      Pass { code, userId } — used by the authorize callback, not called directly
 *      by the browser during normal login (that's handled in NextAuth flow).
 *
 * Rate limited: 3 attempts per 5 min per userId.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { decryptSecret, verifyCode, verifyBackupCode } from "@/lib/totp";
import { checkTotpRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = parseInt((session?.user as { id?: string })?.id ?? "", 10);

  if (!session?.user || isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reqLog = log.child({
    requestId: req.headers.get("x-request-id") ?? undefined,
    userId,
    route: "POST /api/auth/totp/verify",
  });

  // Rate limit
  const rateCheck = await checkTotpRateLimit(userId);
  if (rateCheck.limited) {
    reqLog.warn({ action: "totp_rate_limited" }, "TOTP verify rate limited");
    return rateLimitResponse(rateCheck.retryAfterSeconds) as ReturnType<typeof NextResponse.json>;
  }

  let body: { code?: string; isBackupCode?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { code, isBackupCode = false } = body;
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totpSecret: true,
        totpEnabled: true,
        totpBackupCodes: true,
        role: true,
      },
    });

    if (!user?.totpSecret) {
      return NextResponse.json(
        { error: "2FA is not configured. Run setup first." },
        { status: 400 }
      );
    }

    const secret = decryptSecret(user.totpSecret);

    if (isBackupCode) {
      // Backup code flow
      const hashedCodes: string[] = JSON.parse(user.totpBackupCodes ?? "[]");
      const remaining = verifyBackupCode(code, hashedCodes);

      if (remaining === null) {
        reqLog.warn({ action: "totp_backup_invalid" }, "Invalid backup code");
        return NextResponse.json({ error: "Invalid backup code" }, { status: 400 });
      }

      // Consume the backup code
      await prisma.user.update({
        where: { id: userId },
        data: { totpBackupCodes: JSON.stringify(remaining) },
      });

      reqLog.info({ action: "totp_backup_used", remaining: remaining.length }, "Backup code used");
      return NextResponse.json({ success: true, backupCodesRemaining: remaining.length });
    }

    // TOTP code flow
    const valid = verifyCode(code.replace(/\s/g, ""), secret);

    if (!valid) {
      reqLog.warn({ action: "totp_invalid" }, "Invalid TOTP code");
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // If this is enrollment (totpEnabled was false), activate now
    const updates: { totpEnabled: boolean; totpVerifiedAt?: Date } = {
      totpEnabled: true,
    };
    if (!user.totpEnabled) {
      updates.totpVerifiedAt = new Date();
      reqLog.info({ action: "totp_enrolled" }, "2FA enrollment completed");
    } else {
      reqLog.info({ action: "totp_verified" }, "TOTP code verified");
    }

    await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    reqLog.error({ error }, "TOTP verify failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
