export const OAUTH_PROVIDERS = [
  { id: "google", label: "Continue with Google" },
  { id: "apple", label: "Continue with Apple" },
  { id: "twitter", label: "Continue with X" },
] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number]["id"];
