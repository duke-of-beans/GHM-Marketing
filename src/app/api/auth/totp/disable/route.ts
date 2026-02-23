/**
 * POST /api/auth/totp/disable
 *
 * Disable 2FA for the authenticated user.
 * Requires current password confirmation + a valid TOTP code (or backup code)
 * before disabling — prevents account takeover via stolen session.
 *
 * Admin only: a master user can also disable 2FA for any other user (pass targetUserId).
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { decryptSecret, verifyCode, verifyBackupCode } from "@/lib/totp";
import { checkTotpRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { compare } from "bcryptjs";
import type { UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = parseInt((session?.user as { id?: string })?.id ?? "", 10);
  const userRole = (session?.user as { role?: UserRole })?.role;

  if (!session?.user || isNaN(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reqLog = log.child({
    requestId: req.headers.get("x-request-id") ?? undefined,
    userId,
    route: "POST /api/auth/totp/disable",
  });

  // Rate limit (reuse TOTP limiter)
  const rateCheck = await checkTotpRateLimit(userId);
  if (rateCheck.limited) {
    reqLog.warn({ action: "totp_disable_rate_limited" }, "Rate limited");
    return rateLimitResponse(rateCheck.retryAfterSeconds) as ReturnType<typeof NextResponse.json>;
  }

  let body: { code?: string; password?: string; isBackupCode?: boolean; targetUserId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // If targeting another user, require admin/master role
  const targetUserId = body.targetUserId && userRole === "admin" ? body.targetUserId : userId;

  if (!body.password) {
    return NextResponse.json({ error: "password is required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        passwordHash: true,
        totpSecret: true,
        totpEnabled: true,
        totpBackupCodes: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.totpEnabled) {
      return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
    }

    // Verify password
    const passwordValid = await compare(body.password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    // Verify TOTP code (required unless admin is disabling for another user)
    if (targetUserId === userId) {
      if (!body.code) {
        return NextResponse.json({ error: "code is required" }, { status: 400 });
      }

      const secret = decryptSecret(user.totpSecret!);
      let codeValid = false;

      if (body.isBackupCode) {
        const hashedCodes: string[] = JSON.parse(user.totpBackupCodes ?? "[]");
        const remaining = verifyBackupCode(body.code, hashedCodes);
        if (remaining !== null) {
          codeValid = true;
          await prisma.user.update({
            where: { id: targetUserId },
            data: { totpBackupCodes: JSON.stringify(remaining) },
          });
        }
      } else {
        codeValid = verifyCode(body.code.replace(/\s/g, ""), secret);
      }

      if (!codeValid) {
        reqLog.warn({ action: "totp_disable_invalid_code" }, "Invalid code during disable");
        return NextResponse.json({ error: "Invalid code" }, { status: 400 });
      }
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        totpEnabled: false,
        totpSecret: null,
        totpBackupCodes: null,
        totpVerifiedAt: null,
      },
    });

    reqLog.info({ action: "totp_disabled", targetUserId }, "2FA disabled");
    return NextResponse.json({ success: true });
  } catch (error) {
    reqLog.error({ error }, "TOTP disable failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
