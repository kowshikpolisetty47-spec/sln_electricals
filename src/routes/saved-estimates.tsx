import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileDown, FileText, Printer, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { fetchEstimates, formatDate, formatINR, type SavedEstimate } from "@/lib/billing";

export const Route = createFileRoute("/saved-estimates")({
  head: () => ({
    meta: [
      { title: "Saved Estimates — SLN Electricals" },
      {
        name: "description",
        content:
          "Look up past quotations by invoice number, customer or electrician and reprint them anytime.",
      },
      { property: "og:title", content: "Saved Estimates — SLN Electricals" },
      {
        property: "og:description",
        content: "All shop quotations stored with totals, GST and line items.",
      },
    ],
  }),
  component: SavedEstimates,
});

function SavedEstimates() {
  const queryClient = useQueryClient();
  const { data: estimates, isLoading } = useQuery({
    queryKey: ["estimates"],
    queryFn: fetchEstimates,
  });
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<SavedEstimate | null>(null);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("estimates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      setOpen(null);
      toast.success("Estimate deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const needle = query.trim().toLowerCase();
  const filtered = (estimates ?? []).filter((estimate) =>
    [estimate.invoice_number, estimate.customer_name, estimate.electrician_name, estimate.customer_phone]
      .filter(Boolean)
      .some((field) => (field as string).toLowerCase().includes(needle)),
  );

  if (open) {
    return <EstimateSheet estimate={open} onBack={() => setOpen(null)} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Saved Estimates</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {estimates?.length ?? 0} quotations stored.
      </p>

      <div className="relative mt-6 max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search invoice no., customer or electrician…"
          className="bg-card pl-9"
          aria-label="Search estimates"
        />
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center gap-2 border-dashed p-10 text-center">
          <FileText className="h-6 w-6 text-brand" />
          <p className="text-sm text-muted-foreground">No saved estimates found.</p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((estimate) => (
            <Card key={estimate.id} className="border-border p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-xs font-bold text-brand">{estimate.invoice_number}</p>
                {estimate.gst_enabled ? (
                  <Badge variant="secondary">GST {estimate.gst_rate}%</Badge>
                ) : null}
              </div>
              <p className="mt-2 truncate font-bold text-foreground">
                {estimate.customer_name || "Walk-in customer"}
              </p>
              <p className="text-xs text-muted-foreground">
                {estimate.customer_phone || "No phone"} ·{" "}
                {estimate.electrician_name || "No electrician"}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {formatDate(estimate.created_at)} · {estimate.item_count} items
              </p>
              <p className="mt-2 text-xl font-extrabold text-brand-dark">
                {formatINR(estimate.total)}
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setOpen(estimate)}>
                  <FileText className="h-4 w-4" /> View
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => remove.mutate(estimate.id)}
                  aria-label="Delete estimate"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EstimateSheet({ estimate, onBack }: { estimate: SavedEstimate; onBack: () => void }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="no-print flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={onBack}>
          Back to list
        </Button>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button
          size="sm"
          onClick={() => {
            toast.info("Choose “Save as PDF” as the destination in the print dialog.");
            window.print();
          }}
        >
          <FileDown className="h-4 w-4" /> PDF
        </Button>
      </div>

      <Card className="print-sheet mt-5 gap-0 overflow-hidden border-border p-0 shadow-card">
        <div className="grid gap-3 border-b border-border bg-brand-soft/60 px-6 py-5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0">
            <h1 className="text-lg font-extrabold text-brand-dark sm:text-xl">
              SLN Electricals
            </h1>
            <p className="text-xs text-muted-foreground">
              Electrical &amp; Plumbing Materials · Wholesale &amp; Retail
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              Estimate / Quotation
            </p>
            <p className="font-mono text-sm font-bold text-brand-dark">
              {estimate.invoice_number}
            </p>
            <p className="text-xs text-muted-foreground">
              Date: {formatDate(estimate.created_at)}
            </p>
          </div>
        </div>

        <dl className="grid gap-3 border-b border-border px-6 py-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Customer</dt>
            <dd className="font-semibold">{estimate.customer_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Phone</dt>
            <dd className="font-semibold">{estimate.customer_phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Electrician / Plumber</dt>
            <dd className="font-semibold">{estimate.electrician_name || "—"}</dd>
          </div>
        </dl>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="bg-muted/70 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                <th className="w-10 px-4 py-3">#</th>
                <th className="px-4 py-3">Item</th>
                <th className="w-20 px-4 py-3">Unit</th>
                <th className="w-16 px-4 py-3">Qty</th>
                <th className="w-28 px-4 py-3">Rate</th>
                <th className="w-28 px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {estimate.items.map((item, index) => (
                <tr key={item.key ?? index} className="border-t border-border">
                  <td className="px-4 py-2 text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-2 font-medium">{item.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{item.unit}</td>
                  <td className="px-4 py-2">{item.quantity}</td>
                  <td className="px-4 py-2">{formatINR(item.price)}</td>
                  <td className="px-4 py-2 text-right font-bold">
                    {formatINR(item.quantity * item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-6 border-t border-border bg-muted/40 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <p className="text-xs text-muted-foreground">
            Total items: {estimate.item_count}. This estimate is a quotation only; prices are valid
            for 7 days.
          </p>
          <div className="rounded-xl border border-border bg-card p-5">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Grand total</dt>
                <dd className="font-semibold">{formatINR(estimate.subtotal)}</dd>
              </div>
              {estimate.gst_enabled ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">GST @ {estimate.gst_rate}%</dt>
                  <dd className="font-semibold">{formatINR(estimate.gst_amount)}</dd>
                </div>
              ) : null}
            </dl>
            <Separator className="my-4" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
                Final total
              </span>
              <span className="text-2xl font-extrabold text-brand-dark">
                {formatINR(estimate.total)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}