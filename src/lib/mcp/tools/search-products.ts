import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description:
    "Search the SLN Electricals catalogue by product name or category and return name, category, unit and price.",
  inputSchema: {
    query: z.string().trim().default("").describe("Text to match in the product name."),
    category: z.string().trim().optional().describe("Optional exact category filter, e.g. Wires."),
    limit: z.number().int().min(1).max(100).default(25),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    let request = supabaseForUser(ctx)
      .from("products")
      .select("id,name,category,unit,price")
      .order("name")
      .limit(limit);
    if (query) request = request.ilike("name", `%${query}%`);
    if (category) request = request.eq("category", category);
    const { data, error } = await request;
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
