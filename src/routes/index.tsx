import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  FileText,
  IndianRupee,
  Lightbulb,
  Plus,
  Printer,
  Save,
  Settings2,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchEstimates, fetchProducts, formatDate, formatINR } from "@/lib/billing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shakti Electricals & Plumbing — Estimate Billing" },
      {
        name: "description",
        content:
          "Create customer estimates for wires, switches, pipes, fittings, lights and fans in minutes with live shop prices.",
      },
      { property: "og:title", content: "Shakti Electricals & Plumbing — Estimate Billing" },
      {
        property: "og:description",
        content: "Billing software for electrical and plumbing wholesale material stores.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const products = useQuery({ queryKey: ["products"], queryFn: fetchProducts });
  const estimates = useQuery({ queryKey: ["estimates"], queryFn: fetchEstimates });

  const categories = new Set((products.data ?? []).map((product) => product.category));
  const latest = (estimates.data ?? []).slice(0, 4);

  return (
    <div>
      <section className="invoice-grid border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold tracking-wide text-brand-dark uppercase">
                <Wrench className="h-3.5 w-3.5" /> Counter billing made simple
              </span>
              <h1 className="mt-5 text-3xl leading-tight font-extrabold text-brand-dark sm:text-4xl lg:text-5xl">
                Prepare an estimate for your customer in under two minutes.
              </h1>
              <p className="mt-4 max-w-xl text-base text-muted-foreground">
                Built for electricians and plumbers at the counter. Pick materials from the shop
                catalogue, enter quantities, and print a professional quotation with GST.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/create-estimate">
                    <FileText className="h-4 w-4" /> Create Estimate
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/products">
                    <Boxes className="h-4 w-4" /> Browse Products
                  </Link>
                </Button>
              </div>
            </div>

            <Card className="border-border p-6 shadow-lift">
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Shop snapshot
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-brand-soft p-4">
                  <dt className="text-xs font-semibold text-brand-dark/70">Products</dt>
                  <dd className="mt-1 text-2xl font-extrabold text-brand-dark">
                    {products.data?.length ?? "—"}
                  </dd>
                </div>
                <div className="rounded-xl bg-brand-soft p-4">
                  <dt className="text-xs font-semibold text-brand-dark/70">Categories</dt>
                  <dd className="mt-1 text-2xl font-extrabold text-brand-dark">
                    {categories.size || "—"}
                  </dd>
                </div>
                <div className="rounded-xl bg-muted p-4">
                  <dt className="text-xs font-semibold text-muted-foreground">Saved estimates</dt>
                  <dd className="mt-1 text-2xl font-extrabold text-foreground">
                    {estimates.data?.length ?? "—"}
                  </dd>
                </div>
                <div className="rounded-xl bg-muted p-4">
                  <dt className="text-xs font-semibold text-muted-foreground">Today</dt>
                  <dd className="mt-1 text-base font-bold text-foreground">
                    {formatDate(new Date())}
                  </dd>
                </div>
              </dl>
              <Button asChild variant="secondary" className="mt-5 w-full">
                <Link to="/admin">
                  <Settings2 className="h-4 w-4" /> Manage catalogue &amp; prices
                </Link>
              </Button>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 pb-16 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-brand-dark sm:text-2xl">Recent estimates</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/saved-estimates">View all</Link>
          </Button>
        </div>
        {latest.length === 0 ? (
          <Card className="mt-5 flex flex-col items-center gap-3 border-dashed p-10 text-center">
            <Lightbulb className="h-6 w-6 text-brand" />
            <p className="text-sm text-muted-foreground">
              No estimates yet. Create your first quotation to see it here.
            </p>
            <Button asChild size="sm">
              <Link to="/create-estimate">Create Estimate</Link>
            </Button>
          </Card>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((estimate) => (
              <Card key={estimate.id} className="border-border p-5 shadow-card">
                <p className="font-mono text-xs font-semibold text-brand">
                  {estimate.invoice_number}
                </p>
                <p className="mt-2 truncate font-bold text-foreground">
                  {estimate.customer_name || "Walk-in customer"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(estimate.created_at)} · {estimate.item_count} items
                </p>
                <p className="mt-3 text-lg font-extrabold text-brand-dark">
                  {formatINR(estimate.total)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
