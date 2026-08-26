"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAdmin } from "@/lib/admin/auth-actions";
import { Button } from "@/components/ui/button";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-space/60 px-3 py-2.5 text-sm text-electric-white outline-none placeholder:text-lunar-silver/60 focus-visible:border-violet/60";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await signInAdmin(email, password);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-md space-y-4">
      <label className="block text-sm">
        Admin email
        <input
          required
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="block text-sm">
        Password
        <input
          required
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClass}
        />
      </label>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="min-h-11 cursor-pointer bg-electric-white px-5 text-space hover:bg-electric-white/90"
      >
        {pending ? "Signing in…" : "Sign in to admin"}
      </Button>
    </form>
  );
}
