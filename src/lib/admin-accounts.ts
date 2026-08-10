/** The only login ID allowed into the admin panel. */
export const ADMIN_LOGIN_IDS = ["9866807648"] as const;

export function loginIdToEmail(loginId: string) {
  return `${loginId.trim().toLowerCase()}@sln-electricals.app`;
}
