import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "cc_admin";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type AdminSession = { email: string; exp: number };

function signingKey() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function adminEmail() {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function adminCredentialsConfigured() {
  return Boolean(adminEmail() && adminPassword() && signingKey());
}

function sign(value: string) {
  return createHmac("sha256", signingKey()).update(value).digest("base64url");
}

function encode(session: AdminSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decode(token: string | undefined): AdminSession | null {
  if (!token || !signingKey()) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(mac);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (!session?.email || typeof session.exp !== "number" || session.exp < Date.now()) return null;
    if (session.email !== adminEmail()) return null;
    return session;
  } catch {
    return null;
  }
}

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  if (!adminCredentialsConfigured()) return null;
  const jar = await cookies();
  return decode(jar.get(COOKIE)?.value);
}

export async function createAdminSession() {
  const email = adminEmail();
  const jar = await cookies();
  jar.set(COOKIE, encode({ email, exp: Date.now() + WEEK_MS }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK_MS / 1000,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function verifyAdminCredentials(email: string, password: string) {
  if (!adminCredentialsConfigured()) return false;
  return equal(email.trim().toLowerCase(), adminEmail()) && equal(password, adminPassword());
}
