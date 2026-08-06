import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchProducts, formatINR } from "@/lib/billing";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Product Catalogue — SLN Electricals" },
      {
        name: "description",
        content:
          "Search live prices for wires, switches, pipes, fittings, lights, fans and plumbing accessories.",
      },
      { property: "og:title", content: "Product Catalogue — SLN Electricals" },
      {
        property: "og:description",
        content: "Browse shop material prices by category with instant search.",
      },
    ],
  }),
  component: Products,
});

function Products() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...new Set((products ?? []).map((product) => product.category))],
    [products],
  );

  const filtered = (products ?? []).filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const matchesQuery = product.name.toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Product Catalogue</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {products?.length ?? 0} items in the shop database.
      </p>

      <div className="mt-6 grid gap-3">
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by product name…"
            className="bg-card pl-9"
            aria-label="Search products"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={category === item ? "default" : "outline"}
              onClick={() => setCategory(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center gap-2 border-dashed p-10 text-center">
          <PackageSearch className="h-6 w-6 text-brand" />
          <p className="text-sm text-muted-foreground">No products match this search.</p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <Card key={product.id} className="border-border p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <h2 className="min-w-0 text-sm font-bold text-foreground">{product.name}</h2>
                <Badge variant="secondary" className="shrink-0">
                  {product.category}
                </Badge>
              </div>
              <p className="mt-4 text-xl font-extrabold text-brand-dark">
                {formatINR(product.price)}
                <span className="ml-1 text-xs font-semibold text-muted-foreground">
                  / {product.unit}
                </span>
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}