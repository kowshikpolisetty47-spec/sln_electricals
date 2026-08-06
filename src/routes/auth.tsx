import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    denied: search['denied'] === true || search['denied'] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Admin Login — SLN Electricals" },
      {
        name: "description",
        content: "Shop owner sign in to manage the SLN Electricals product catalogue and prices.",
      },
      { property: "og:title", content: "Admin Login — SLN Electricals" },
      {
        property: "og:description",
        content: "Secure login for the SLN Electricals admin panel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { denied } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function routeIfOwner(userId: string) {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "owner")
        .maybeSingle();
      if (!active) return;
      if (data) {
        navigate({ to: "/admin", replace: true });
      } else {
        await supabase.auth.signOut();
        toast.error("This account is not a shop owner. Admin access is owner-only.");
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !denied) void routeIfOwner(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === "SIGNED_IN") void routeIfOwner(session.user.id);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate, denied]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        toast.success("Check your email to confirm the account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <Card className="border-border p-6 shadow-card">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-brand-foreground">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-brand-dark">Admin login</h1>
            <p className="text-xs text-muted-foreground">
              Only the shop owner can manage products and prices.
            </p>
          </div>
        </div>

        {denied ? (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            That account does not have owner access. Sign in with the shop owner account.
          </p>
        ) : null}

        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="owner@example.com"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" disabled={busy}>
            <LogIn className="h-4 w-4" />
            {mode === "signup" ? "Create admin account" : "Sign in"}
          </Button>
        </form>

        <div className="mt-4 grid gap-3">
          <button
            type="button"
            className="text-xs font-semibold text-brand-dark underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
}
