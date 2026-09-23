"use client";

import { useState } from "react";
import { requestLandingLinks } from "@/lib/plots/guest-actions";

export function FindLandingForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await requestLandingLinks(email);
    setPending(false);
    setMessage(result.message);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-lg">
      <label className="block text-sm">
        Checkout email
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-space/60 px-3 py-2.5 text-sm outline-none focus-visible:border-violet/60"
          placeholder="you@example.com"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-electric-white px-5 text-sm text-space disabled:opacity-60"
      >
        {pending ? "Sending…" : "Email my links"}
      </button>
      {message ? <p className="mt-4 text-sm text-lunar-silver">{message}</p> : null}
    </form>
  );
}
