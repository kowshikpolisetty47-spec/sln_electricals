import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackagePlus, Pencil, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, UNITS, fetchProducts, formatINR, type Product } from "@/lib/billing";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — SLN Electricals" },
      {
        name: "description",
        content:
          "Shop owner dashboard to add products, update prices, delete items and organise the catalogue by category.",
      },
      { property: "og:title", content: "Admin Panel — SLN Electricals" },
      {
        property: "og:description",
        content: "Manage the material catalogue so estimate prices stay up to date.",
      },
    ],
  }),
  component: Admin,
});

const productSchema = z.object({
  name: z.string().trim().min(2, "Enter a product name").max(120, "Name is too long"),
  category: z.string().trim().min(1, "Pick a category"),
  unit: z.string().trim().min(1, "Pick a unit"),
  price: z.coerce.number().min(0, "Price cannot be negative").max(10000000, "Price is too high"),
});

type FormState = { name: string; category: string; unit: string; price: string };

const EMPTY: FormState = { name: "", category: CATEGORIES[0], unit: UNITS[0], price: "" };

function Admin() {
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(
    () => ["All", ...new Set([...CATEGORIES, ...products.map((p) => p.category)])],
    [products],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const upsert = useMutation({
    mutationFn: async () => {
      const parsed = productSchema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      if (editingId) {
        const { error } = await supabase.from("products").update(parsed.data).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(parsed.data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success(editingId ? "Product updated" : "Product added");
      setForm(EMPTY);
      setEditingId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Product deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: String(product.price),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const filtered = products.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    return matchesCategory && product.name.toLowerCase().includes(query.trim().toLowerCase());
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Admin Panel</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add products and update prices — estimates always use these rates.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <Card className="border-border p-5 shadow-card lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-foreground">
              {editingId ? "Edit product" : "Add new product"}
            </h2>
            {editingId ? (
              <Button
                size="icon"
                variant="ghost"
                aria-label="Cancel editing"
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <form
            className="mt-4 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              upsert.mutate();
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="name">Product name</Label>
              <Input
                id="name"
                value={form.name}
                maxLength={120}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="e.g. Anchor Roma 6A Switch"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Unit</Label>
                <Select
                  value={form.unit}
                  onValueChange={(value) => setForm({ ...form, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <Button type="submit" disabled={upsert.isPending}>
              <PackagePlus className="h-4 w-4" />
              {editingId ? "Save changes" : "Add product"}
            </Button>
          </form>
        </Card>

        <div className="min-w-0">
          <div className="grid gap-3">
            <div className="relative max-w-sm">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search catalogue…"
                className="bg-card pl-9"
                aria-label="Search catalogue"
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

          <Card className="mt-4 gap-0 overflow-hidden border-border p-0 shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/70 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    <th className="px-4 py-3">Product</th>
                    <th className="w-40 px-4 py-3">Category</th>
                    <th className="w-24 px-4 py-3">Unit</th>
                    <th className="w-28 px-4 py-3 text-right">Price</th>
                    <th className="w-24 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr key={product.id} className="border-t border-border">
                      <td className="px-4 py-2 font-medium">{product.name}</td>
                      <td className="px-4 py-2">
                        <Badge variant="secondary">{product.category}</Badge>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{product.unit}</td>
                      <td className="px-4 py-2 text-right font-bold">
                        {formatINR(product.price)}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit ${product.name}`}
                            onClick={() => startEdit(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Delete ${product.name}`}
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => remove.mutate(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                        No products match this filter.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}