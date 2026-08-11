import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileDown, MessageCircle, Plus, Printer, RotateCcw, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ProductPicker } from "@/components/ProductPicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import {
  computeTotals,
  currentTimeValue,
  fetchProducts,
  formatDate,
  formatINR,
  newInvoiceNumber,
  newRowKey,
  type DiscountType,
  type EstimateItem,
} from "@/lib/billing";

export const Route = createFileRoute("/create-estimate")({
  head: () => ({
    meta: [
      { title: "Create Estimate — SLN Electricals" },
      {
        name: "description",
        content:
          "Build a customer quotation line by line with searchable products, live totals, GST and print or PDF output.",
      },
      { property: "og:title", content: "Create Estimate — SLN Electricals" },
      {
        property: "og:description",
        content: "Dynamic invoice table with auto-filled prices and instant grand total.",
      },
    ],
  }),
  component: CreateEstimate,
});

function emptyRow(): EstimateItem {
  return { key: newRowKey(), productId: null, name: "", unit: "Piece", quantity: 1, price: 0 };
}

function CreateEstimate() {
  const queryClient = useQueryClient();
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  const [invoiceNumber, setInvoiceNumber] = useState(newInvoiceNumber);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [electricianName, setElectricianName] = useState("");
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState(18);
  const [estimateTime, setEstimateTime] = useState(currentTimeValue);
  const [discountType, setDiscountType] = useState<DiscountType>("none");
  const [discountValue, setDiscountValue] = useState(0);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [items, setItems] = useState<EstimateItem[]>([emptyRow()]);

  const totals = useMemo(
    () => computeTotals(items, gstEnabled, gstRate, discountType, discountValue),
    [items, gstEnabled, gstRate, discountType, discountValue],
  );

  function updateRow(key: string, patch: Partial<EstimateItem>) {
    setItems((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeRow(key: string) {
    setItems((rows) => (rows.length === 1 ? [emptyRow()] : rows.filter((r) => r.key !== key)));
  }

  function resetAll() {
    setItems([emptyRow()]);
    setCustomerName("");
    setCustomerPhone("");
    setElectricianName("");
    setGstEnabled(false);
    setDiscountType("none");
    setDiscountValue(0);
    setEstimateTime(currentTimeValue());
    setInvoiceNumber(newInvoiceNumber());
    setWhatsappNumber("");
  }

  function buildWhatsappMessage() {
    const filled = items.filter((item) => item.name.trim().length > 0);
    const lines = [
      "*SLN Electricals*",
      "Electrical & Plumbing Materials",
      "",
      `Estimate: ${invoiceNumber}`,
      `Date: ${formatDate(new Date())}${estimateTime ? ` · ${estimateTime}` : ""}`,
    ];
    if (customerName) lines.push(`Customer: ${customerName}`);
    if (electricianName) lines.push(`Electrician/Plumber: ${electricianName}`);
    lines.push("", "*Items*");
    filled.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.name} — ${item.quantity} ${item.unit} x ${formatINR(item.price)} = ${formatINR(item.quantity * item.price)}`,
      );
    });
    lines.push("", `Grand total: ${formatINR(totals.subtotal)}`);
    if (totals.discountAmount > 0) {
      lines.push(
        `Discount${discountType === "percent" ? ` @ ${discountValue}%` : ""}: -${formatINR(totals.discountAmount)}`,
      );
    }
    if (gstEnabled) lines.push(`GST @ ${gstRate}%: ${formatINR(totals.gstAmount)}`);
    lines.push(`*Final total: ${formatINR(totals.total)}*`);
    lines.push("", "This estimate is a quotation only and is valid for 7 days.");
    return lines.join("\n");
  }

  function sendWhatsapp() {
    const filled = items.filter((item) => item.name.trim().length > 0);
    if (filled.length === 0) {
      toast.error("Add at least one item before sending.");
      return;
    }
    const digits = (whatsappNumber || customerPhone).replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Enter a valid WhatsApp number (10 digits, or with country code).");
      return;
    }
    const withCode = digits.length === 10 ? `91${digits}` : digits;
    window.open(
      `https://wa.me/${withCode}?text=${encodeURIComponent(buildWhatsappMessage())}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const save = useMutation({
    mutationFn: async () => {
      const filled = items.filter((item) => item.name.trim().length > 0);
      if (filled.length === 0) throw new Error("Add at least one item before saving.");
      const { error } = await supabase.from("estimates").insert({
        invoice_number: invoiceNumber,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        electrician_name: electricianName || null,
        gst_enabled: gstEnabled,
        gst_rate: gstRate,
        estimate_time: estimateTime || null,
        discount_type: discountType,
        discount_value: discountValue,
        discount_amount: totals.discountAmount,
        subtotal: totals.subtotal,
        gst_amount: totals.gstAmount,
        total: totals.total,
        item_count: filled.length,
        items: filled as unknown as never,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast.success(`Estimate ${invoiceNumber} saved`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Create Estimate</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick items, enter quantities — totals calculate automatically.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={resetAll}>
            <RotateCcw className="h-4 w-4" /> New
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
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
      </div>

      <Card className="print-sheet mt-6 gap-0 overflow-hidden border-border p-0 shadow-card">
        <div className="border-b border-border bg-brand-soft/60 px-5 py-5 sm:px-7">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-brand-dark sm:text-xl">
                SLN Electricals
              </h2>
              <p className="text-xs text-muted-foreground">
                Electrical &amp; Plumbing Materials · Wholesale &amp; Retail
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Estimate / Quotation
              </p>
              <p className="hidden font-mono text-sm font-bold text-brand-dark print:block">
                {invoiceNumber}
              </p>
              <div className="no-print mt-1 grid gap-1 sm:justify-items-end">
                <Label htmlFor="invoice-number" className="text-xs">
                  Estimate number
                </Label>
                <Input
                  id="invoice-number"
                  value={invoiceNumber}
                  maxLength={40}
                  onChange={(event) => setInvoiceNumber(event.target.value)}
                  placeholder="EST-0001"
                  className="bg-card font-mono sm:w-48 sm:text-right"
                  aria-label="Estimate number"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Date: {formatDate(new Date())} · Time: {estimateTime || "—"}
              </p>
              <div className="no-print mt-1 grid gap-1 sm:justify-items-end">
                <Label htmlFor="estimate-time" className="text-xs">
                  Time
                </Label>
                <Input
                  id="estimate-time"
                  type="time"
                  value={estimateTime}
                  onChange={(event) => setEstimateTime(event.target.value)}
                  className="bg-card sm:w-48"
                />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="customer" className="text-xs">
                Customer name
              </Label>
              <Input
                id="customer"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="bg-card"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone" className="text-xs">
                Phone number
              </Label>
              <Input
                id="phone"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                inputMode="tel"
                maxLength={15}
                placeholder="98765 43210"
                className="bg-card"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="electrician" className="text-xs">
                Electrician / Plumber
              </Label>
              <Input
                id="electrician"
                value={electricianName}
                onChange={(event) => setElectricianName(event.target.value)}
                placeholder="e.g. Suresh"
                className="bg-card"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-sm">
            <thead>
              <tr className="bg-muted/70 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase">
                <th className="w-10 px-3 py-3">#</th>
                <th className="px-3 py-3">Item name</th>
                <th className="w-24 px-3 py-3">Unit</th>
                <th className="w-24 px-3 py-3">Qty</th>
                <th className="w-32 px-3 py-3">Rate</th>
                <th className="w-32 px-3 py-3 text-right">Total</th>
                <th className="no-print w-12 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.key} className="border-t border-border align-middle">
                  <td className="px-3 py-2 text-muted-foreground">{index + 1}</td>
                  <td className="px-3 py-2">
                    <ProductPicker
                      products={products}
                      value={item.name}
                      onSelect={(product) =>
                        updateRow(item.key, {
                          productId: product.id,
                          name: product.name,
                          unit: product.unit,
                          price: product.price,
                        })
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{item.unit}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.quantity}
                      onChange={(event) =>
                        updateRow(item.key, { quantity: Number(event.target.value) || 0 })
                      }
                      aria-label="Quantity"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.price}
                      onChange={(event) =>
                        updateRow(item.key, { price: Number(event.target.value) || 0 })
                      }
                      aria-label="Price per piece"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-foreground">
                    {formatINR(item.quantity * item.price)}
                  </td>
                  <td className="no-print px-3 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remove item"
                      onClick={() => removeRow(item.key)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="no-print border-t border-border px-3 py-3">
          <Button variant="secondary" onClick={() => setItems((rows) => [...rows, emptyRow()])}>
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>

        <div className="grid gap-6 border-t border-border bg-muted/40 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Total items:</span>{" "}
              {totals.itemCount} ({totals.totalQuantity} units)
            </p>
            <p className="max-w-md text-xs">
              This estimate is a quotation only. Prices are subject to change without prior notice
              and are valid for 7 days.
            </p>
            <div className="no-print flex items-center gap-3 pt-2">
              <Switch id="gst" checked={gstEnabled} onCheckedChange={setGstEnabled} />
              <Label htmlFor="gst" className="text-sm">
                Apply GST
              </Label>
              <Input
                type="number"
                min={0}
                max={28}
                value={gstRate}
                onChange={(event) => setGstRate(Number(event.target.value) || 0)}
                disabled={!gstEnabled}
                aria-label="GST percentage"
                className="w-20 bg-card"
              />
              <span className="text-sm">%</span>
            </div>
            <div className="no-print flex flex-wrap items-center gap-2 pt-1">
              <Label className="text-sm">Discount</Label>
              <div className="flex overflow-hidden rounded-lg border border-border">
                {(
                  [
                    ["none", "None"],
                    ["percent", "%"],
                    ["amount", "₹"],
                  ] as [DiscountType, string][]
                ).map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDiscountType(type)}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                      discountType === type
                        ? "bg-brand text-brand-foreground"
                        : "bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={discountValue}
                onChange={(event) => setDiscountValue(Number(event.target.value) || 0)}
                disabled={discountType === "none"}
                aria-label="Discount value"
                className="w-24 bg-card"
              />
            </div>
            <div className="no-print grid gap-1.5 pt-2 sm:max-w-sm">
              <Label htmlFor="whatsapp" className="text-sm">
                Send bill on WhatsApp
              </Label>
              <div className="flex gap-2">
                <Input
                  id="whatsapp"
                  value={whatsappNumber}
                  inputMode="tel"
                  maxLength={15}
                  onChange={(event) => setWhatsappNumber(event.target.value)}
                  placeholder={customerPhone || "WhatsApp number"}
                  className="bg-card"
                />
                <Button
                  type="button"
                  onClick={sendWhatsapp}
                  className="shrink-0 bg-[#25D366] text-white hover:bg-[#1eb457]"
                >
                  <MessageCircle className="h-4 w-4" /> Send
                </Button>
              </div>
              <p className="text-xs">
                Leave blank to use the customer phone number. Indian numbers get +91 automatically.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-card">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Number of items</dt>
                <dd className="font-semibold">{totals.itemCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Grand total</dt>
                <dd className="font-semibold">{formatINR(totals.subtotal)}</dd>
              </div>
              {totals.discountAmount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Discount{discountType === "percent" ? ` @ ${discountValue}%` : ""}
                  </dt>
                  <dd className="font-semibold text-destructive">
                    − {formatINR(totals.discountAmount)}
                  </dd>
                </div>
              ) : null}
              {gstEnabled ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">GST @ {gstRate}%</dt>
                  <dd className="font-semibold">{formatINR(totals.gstAmount)}</dd>
                </div>
              ) : null}
            </dl>
            <Separator className="my-4" />
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold tracking-wide text-muted-foreground uppercase">
                Final total
              </span>
              <span className="text-2xl font-extrabold text-brand-dark">
                {formatINR(totals.total)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}