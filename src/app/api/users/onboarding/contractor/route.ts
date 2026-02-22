import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  contractorEntityName: z.string().min(1).max(200),
  contractorEmail: z.string().email().nullable().optional(),
});

// POST /api/users/onboarding/contractor
// Called during onboarding wizard by the authenticated user themselves
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: Number(user.id) },
    data: {
      contractorEntityName: parsed.data.contractorEntityName,
      contractorEmail: parsed.data.contractorEmail ?? null,
      // Note: contractorVendorId is set by admin via Team settings — not self-serve
    },
  });

  return NextResponse.json({ success: true });
}
