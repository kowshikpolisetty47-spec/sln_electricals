import { Link } from "@tanstack/react-router";
import { Menu, Plug, Wrench } from "lucide-react";
import { useState } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/create-estimate", label: "Create Estimate" },
  { to: "/products", label: "Products" },
  { to: "/saved-estimates", label: "Saved Estimates" },
  { to: "/order-list", label: "Order List" },
  { to: "/admin", label: "Admin" },
] as const;

export function StoreHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground shadow-card">
            <Plug className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-base font-extrabold text-brand-dark sm:text-lg">
              SLN Electricals
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              <Wrench className="h-3 w-3" /> Wholesale Materials Store
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground data-[status=active]:bg-brand-soft data-[status=active]:text-brand-dark"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setOpen((prev) => !prev)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border text-brand-dark lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open ? (
        <nav className="grid gap-1 border-t border-border bg-card px-4 py-3 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground data-[status=active]:bg-brand-soft data-[status=active]:text-brand-dark"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}