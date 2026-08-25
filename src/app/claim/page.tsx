import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ClaimForm } from "@/components/claim/ClaimForm";
import { getAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Claim a plot",
  description: "Name your digital lunar plot and complete a mocked checkout.",
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
                Reservations are held for 15 minutes and attached to your account. Digital
                plots only — not physical land, not ads.
              </p>
              <Link
                href="/login?next=/claim"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-8 inline-flex min-h-11 cursor-pointer bg-electric-white px-5 text-space hover:bg-electric-white/90",
                )}
              >
                Sign in
              </Link>
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
