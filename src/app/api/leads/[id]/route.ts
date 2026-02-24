import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLeadById, updateLeadStatus } from "@/lib/db/leads";
import { updateLeadStatusSchema } from "@/lib/validations";
import type { SessionUser } from "@/lib/auth/session";
import { territoryFilter } from "@/lib/auth/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ success: false, error: "Invalid lead ID" }, { status: 400 });
  }

  const user = session.user as unknown as SessionUser;
  const lead = await getLeadById(user, leadId);

  if (!lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: lead });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) {
    return NextResponse.json({ success: false, error: "Invalid lead ID" }, { status: 400 });
  }

  const body = await request.json();
  const user = session.user as unknown as SessionUser;

  // Status update path (existing behavior)
  if (body.status) {
    const parsed = updateLeadStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid status", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const lead = await updateLeadStatus(user, leadId, parsed.data.status);
    if (!lead) {
      return NextResponse.json({ success: false, error: "Lead not found or access denied" }, { status: 404 });
    }

    // Bust cached server components so dashboard widgets reflect the change immediately
    revalidatePath("/manager");
    revalidatePath("/sales");
    revalidatePath("/leads");

    return NextResponse.json({ success: true, data: lead });
  }

  // Field update path (assignedTo, email, phone, website, etc.)
  const baseFilter = territoryFilter(user);
  const existing = await prisma.lead.findFirst({
    where: { id: leadId, ...baseFilter },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, error: "Lead not found or access denied" }, { status: 404 });
  }

  const allowedFields: Record<string, unknown> = {};
  if ("assignedTo" in body) allowedFields.assignedTo = body.assignedTo;
  if ("email" in body) allowedFields.email = body.email;
  if ("phone" in body) allowedFields.phone = body.phone;
  if ("website" in body) allowedFields.website = body.website;
  if ("contactName" in body) allowedFields.contactName = body.contactName;

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: allowedFields,
    select: { id: true, businessName: true, assignedTo: true },
  });

  return NextResponse.json({ success: true, data: updated });
}
