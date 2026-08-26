import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ClaimForm } from "@/components/claim/ClaimForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { getAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Claim a plot",
  description: "Name your digital lunar plot and pay with Lemon Squeezy.",
};

export default async function ClaimPage() {
  const configured = isSupabaseConfigured();
  const user = await getAuthUser();
  const needsSignIn = configured && !user;

  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
          {needsSignIn ? (
            <div>
              <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">Claim</p>
              <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">
                Sign in to claim this plot.
              </h1>
              <p className="mt-4 max-w-lg leading-relaxed text-lunar-silver">
                Explore is public. Sign in with Google, X, or email so this claim stays yours
                after payment. Digital plots only — not physical land, not ads.
              </p>
              <LoginForm nextPath="/claim" />
            </div>
          ) : (
            <ClaimForm />
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
