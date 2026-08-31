export function withSignedIn(path: string, method: string) {
  const queryAt = path.indexOf("?");
  const pathname = queryAt === -1 ? path : path.slice(0, queryAt);
  const query = queryAt === -1 ? "" : path.slice(queryAt + 1);
  const params = new URLSearchParams(query);
  if (!params.has("signed_in")) params.set("signed_in", method);
  return `${pathname}?${params.toString()}`;
}
