"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthActionResult = { ok: true } | { ok: false; error: string };

function safeNext(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

export async function requestMagicLink(
  email: string,
  nextPath = "/claim",
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not connected yet." };
  }

  const trimmed = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: "Enter a valid email." };
  }

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safeNext(nextPath))}`,
    },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(nextPath = "/") {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect(safeNext(nextPath));
}
