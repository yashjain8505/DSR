import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Whether an email may enter a RESTRICTED room. Callers handle the open-room
 * case (restrict_access !== true) before calling this.
 *
 * Allowed when:
 *  - the email is @linkrunner.io (Linkrunner team, always allowed), or
 *  - there's an exact room_access entry for the email, or
 *  - there's a domain entry the email matches. A domain entry is a row whose
 *    `email` is stored as "@company.com" (or bare "company.com"); any visitor
 *    from that domain is then allowed.
 */
export async function isEmailAllowed(
  admin: SupabaseClient,
  roomId: string,
  email: string
): Promise<boolean> {
  const e = email.trim().toLowerCase();
  if (!e.includes("@")) return false;
  if (e.endsWith("@linkrunner.io")) return true;

  const domain = e.split("@")[1];

  const { data } = await admin
    .from("room_access")
    .select("email")
    .eq("room_id", roomId);

  return (data ?? []).some((row: { email: string | null }) => {
    const v = (row.email ?? "").trim().toLowerCase();
    if (!v) return false;
    if (v === e) return true; // exact email
    if (v.startsWith("@")) return v === `@${domain}`; // "@company.com"
    if (!v.includes("@")) return v === domain; // bare "company.com"
    return false;
  });
}
