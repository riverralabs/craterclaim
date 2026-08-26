"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthActionResult = { ok: true } | { ok: false; error: string };

const SELECT_HOME = "/?select=1";

function safeNext(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return SELECT_HOME;
  return path;
}

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function alreadyRegistered(message: string) {
  return /already|registered|exists/i.test(message);
}

function emailNotConfirmed(message: string) {
  return /not confirmed|confirm your email/i.test(message);
}

async function confirmEmail(email: string) {
  const admin = createAdminClient();
  if (!admin) return;
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return;
    const user = data.users.find((row) => row.email?.toLowerCase() === email);
    if (user) {
      if (!user.email_confirmed_at) {
        await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
      }
      return;
    }
    if (data.users.length < 200) return;
  }
}

async function signInSession(email: string, password: string) {
  const supabase = await createClient();
  const first = await supabase.auth.signInWithPassword({ email, password });
  if (!first.error) return { ok: true as const };
  if (!emailNotConfirmed(first.error.message)) {
    return { ok: false as const, error: first.error.message };
  }
  await confirmEmail(email);
  const retry = await supabase.auth.signInWithPassword({ email, password });
  if (retry.error) return { ok: false as const, error: retry.error.message };
  return { ok: true as const };
}

export async function signInWithEmail(
  email: string,
  password: string,
  nextPath = SELECT_HOME,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not connected yet." };
  const trimmed = email.trim().toLowerCase();
  if (!validEmail(trimmed)) return { ok: false, error: "Enter a valid email." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const signedIn = await signInSession(trimmed, password);
  if (!signedIn.ok) return signedIn;
  redirect(safeNext(nextPath));
}

export async function signUpWithEmail(
  email: string,
  password: string,
  nextPath = SELECT_HOME,
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase is not connected yet." };
  const trimmed = email.trim().toLowerCase();
  if (!validEmail(trimmed)) return { ok: false, error: "Enter a valid email." };
  if (password.length < 8) return { ok: false, error: "Password must be at least 8 characters." };

  const admin = createAdminClient();
  if (admin) {
    const created = await admin.auth.admin.createUser({
      email: trimmed,
      password,
      email_confirm: true,
    });
    if (created.error && !alreadyRegistered(created.error.message)) {
      return { ok: false, error: created.error.message };
    }
  } else {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email: trimmed, password });
    if (error && !alreadyRegistered(error.message)) return { ok: false, error: error.message };
    if (data.user && !data.session) await confirmEmail(trimmed);
  }

  const signedIn = await signInSession(trimmed, password);
  if (!signedIn.ok) return signedIn;
  redirect(safeNext(nextPath));
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
