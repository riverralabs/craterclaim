"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { OAUTH_PROVIDERS, oauthCallbackUrl, type OAuthProviderId } from "@/lib/auth/oauth";
import { withSignedIn } from "@/lib/auth/redirect";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.82-.07-1.64-.23-2.43H12v4.6h6.46a5.52 5.52 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.56-5.17 3.56-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.97-1.07 7.96-2.93l-3.87-3c-1.08.73-2.47 1.16-4.09 1.16-3.14 0-5.8-2.12-6.75-4.97H1.27v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.25 14.26A7.2 7.2 0 0 1 4.86 12c0-.79.14-1.55.39-2.26V6.65H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.35l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.96 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.27 6.65l3.98 3.09C6.2 6.87 8.86 4.75 12 4.75Z"
      />
    </svg>
  );
}

function XMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-electric-white" aria-hidden="true">
      <path d="M18.9 1.5h3.67l-8.01 9.16L24 22.5h-7.41l-5.8-7.58-6.64 7.58H.46l8.57-9.8L0 1.5h7.59l5.24 6.93L18.9 1.5Zm-1.29 18.88h2.03L6.48 3.5H4.3l13.31 16.88Z" />
    </svg>
  );
}

function loadGis(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>("script[data-gsi='true']");
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Google.")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.dataset.gsi = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google."));
    document.head.appendChild(script);
  });
}

export function OAuthButtons({ nextPath }: { nextPath: string }) {
  const configured = isSupabaseConfigured();
  const router = useRouter();
  const googleHost = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<OAuthProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gisReady, setGisReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    void loadGis()
      .then(() => {
        if (cancelled) return;
        setGisReady(true);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load Google.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!gisReady || !GOOGLE_CLIENT_ID || !googleHost.current || !window.google?.accounts?.id) return;
    const host = googleHost.current;
    host.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      ux_mode: "popup",
      auto_select: false,
      callback: async (response) => {
        setPending("google");
        setError(null);
        try {
          const supabase = createClient();
          const { error: tokenError } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
          });
          if (tokenError) {
            setError(tokenError.message);
            return;
          }
          const dest = nextPath.startsWith("/") ? nextPath : "/?select=1";
          router.replace(withSignedIn(dest, "google"));
          router.refresh();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Could not finish Google sign-in.");
        } finally {
          setPending(null);
        }
      },
    });
    window.google.accounts.id.renderButton(host, {
      type: "standard",
      theme: "filled_black",
      size: "large",
      text: "continue_with",
      shape: "pill",
      width: Math.min(400, host.clientWidth || 336),
      logo_alignment: "left",
    });
  }, [gisReady, nextPath, router]);

  if (!configured) {
    return (
      <p className="mt-6 max-w-md leading-relaxed text-lunar-silver">
        Connect Supabase, then enable Google and X in Auth providers.
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
          redirectTo: oauthCallbackUrl(nextPath),
          queryParams: provider === "google" ? { prompt: "select_account" } : undefined,
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
    <div className="space-y-3">
      {GOOGLE_CLIENT_ID ? (
        <div className="relative min-h-11 w-full overflow-hidden rounded-full">
          <div ref={googleHost} className="flex min-h-11 w-full justify-center [&>div]:w-full" />
          {pending === "google" ? (
            <p className="absolute inset-0 flex items-center justify-center bg-space/80 text-sm text-electric-white">
              Signing in…
            </p>
          ) : null}
        </div>
      ) : (
        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={Boolean(pending)}
          className="min-h-11 w-full cursor-pointer gap-2.5 border-white/15"
          onClick={() => void start("google")}
        >
          <GoogleMark />
          {pending === "google" ? "Redirecting…" : "Continue with Google"}
        </Button>
      )}
      {OAUTH_PROVIDERS.filter((provider) => provider.id !== "google").map((provider) => (
        <Button
          key={provider.id}
          type="button"
          size="lg"
          variant="outline"
          disabled={Boolean(pending)}
          className="min-h-11 w-full cursor-pointer gap-2.5 border-white/15"
          onClick={() => void start(provider.id)}
        >
          <XMark />
          {pending === provider.id ? "Redirecting…" : provider.label}
        </Button>
      ))}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
