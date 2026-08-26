export function normalizeSocial(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("@")) return trimmed.slice(0, 80);
  if (/^[\w.]{1,40}$/.test(trimmed)) return `@${trimmed}`;
  if (trimmed.includes(".") && !trimmed.includes(" ")) {
    return `https://${trimmed}`;
  }
  return trimmed.slice(0, 80);
}

export function formatSocial(value: string) {
  try {
    if (/^https?:\/\//i.test(value)) {
      return new URL(value).hostname.replace(/^www\./, "");
    }
  } catch {
    // Keep the raw handle.
  }
  return value;
}
