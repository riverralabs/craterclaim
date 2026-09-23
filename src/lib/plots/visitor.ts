import { randomBytes } from "crypto";
import { cookies, headers } from "next/headers";

export const VISITOR_COOKIE = "cc_vid";
const VISITOR_PATTERN = /^[a-f0-9]{32}$/;

export async function visitorId() {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value ?? "";
  if (VISITOR_PATTERN.test(existing)) return existing;

  const id = randomBytes(16).toString("hex");
  jar.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return id;
}

export async function requestIp() {
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return ip.slice(0, 64);
}
