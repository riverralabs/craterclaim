"use client";

import { useState } from "react";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { signInWithEmail, signUpWithEmail } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-space/60 px-3 py-2.5 text-sm text-electric-white outline-none placeholder:text-lunar-silver/60 focus-visible:border-violet/60";

export function LoginForm({ nextPath, error }: { nextPath: string; error?: string }) {
  const configured = isSupabaseConfigured();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState(error ?? null);
  const [confirmSent, setConfirmSent] = useState(false);

  if (!configured) {
    return (
      <p className="mt-6 max-w-md leading-relaxed text-lunar-silver">
        Connect Supabase, then enable email, Google, and X sign-in.
      </p>
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    const result =
      mode === "signup"
        ? await signUpWithEmail(email, password, nextPath)
        : await signInWithEmail(email, password, nextPath);
    setPending(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    if (result.needsConfirm) setConfirmSent(true);
  }

  if (confirmSent) {
    return (
      <p className="mt-6 max-w-md leading-relaxed text-lunar-silver">
        Check <span className="text-electric-white">{email}</span> and open the confirmation
        link. Then sign in.
      </p>
    );
  }

  return (
    <div className="mt-6 max-w-md">
      {formError ? <p className="mb-4 text-sm text-red-300">{formError}</p> : null}
      <OAuthButtons nextPath={nextPath} />
      <p className="my-5 text-center font-mono text-[10px] tracking-[0.28em] text-lunar-silver uppercase">
        or email
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          Email
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClass}
            placeholder="you@studio.com"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            required
            type="password"
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClass}
            placeholder="At least 8 characters"
          />
        </label>
        <Button
          type="submit"
          size="lg"
          disabled={pending}
          className="min-h-11 w-full cursor-pointer bg-electric-white px-5 text-space hover:bg-electric-white/90"
        >
          {pending ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>
      <button
        type="button"
        className="mt-4 min-h-11 cursor-pointer text-sm text-lunar-silver hover:text-electric-white"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setFormError(null);
        }}
      >
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
