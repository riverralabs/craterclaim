export const OAUTH_PROVIDERS = [
  { id: "google", label: "Continue with Google" },
  { id: "twitter", label: "Continue with X" },
] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number]["id"];

export function oauthCallbackUrl(nextPath: string) {
  const here = window.location.origin;
  const env = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const origin = /localhost|127\.0\.0\.1/i.test(here)
    ? env && !/localhost|127\.0\.0\.1/i.test(env)
      ? env
      : here
    : here;
  return `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
