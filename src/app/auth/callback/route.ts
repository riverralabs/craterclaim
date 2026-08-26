import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { EmailOtpType } from "@supabase/supabase-js";

function safeNext(path: string | null) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

function requestOrigin(request: NextRequest) {
  const env = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  if (process.env.NODE_ENV === "production" && env) return env;
  const { origin } = new URL(request.url);
  if (/localhost|127\.0\.0\.1/i.test(origin) && env && !/localhost|127\.0\.0\.1/i.test(env)) {
    return env;
  }
  return origin;
}

export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const { searchParams } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));
  const login = new URL("/login", origin);
  login.searchParams.set("next", next);

  if (!isSupabaseConfigured()) {
    login.searchParams.set("error", "Supabase is not connected yet.");
    return NextResponse.redirect(login);
  }

  const supabase = await createClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      login.searchParams.set("error", error.message);
      return NextResponse.redirect(login);
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      login.searchParams.set("error", error.message);
      return NextResponse.redirect(login);
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  login.searchParams.set("error", "This sign-in link is missing or expired.");
  return NextResponse.redirect(login);
}
