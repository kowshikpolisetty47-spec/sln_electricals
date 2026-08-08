import { auth, defineMcp, type AnyToolDefinition } from "@lovable.dev/mcp-js";
import searchProductsTool from "./tools/search-products";
import listEstimatesTool from "./tools/list-estimates";
import createEstimateTool from "./tools/create-estimate";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "sln-electricals",
  title: "SLN Electricals",
  version: "0.1.0",
  instructions:
    "Tools for the SLN Electricals counter-billing app. Use `search_products` to look up materials and prices, `list_estimates` to review saved quotations, and `create_estimate` to save a new quotation.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProductsTool, listEstimatesTool, createEstimateTool] as AnyToolDefinition[],
});
