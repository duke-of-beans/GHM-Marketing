"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Product = {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  pricingModel: string;
  category: string | null;
  displayOrder: number;
  isActive: boolean;
};

type NewProduct = {
  name: string;
  sku: string;
  description: string;
  price: number;
  pricingModel: string;
  category: string;
  displayOrder: number;
};

const emptyProduct: NewProduct = {
  name: "",
  sku: "",
  description: "",
  price: 0,
  pricingModel: "monthly",
  category: "",
  displayOrder: 0,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<NewProduct>(emptyProduct);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.map((p: Product & { price: string | number }) => ({
          ...p,
          price: Number(p.price),
        })));
      }
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSave = async () => {
    if (!form.name || !form.sku || form.price <= 0) {
      toast.error("Name, SKU, and price are required");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? "Product updated" : "Product created");
        setShowForm(false);
        setEditingId(null);
        setForm(emptyProduct);
        fetchProducts();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      price: product.price,
      pricingModel: product.pricingModel,
      category: product.category || "",
      displayOrder: product.displayOrder,
    });
    setShowForm(true);
  };

  const handleDeactivate = async (id: number) => {
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      toast.success("Product deactivated");
      fetchProducts();
    } catch {
      toast.error("Failed to deactivate");
    }
  };

  const pricingLabels: Record<string, string> = {
    monthly: "Monthly",
    annual: "Annual",
    one_time: "One-Time",
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Product Catalog</h1>
        <Button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm(emptyProduct);
          }}
        >
          {showForm ? "Cancel" : "+ New Product"}
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-4 bg-card">
          <h2 className="font-semibold">
            {editingId ? "Edit Product" : "New Product"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="SEO Audit Report"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">SKU *</label>
              <Input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                placeholder="SEO-AUDIT"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Base Price *</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Pricing Model</label>
              <select
                className="w-full h-9 px-2 text-sm border rounded bg-background"
                value={form.pricingModel}
                onChange={(e) => setForm({ ...form, pricingModel: e.target.value })}
              >
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="one_time">One-Time</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Category</label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="SEO, PPC, Social..."
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Display Order</label>
              <Input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Description</label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description..."
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update Product" : "Create Product"}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {products.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No products yet. Create your first one above.</p>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{product.name}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {product.sku}
                  </span>
                  {product.category && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {product.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  ${product.price.toLocaleString("en-US", { minimumFractionDigits: 2 })} / {pricingLabels[product.pricingModel] || product.pricingModel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => handleDeactivate(product.id)}
                >
                  Deactivate
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
