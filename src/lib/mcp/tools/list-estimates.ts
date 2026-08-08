import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_estimates",
  title: "List saved estimates",
  description:
    "List recently saved estimates with invoice number, customer, item count and totals. Pass an invoice number to fetch one estimate with its line items.",
  inputSchema: {
    invoice_number: z.string().trim().optional().describe("Exact invoice number of a single estimate."),
    limit: z.number().int().min(1).max(50).default(10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ invoice_number, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const columns = invoice_number
      ? "invoice_number,customer_name,customer_phone,electrician_name,gst_enabled,gst_rate,subtotal,gst_amount,total,item_count,items,created_at"
      : "invoice_number,customer_name,item_count,total,created_at";
    let request = supabaseForUser(ctx)
      .from("estimates")
      .select(columns)
      .order("created_at", { ascending: false })
      .limit(invoice_number ? 1 : limit);
    if (invoice_number) request = request.eq("invoice_number", invoice_number);
    const { data, error } = await request;
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { estimates: data ?? [] },
    };
  },
});
