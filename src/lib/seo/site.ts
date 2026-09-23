const FALLBACK = "https://www.craterclaim.com";

export function siteOrigin() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK).trim();
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      url.protocol = "https:";
    }
    url.hash = "";
    url.search = "";
    return url.origin;
  } catch {
    return FALLBACK;
  }
}
