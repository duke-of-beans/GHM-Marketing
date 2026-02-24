"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, SlidersHorizontal, LayoutList, LayoutGrid } from "lucide-react";
import { ProductDialog } from "./product-dialog";
import { toast } from "sonner";

type Product = {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  price: number;
  pricingModel: string;
  isActive: boolean;
};

export function ProductCatalog({ products: initialProducts }: { products: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name" | "price" | "category">("name");
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("product-catalog-view") as "list" | "grid") ?? "list";
    }
    return "list";
  });

  const toggleView = (mode: "list" | "grid") => {
    setViewMode(mode);
    localStorage.setItem("product-catalog-view", mode);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success('Service deleted successfully');
      } else {
        toast.error('Failed to delete service');
      }
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast.error('Failed to delete service', {
        description: 'An unexpected error occurred'
      });
    }
  };

  const handleSave = (product: Product) => {
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? product : p))
      );
      toast.success('Service updated successfully');
    } else {
      setProducts((prev) => [product, ...prev]);
      toast.success('Service added successfully', {
        description: 'Service is now available for upsell recommendations'
      });
    }
    setDialogOpen(false);
  };

  // Get unique categories
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Search filter
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      
      // Status filter
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && product.isActive) ||
        (statusFilter === "inactive" && !product.isActive);
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "price") {
        return Number(a.price) - Number(b.price);
      } else if (sortBy === "category") {
        const catA = a.category || "";
        const catB = b.category || "";
        return catA.localeCompare(catB);
      }
      return 0;
    });

  const activeProducts = filteredProducts.filter((p) => p.isActive);
  const inactiveProducts = filteredProducts.filter((p) => !p.isActive);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="price">Sort by Price</SelectItem>
            <SelectItem value="category">Sort by Category</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats and Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{activeProducts.length} Active</span>
          <span>{inactiveProducts.length} Inactive</span>
          <span className="text-muted-foreground/60">|</span>
          <span>{filteredProducts.length} of {products.length} shown</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-r-none border-r"
              onClick={() => toggleView("list")}
              title="List view"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => toggleView("grid")}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add Service
          </Button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {products.length === 0 ? (
              <>
                <p className="text-muted-foreground mb-2 font-medium">
                  No services in your catalog yet
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your SEO service packages here. The system will automatically suggest relevant upsells to clients based on competitive gaps detected in scans.
                </p>
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Your First Service
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-2">
                  No services match your filters
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "grid" ? (
        /* ── Grid view ── */
        <>
          {activeProducts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Active Services</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm leading-snug">{product.name}</p>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(product)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.category && <Badge variant="outline" className="text-[10px]">{product.category}</Badge>}
                      <Badge className="text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">Active</Badge>
                    </div>
                    <p className="text-sm font-semibold">${Number(product.price)}<span className="text-xs font-normal text-muted-foreground ml-1 capitalize">{product.pricingModel}</span></p>
                    {product.description && <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {inactiveProducts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Inactive Services</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inactiveProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 bg-card opacity-60 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm leading-snug">{product.name}</p>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(product)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.category && <Badge variant="outline" className="text-[10px]">{product.category}</Badge>}
                      <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                    </div>
                    <p className="text-sm font-semibold">${Number(product.price)}<span className="text-xs font-normal text-muted-foreground ml-1 capitalize">{product.pricingModel}</span></p>
                    {product.description && <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* ── List view (original) ── */
        <>
          {activeProducts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Active Services</h3>
              {activeProducts.map((product) => (
                <Card key={product.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          {product.category && (
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground">
                            {product.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Price: </span>
                        <span className="font-semibold">${Number(product.price)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Model: </span>
                        <span className="capitalize">{product.pricingModel}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {inactiveProducts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Inactive Services
              </h3>
              {inactiveProducts.map((product) => (
                <Card key={product.id} className="opacity-60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          {product.category && (
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          )}
                          <Badge variant="secondary">Inactive</Badge>
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground">
                            {product.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Price: </span>
                        <span className="font-semibold">${Number(product.price)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Model: </span>
                        <span className="capitalize">{product.pricingModel}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
        </>
      )}

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSave={handleSave}
      />
    </div>
  );
}
