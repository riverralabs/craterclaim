import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function newSecret() {
  return randomBytes(32).toString("base64url");
}

export function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

export function secretsMatch(secret: string, hash: string | null | undefined) {
  if (!hash || !SECRET_PATTERN.test(secret)) return false;
  const digest = Buffer.from(hashSecret(secret), "utf8");
  const stored = Buffer.from(hash, "utf8");
  if (digest.length !== stored.length || digest.length === 0) return false;
  return timingSafeEqual(digest, stored);
}
