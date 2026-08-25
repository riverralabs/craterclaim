"use client";

import { useState } from "react";
import { requestMagicLink } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-space/60 px-3 py-2.5 text-sm text-electric-white outline-none placeholder:text-lunar-silver/60 focus-visible:border-violet/60";

export function LoginForm({ nextPath, error }: { nextPath: string; error?: string }) {
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState(error ?? null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    const result = await requestMagicLink(email, nextPath);
    setPending(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setSent(true);
  }

  if (!configured) {
    return (
      <p className="mt-6 max-w-md leading-relaxed text-lunar-silver">
        Add <code className="text-electric-white">NEXT_PUBLIC_SUPABASE_URL</code> and a
        publishable or anon key to enable accounts. Mock claims still work without them.
      </p>
    );
  }

  if (sent) {
    return (
      <p className="mt-6 max-w-md leading-relaxed text-lunar-silver">
        Check <span className="text-electric-white">{email}</span> for a CraterClaim sign-in
        link. It expires quickly — open it on this device.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-4">
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
      {formError ? <p className="text-sm text-red-300">{formError}</p> : null}
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="min-h-11 cursor-pointer bg-electric-white px-5 text-space hover:bg-electric-white/90"
      >
        {pending ? "Sending…" : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
