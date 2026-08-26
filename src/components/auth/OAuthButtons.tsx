"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OAUTH_PROVIDERS, type OAuthProviderId } from "@/lib/auth/oauth";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function OAuthButtons({ nextPath }: { nextPath: string }) {
  const configured = isSupabaseConfigured();
  const [pending, setPending] = useState<OAuthProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!configured) {
    return (
      <p className="mt-6 max-w-md leading-relaxed text-lunar-silver">
        Connect Supabase, then enable Google, Apple, and X in Auth providers.
      </p>
    );
  }

  async function start(provider: OAuthProviderId) {
    setPending(provider);
    setError(null);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (oauthError) setError(oauthError.message);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start sign-in.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mt-6 max-w-md space-y-3">
      {OAUTH_PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          size="lg"
          variant="outline"
          disabled={Boolean(pending)}
          className="min-h-11 w-full cursor-pointer border-white/15"
          onClick={() => void start(provider.id)}
        >
          {pending === provider.id ? "Redirecting…" : provider.label}
        </Button>
      ))}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
