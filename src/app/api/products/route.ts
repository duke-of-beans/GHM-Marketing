import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withPermission } from "@/lib/auth/api-permissions";

export async function POST(req: NextRequest) {
  // Check permission
  const permissionError = await withPermission(req, "manage_products");
  if (permissionError) return permissionError;

  try {
    const body = await req.json();
    const { name, category, description, price, pricingModel, isActive } = body;

    // Generate SKU from name (uppercase, replace spaces with hyphens, add timestamp)
    const sku = `${name.toUpperCase().replace(/\s+/g, "-")}-${Date.now().toString().slice(-6)}`;

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category: category || null,
        description: description || null,
        price,
        pricingModel,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await requireMaster();

    const products = await prisma.product.findMany({
      orderBy: [
        { isActive: "desc" },
        { category: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
