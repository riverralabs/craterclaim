export function websiteHref(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "/";
    if (!parsed.searchParams.has("ref")) {
      parsed.searchParams.set("ref", "craterclaim");
    }
    return parsed.toString();
  } catch {
    return "/";
  }
}
