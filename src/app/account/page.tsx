import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { signOut } from "@/lib/auth/actions";
import { getAuthUser } from "@/lib/auth/session";
import { listActivePlots } from "@/lib/plots/inventory";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/moon/pricing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account",
  description: "Your CraterClaim landings.",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const configured = isSupabaseConfigured();
  const user = await getAuthUser();

  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">Account</p>
          <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">Your landings.</h1>

          {!configured ? (
            <p className="mt-4 max-w-lg leading-relaxed text-lunar-silver">
              Connect Supabase to attach claims to an email account. Until then, mock claims
              still land on the public Moon.
            </p>
          ) : !user ? (
            <div className="mt-6">
              <p className="max-w-lg leading-relaxed text-lunar-silver">
                Sign in to see plots reserved or claimed on this account.
              </p>
              <Link
                href="/login?next=/account"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-6 inline-flex min-h-11 cursor-pointer bg-electric-white px-5 text-space hover:bg-electric-white/90",
                )}
              >
                Sign in
              </Link>
            </div>
          ) : (
            <AccountBody email={user.email} ownerId={user.id} />
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}

async function AccountBody({ email, ownerId }: { email: string | null; ownerId: string }) {
  const plots = (await listActivePlots()).filter((plot) => plot.ownerId === ownerId);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-mono text-sm tracking-[0.08em] text-lunar-silver">{email}</p>
        <form action={signOut}>
          <Button
            type="submit"
            variant="outline"
            size="lg"
            className="min-h-11 cursor-pointer border-white/15"
          >
            Sign out
          </Button>
        </form>
      </div>

      {plots.length === 0 ? (
        <p className="mt-8 text-lunar-silver">No landings on this account yet.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {plots.map((plot) => (
            <li key={plot.id}>
              <Link
                href={`/plot/${plot.id}`}
                className="flex min-h-11 items-center justify-between gap-4 rounded-xl border border-white/10 bg-charcoal/70 px-4 py-3 hover:border-white/20"
              >
                <span>
                  <span className="block font-heading tracking-[0.08em] uppercase">
                    {plot.name ?? plot.id}
                  </span>
                  <span className="text-xs text-lunar-silver">
                    {plot.id} · {plot.width}×{plot.height} · {plot.lunarFeature}
                  </span>
                </span>
                <span className="text-sm tabular-nums text-gold">
                  {plot.pricePaid != null ? formatUsd(plot.pricePaid) : "—"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
