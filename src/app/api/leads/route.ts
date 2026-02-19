import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withPermission } from "@/lib/auth/api-permissions";
import { getLeads } from "@/lib/db/leads";
import { leadFilterSchema, createLeadSchema } from "@/lib/validations";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Check permission
  const permissionError = await withPermission(request, "view_all_leads");
  if (permissionError) return permissionError;

  const session = await auth();
  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = leadFilterSchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid filters", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const user = session!.user as unknown as SessionUser;
  const result = await getLeads(user, parsed.data);

  return NextResponse.json({ success: true, data: result });
}

export async function POST(request: NextRequest) {
  // Check permission
  const permissionError = await withPermission(request, "manage_leads");
  if (permissionError) return permissionError;

  const body = await request.json();
  const parsed = createLeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid lead data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const lead = await prisma.lead.create({
    data: {
      businessName: parsed.data.businessName,
      phone: parsed.data.phone,
      city: parsed.data.city,
      state: parsed.data.state,
      zipCode: parsed.data.zipCode,
      website: parsed.data.website || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      leadSourceId: parsed.data.leadSourceId || null,
    },
    include: {
      territory: { select: { id: true, name: true } },
      assignedUser: { select: { id: true, name: true } },
    },
  });

  // Bust dashboard caches so new lead counts are reflected
  revalidatePath("/master");
  revalidatePath("/sales");
  revalidatePath("/leads");

  return NextResponse.json({ success: true, data: lead }, { status: 201 });
}
