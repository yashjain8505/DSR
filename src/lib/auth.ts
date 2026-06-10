import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Admin session auth.
 *
 * The session cookie holds `<expiryMs>.<hmac>` where the HMAC is
 * SHA-256 over the expiry timestamp, keyed by SESSION_SECRET
 * (falling back to ADMIN_PASSWORD so existing deployments keep
 * working before the new env var is set). Forging a session
 * requires knowing the secret; a plain "true" cookie no longer works.
 */

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string | null {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

function sign(expiry: string, secret: string): string {
  return createHmac("sha256", secret).update(expiry).digest("hex");
}

/**
 * Create a signed session token. Returns null if no secret is configured.
 */
export function createSessionToken(): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const expiry = String(Date.now() + SESSION_TTL_SECONDS * 1000);
  return `${expiry}.${sign(expiry, secret)}`;
}

/**
 * Verify a session token: well-formed, unexpired, valid signature.
 */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const secret = getSecret();
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [expiry, signature] = parts;
  if (!/^\d+$/.test(expiry)) return false;
  if (Number(expiry) < Date.now()) return false;

  const expected = sign(expiry, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Whether the current request carries a valid admin session.
 * Usable in Server Components and Route Handlers.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

/**
 * Route-handler guard. Call at the top of every admin-only handler:
 *
 *   const unauthorized = await requireAdmin();
 *   if (unauthorized) return unauthorized;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdminAuthenticated()) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
