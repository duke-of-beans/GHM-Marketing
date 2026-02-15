import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  description: z.string().optional(),
  price: z.number().positive(),
  pricingModel: z.enum(["monthly", "annual", "one_time"]),
  category: z.string().optional(),
  displayOrder: z.number().int().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
  });

  return NextResponse.json({ success: true, data: products });
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
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const product = await prisma.product.create({
    data: parsed.data,
  });

  return NextResponse.json({ success: true, data: product }, { status: 201 });
}
