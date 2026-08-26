"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

export function AuthMenu({ compact = false }: { compact?: boolean }) {
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(!configured);

  useEffect(() => {
    if (!configured) return;
    let cancelled = false;

    void import("@/lib/supabase/client").then(async ({ createClient }) => {
      const supabase = createClient();
      const { data } = await supabase.auth.getClaims();
      if (cancelled) return;
      const claims = data?.claims as { email?: string } | undefined;
      setEmail(claims?.email ?? null);
      setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [configured]);

  if (!configured || !ready) return null;

  if (email) {
    if (compact) {
      return (
        <>
          <Link href="/account" className="flex min-h-11 items-center px-2 text-base text-electric-white">
            Account
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex min-h-11 w-full cursor-pointer items-center px-2 text-left text-sm text-lunar-silver"
            >
              Sign out
            </button>
          </form>
        </>
      );
    }

    return (
      <div className="hidden items-center gap-2 sm:flex">
        <Link
          href="/account"
          className="max-w-40 truncate font-mono text-[10px] tracking-[0.16em] text-lunar-silver uppercase"
        >
          {email}
        </Link>
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="min-h-11 cursor-pointer text-lunar-silver hover:text-electric-white"
          >
            Sign out
          </Button>
        </form>
      </div>
    );
  }

  if (compact) {
    return (
      <Link href="/login?next=%2F%3Fselect%3D1" className="flex min-h-11 items-center px-2 text-base text-electric-white">
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/login?next=%2F%3Fselect%3D1"
      className={cn(
        buttonVariants({ variant: "outline", size: "lg" }),
        "hidden min-h-11 cursor-pointer border-white/15 sm:inline-flex",
      )}
    >
      Sign in
    </Link>
  );
}
