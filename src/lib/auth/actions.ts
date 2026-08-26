"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthActionResult =
  | { ok: true; needsConfirm?: boolean }
  | { ok: false; error: string };

function safeNext(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function authOrigin() {
  const headerStore = await headers();
  const env = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const forwarded = headerStore.get("x-forwarded-host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  if (forwarded && !/localhost|127\.0\.0\.1/i.test(forwarded)) {
    return `${proto}://${forwarded}`;
  }
  const origin = headerStore.get("origin") ?? "";
  if (origin && !/localhost|127\.0\.0\.1/i.test(origin)) return origin;
  if (env && !/localhost|127\.0\.0\.1/i.test(env)) return env;
  return origin || env || "http://localhost:3000";
}

export async function signInWithEmail(
  email: string,
  password: string,
  nextPath = "/claim",
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not connected yet." };
  const trimmed = email.trim().toLowerCase();
  if (!validEmail(trimmed)) return { ok: false, error: "Enter a valid email." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: trimmed, password });
  if (error) return { ok: false, error: error.message };
  redirect(safeNext(nextPath));
}

export async function signUpWithEmail(
  email: string,
  password: string,
  nextPath = "/claim",
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not connected yet." };
  const trimmed = email.trim().toLowerCase();
  if (!validEmail(trimmed)) return { ok: false, error: "Enter a valid email." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: trimmed,
    password,
    options: {
      emailRedirectTo: `${await authOrigin()}/auth/callback?next=${encodeURIComponent(safeNext(nextPath))}`,
    },
  });
  if (error) return { ok: false, error: error.message };
  if (!data.session) return { ok: true, needsConfirm: true };
  redirect(safeNext(nextPath));
}

export async function signOut(nextPath = "/") {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect(safeNext(nextPath));
}
