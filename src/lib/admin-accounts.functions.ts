import { createServerFn } from "@tanstack/react-start";

/**
 * The only two login IDs allowed into the admin panel.
 * Passwords are fixed here so the shop owner can share them offline.
 */
export const ADMIN_LOGIN_IDS = ["9866807648"] as const;

const ADMIN_ACCOUNTS: { loginId: string; password: string }[] = [
  { loginId: "9866807648", password: "456789" },
];

export function loginIdToEmail(loginId: string) {
  return `${loginId.trim().toLowerCase()}@sln-electricals.app`;
}

/** Idempotently provisions the two admin accounts and grants them owner role. */
export const ensureAdminAccounts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  for (const account of ADMIN_ACCOUNTS) {
    const email = loginIdToEmail(account.loginId);

    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password: account.password,
      email_confirm: true,
    });

    let userId = created.data.user?.id;

    if (!userId) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      userId = data.users.find((user) => user.email?.toLowerCase() === email)?.id;
      if (userId) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: account.password,
          email_confirm: true,
        });
      }
    }

    if (!userId) continue;

    const { data: existingRole } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "owner")
      .maybeSingle();

    if (!existingRole) {
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "owner" });
    }
  }

  // Revoke owner access from any account that is no longer an authorised admin.
  const allowedEmails = ADMIN_ACCOUNTS.map((a) => loginIdToEmail(a.loginId));
  const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const user of allUsers?.users ?? []) {
    if (!user.email || allowedEmails.includes(user.email.toLowerCase())) continue;
    await supabaseAdmin.from("user_roles").delete().eq("user_id", user.id);
  }

  return { ok: true };
});
