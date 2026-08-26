import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { MODERATION_RULES } from "@/lib/moderation/rules";

export const metadata: Metadata = {
  title: "Content rules",
  description: "What is allowed on CraterClaim landings.",
};

export default function GuidelinesPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">Rules</p>
          <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">Landing rules.</h1>
          <p className="mt-4 leading-relaxed text-lunar-silver">
            CraterClaim is a public Moon of digital plots, not an ads network. Names, logos, and
            links stay up unless they break these rules.
          </p>
          <ul className="mt-8 space-y-3">
            {MODERATION_RULES.map((rule) => (
              <li key={rule} className="rounded-xl border border-white/10 bg-charcoal/70 px-4 py-3">
                {rule}
              </li>
            ))}
          </ul>
        </div>
        <Footer />
      </main>
    </>
  );
}
