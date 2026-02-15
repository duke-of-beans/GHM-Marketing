import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
  role: z.enum(["master", "sales"]),
  territoryId: z.number().int().positive().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      territoryId: true,
      territory: { select: { id: true, name: true } },
      lastLogin: true,
      isActive: true,
      _count: { select: { assignedLeads: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: users });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as unknown as SessionUser;
  if (user.role !== "master") {
    return NextResponse.json({ success: false, error: "Master access required" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Check for existing email
  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Email already in use" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const newUser = await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      role: parsed.data.role,
      territoryId: parsed.data.territoryId ?? null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      territoryId: true,
      territory: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: newUser }, { status: 201 });
}
