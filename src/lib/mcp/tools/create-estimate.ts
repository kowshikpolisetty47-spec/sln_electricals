import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_estimate",
  title: "Create an estimate",
  description:
    "Save a new estimate for a customer. Totals and GST are calculated from the line items you provide.",
  inputSchema: {
    invoice_number: z.string().trim().min(1).describe("Estimate / invoice number, e.g. EST-260808-1024."),
    customer_name: z.string().trim().optional(),
    customer_phone: z.string().trim().optional(),
    electrician_name: z.string().trim().optional(),
    gst_enabled: z.boolean().default(false),
    gst_rate: z.number().min(0).max(50).default(18),
    items: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          unit: z.string().trim().default("Piece"),
          quantity: z.number().positive(),
          price: z.number().min(0).describe("Price per unit in rupees."),
        }),
      )
      .min(1),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const gstAmount = input.gst_enabled ? (subtotal * input.gst_rate) / 100 : 0;
    const row = {
      invoice_number: input.invoice_number,
      customer_name: input.customer_name ?? null,
      customer_phone: input.customer_phone ?? null,
      electrician_name: input.electrician_name ?? null,
      gst_enabled: input.gst_enabled,
      gst_rate: input.gst_rate,
      subtotal,
      gst_amount: gstAmount,
      total: subtotal + gstAmount,
      item_count: input.items.length,
      items: input.items.map((item, index) => ({
        key: `mcp-${index}`,
        productId: null,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        price: item.price,
      })),
    };
    const { data, error } = await supabaseForUser(ctx)
      .from("estimates")
      .insert(row)
      .select("invoice_number,subtotal,gst_amount,total,item_count")
      .single();
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { estimate: data },
    };
  },
});
