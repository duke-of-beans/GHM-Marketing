import { requireMaster } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { ProductCatalog } from "@/components/products/product-catalog";

export default async function ProductsPage() {
  await requireMaster();

  const products = await prisma.product.findMany({
    orderBy: [
      { isActive: "desc" },
      { category: "asc" },
      { name: "asc" },
    ],
  });

  // Serialize Decimals
  const serialized = JSON.parse(JSON.stringify(products));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Service Catalog</h1>
        <p className="text-muted-foreground mt-1">
          Manage your SEO service offerings, pricing, and package details
        </p>
      </div>

      <ProductCatalog products={serialized} />
    </div>
  );
}
