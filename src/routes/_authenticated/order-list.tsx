import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, ListPlus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { ProductPicker } from "@/components/ProductPicker";
import { CATEGORIES, UNITS, fetchProducts, formatDate } from "@/lib/billing";

export const Route = createFileRoute("/_authenticated/order-list")({
  head: () => ({
    meta: [
      { title: "Order List — SLN Electricals" },
      {
        name: "description",
        content:
          "Owner-only purchase list of materials that must be ordered from suppliers, with quantities and status tracking.",
      },
      { property: "og:title", content: "Order List — SLN Electricals" },
      {
        property: "og:description",
        content: "Track stock that needs re-ordering from suppliers.",
      },
    ],
  }),
  component: OrderList,
});

type OrderRow = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  supplier: string | null;
  note: string | null;
  status: string;
  created_at: string;
};

const STATUSES = ["pending", "ordered", "received"] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Enter an item name").max(120, "Name is too long"),
  category: z.string().trim().min(1),
  unit: z.string().trim().min(1),
  quantity: z.coerce.number().positive("Quantity must be greater than 0").max(1000000),
  supplier: z.string().trim().max(120).optional(),
  note: z.string().trim().max(300).optional(),
});

type FormState = {
  name: string;
  category: string;
  unit: string;
  quantity: string;
  supplier: string;
  note: string;
};

const EMPTY: FormState = {
  name: "",
  category: CATEGORIES[0],
  unit: UNITS[0],
  quantity: "1",
  supplier: "",
  note: "",
};

async function fetchOrderList(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("order_list")
    .select("id, name, category, unit, quantity, supplier, note, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, quantity: Number(row.quantity) }));
}

function OrderList() {
  const queryClient = useQueryClient();
  const { data: rows = [] } = useQuery({ queryKey: ["order-list"], queryFn: fetchOrderList });
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const [form, setForm] = useState<FormState>(EMPTY);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["order-list"] });

  const add = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const { error } = await supabase.from("order_list").insert({
        name: parsed.data.name,
        category: parsed.data.category,
        unit: parsed.data.unit,
        quantity: parsed.data.quantity,
        supplier: parsed.data.supplier || null,
        note: parsed.data.note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Added to order list");
      setForm(EMPTY);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("order_list").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("order_list").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Removed");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const pending = rows.filter((row) => row.status === "pending").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Order List</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Items to be ordered from suppliers — {pending} pending.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <ClipboardList className="h-3.5 w-3.5" /> {rows.length} entries
        </Badge>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
        <Card className="border-border p-5 shadow-card lg:sticky lg:top-24">
          <h2 className="text-base font-bold text-foreground">Add item to order</h2>
          <form
            className="mt-4 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              add.mutate();
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="order-name">Item name</Label>
              <ProductPicker
                products={products}
                value={form.name}
                onSelect={(product) =>
                  setForm({
                    ...form,
                    name: product.name,
                    category: product.category,
                    unit: product.unit,
                  })
                }
              />
              <Input
                id="order-name"
                value={form.name}
                maxLength={120}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Or type a new item name"
              />
              <p className="text-xs text-muted-foreground">
                Pick from your products, or type a name that isn't in the catalogue yet.
              </p>
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
                <Label htmlFor="order-qty">Quantity</Label>
                <Input
                  id="order-qty"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.quantity}
                  onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="order-supplier">Supplier (optional)</Label>
              <Input
                id="order-supplier"
                value={form.supplier}
                maxLength={120}
                onChange={(event) => setForm({ ...form, supplier: event.target.value })}
                placeholder="e.g. Sri Balaji Traders"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="order-note">Note (optional)</Label>
              <Input
                id="order-note"
                value={form.note}
                maxLength={300}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                placeholder="e.g. urgent, needed by Friday"
              />
            </div>
            <Button type="submit" disabled={add.isPending}>
              <ListPlus className="h-4 w-4" /> Add to order list
            </Button>
          </form>
        </Card>

        <Card className="gap-0 overflow-hidden border-border p-0 shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/70 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3">Item</th>
                  <th className="w-36 px-4 py-3">Category</th>
                  <th className="w-28 px-4 py-3">Qty</th>
                  <th className="w-40 px-4 py-3">Supplier</th>
                  <th className="w-36 px-4 py-3">Status</th>
                  <th className="w-14 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-4 py-2">
                      <span className="font-medium">{row.name}</span>
                      {row.note ? (
                        <span className="block text-xs text-muted-foreground">{row.note}</span>
                      ) : null}
                      <span className="block text-xs text-muted-foreground">
                        Added {formatDate(row.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="secondary">{row.category}</Badge>
                    </td>
                    <td className="px-4 py-2 font-semibold">
                      {row.quantity} {row.unit}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{row.supplier ?? "—"}</td>
                    <td className="px-4 py-2">
                      <Select
                        value={row.status}
                        onValueChange={(status) => setStatus.mutate({ id: row.id, status })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status[0]!.toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove ${row.name}`}
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => remove.mutate(row.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                      Nothing to order yet — add the first item.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}