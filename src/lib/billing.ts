import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
};

export type EstimateItem = {
  key: string;
  productId: string | null;
  name: string;
  unit: string;
  quantity: number;
  price: number;
};

export type SavedEstimate = {
  id: string;
  invoice_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  electrician_name: string | null;
  gst_enabled: boolean;
  gst_rate: number;
  subtotal: number;
  gst_amount: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  estimate_time: string | null;
  total: number;
  item_count: number;
  items: EstimateItem[];
  created_at: string;
};

export const CATEGORIES = [
  "Wires",
  "Switches",
  "Pipes",
  "Fittings",
  "Lights",
  "Fans",
  "Plumbing Accessories",
  "MCB & DB",
  "Accessories",
] as const;

export const UNITS = ["Piece", "Meter", "Box", "Roll", "Bundle", "Kg", "Set"] as const;

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDate(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatTime(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function currentTimeValue(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function newInvoiceNumber(): string {
  const now = new Date();
  const stamp = [
    now.getFullYear().toString().slice(-2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `EST-${stamp}-${rand}`;
}

export function newRowKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, category, unit, price")
    .order("category")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, price: Number(row.price) }));
}

export async function fetchEstimates(): Promise<SavedEstimate[]> {
  const { data, error } = await supabase
    .from("estimates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    subtotal: Number(row.subtotal),
    gst_amount: Number(row.gst_amount),
    total: Number(row.total),
    gst_rate: Number(row.gst_rate),
    discount_value: Number(row.discount_value ?? 0),
    discount_amount: Number(row.discount_amount ?? 0),
    items: (row.items as unknown as EstimateItem[]) ?? [],
  })) as SavedEstimate[];
}

export type DiscountType = "none" | "percent" | "amount";

export function computeTotals(
  items: EstimateItem[],
  gstEnabled: boolean,
  gstRate: number,
  discountType: DiscountType = "none",
  discountValue = 0,
) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  let discountAmount = 0;
  if (discountType === "percent") discountAmount = (subtotal * (discountValue || 0)) / 100;
  if (discountType === "amount") discountAmount = discountValue || 0;
  discountAmount = Math.min(Math.max(discountAmount, 0), subtotal);
  const taxable = subtotal - discountAmount;
  const gstAmount = gstEnabled ? (taxable * gstRate) / 100 : 0;
  const itemCount = items.filter((item) => item.name.trim().length > 0).length;
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  return {
    subtotal,
    discountAmount,
    taxable,
    gstAmount,
    total: taxable + gstAmount,
    itemCount,
    totalQuantity,
  };
}