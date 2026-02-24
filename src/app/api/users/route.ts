import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/auth/api-permissions";
import { prisma } from "@/lib/db";
import { getUserPermissions } from "@/lib/auth/permissions";
import { z } from "zod";
import { hash } from "bcryptjs";
import { createVendor } from "@/lib/wave/vendors";
import { sendContractorWaveInvite } from "@/lib/email";

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(["admin", "manager", "sales"]).default("sales"),
  positionId: z.number().int().positive().nullable().optional(),
  territoryId: z.number().int().positive().nullable().optional(),
  password: z.string().min(8).optional(),
  // Contractor fields — if provided, Wave vendor is created automatically
  contractorEntityName: z.string().min(1).max(200).optional(),
  contractorEmail: z.string().email().optional(),
});

/**
 * GET /api/users — list all users (manage_team permission)
 */
export async function GET(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_team");
  if (permissionError) return permissionError;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        territoryId: true,
        permissionPreset: true,
        permissions: true,
        repOnboardingCompletedAt: true,
        contractorVendorId: true,
        contractorEntityName: true,
        contractorEmail: true,
        positionId: true,
        position: { select: { id: true, name: true, type: true } },
        territory: { select: { name: true } },
        _count: { select: { assignedLeads: true, salesRepClients: true } },
      },
      orderBy: { name: "asc" },
    });

    const usersWithPermissions = users.map((user) => ({
      ...user,
      effectivePermissions: getUserPermissions({
        id: user.id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        territoryId: user.territoryId,
        territoryName: user.territory?.name || null,
        permissions: user.permissions,
        permissionPreset: user.permissionPreset,
      }),
    }));

    return NextResponse.json({ success: true, data: usersWithPermissions });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

/**
 * POST /api/users — create a new user (admin only)
 * Auto-creates an admin onboarding task after user creation.
 */
export async function POST(req: NextRequest) {
  const permissionError = await withPermission(req, "manage_team");
  if (permissionError) return permissionError;

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ success: false, error: "Email already in use" }, { status: 409 });
  }

  const tempPassword = parsed.data.password ?? Math.random().toString(36).slice(-10) + "A1!";
  const passwordHash = await hash(tempPassword, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash,
      positionId: parsed.data.positionId ?? null,
      territoryId: parsed.data.territoryId ?? null,
      contractorEntityName: parsed.data.contractorEntityName ?? null,
      contractorEmail: parsed.data.contractorEmail ?? null,
    },
  });

  // ── Wave vendor auto-creation ──────────────────────────────────────────────
  // If contractor fields were supplied, create the Wave vendor immediately and
  // write the vendor ID back to the user record. Non-fatal if Wave is down —
  // the admin onboarding task will flag it as a manual step.
  let waveVendorId: string | null = null;
  let waveError: string | null = null;

  if (parsed.data.contractorEntityName && parsed.data.contractorEmail) {
    try {
      const vendor = await createVendor({
        name: parsed.data.contractorEntityName,
        email: parsed.data.contractorEmail,
      });
      waveVendorId = vendor.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { contractorVendorId: vendor.id },
      });

      // Fire the plain-English setup email to the contractor
      await sendContractorWaveInvite({
        contractorEmail: parsed.data.contractorEmail,
        contractorName: parsed.data.name,
        entityName: parsed.data.contractorEntityName,
      });
    } catch (err) {
      // Log but don't fail the request — vendor can be set manually via team settings
      waveError = String(err);
      console.error("[Wave] Vendor auto-creation failed for user", user.id, waveError);
    }
  }

  // Auto-create admin onboarding checklist task
  const position = parsed.data.positionId
    ? await prisma.position.findUnique({ where: { id: parsed.data.positionId }, select: { name: true } })
    : null;

  try {
    const waveSetupLine = waveVendorId
      ? `- ✅ Wave vendor created automatically (ID: ${waveVendorId}) — contractor notified via email`
      : waveError
      ? `- ⚠️ Wave vendor creation failed — set contractorVendorId manually in team settings (error: ${waveError.slice(0, 120)})`
      : `- Add Wave vendor record and set contractor fields (if contractor role)`;

    await prisma.adminTask.create({
      data: {
        title: `Onboard new user: ${user.name}`,
        description:
          `New user created (${position?.name ?? parsed.data.role}). Checklist:\n` +
          `${waveSetupLine}\n` +
          `- Configure compensation (commission + residual amounts)\n` +
          `- Assign territory if sales role\n` +
          `- Verify dashboard access level\n` +
          `- Confirm position assignment`,
        category: "onboarding",
        priority: "P2",
        status: "open",
        subjectUserId: user.id,
      },
    });
  } catch (taskError) {
    console.error("[AdminTask] Failed to create onboarding task:", taskError);
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tempPassword: parsed.data.password ? undefined : tempPassword,
      waveVendorId,
      waveError,
    },
  }, { status: 201 });
}
