import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { formatUsd, PIXEL_PRICE } from "@/lib/moon/pricing";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Claim a digital lunar plot on CraterClaim. Two zones only: Standard and Premium.",
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-dvh bg-space pt-24">
      <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">
          How it works
        </p>
        <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Claim your place on the Moon.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-lunar-silver sm:text-lg">
          CraterClaim is a public map of digital lunar plots. You are not buying physical
          land, ads, traffic, or rankings. You are leaving a named place on a permanent
          Moon.
        </p>

        <ol className="mt-10 space-y-6">
          <Step
            n="01"
            title="Explore"
            body="The Moon idles slowly until you touch it. Drag to rotate. Pinch or scroll to zoom. Idle rotation never resumes after that first interaction."
          />
          <Step
            n="02"
            title="Choose a plot"
            body="Enter Select a plot, drag a rectangle, and snap to 10×10. Standard is $0.50/px. Premium regions glow gold at $1.00/px."
          />
          <Step
            n="03"
            title="Claim a landing"
            body="Name the plot, add a story, website, and logo, then complete checkout. The public plot page is the shareable destination — a landing, not an ad unit."
          />
        </ol>

        <section className="mt-12 rounded-2xl border border-white/10 bg-charcoal/70 p-5">
          <h2 className="font-heading text-xl font-semibold">Two zones only</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-sm text-lunar-silver">Standard</p>
              <p className="mt-1 text-2xl font-semibold">{formatUsd(PIXEL_PRICE.standard)}/px</p>
              <p className="mt-2 text-sm text-lunar-silver">
                10×10 entry {formatUsd(PIXEL_PRICE.standard * 100)}
              </p>
            </div>
            <div className="rounded-xl border border-gold/40 p-4 shadow-[0_0_24px_rgba(224,184,79,0.18)]">
              <p className="text-sm text-gold">Premium</p>
              <p className="mt-1 text-2xl font-semibold text-gold">
                {formatUsd(PIXEL_PRICE.premium)}/px
              </p>
              <p className="mt-2 text-sm text-lunar-silver">
                10×10 entry {formatUsd(PIXEL_PRICE.premium * 100)} · golden glow on the map
              </p>
            </div>
          </div>
        </section>

        <Button
          asChild
          size="lg"
          className="mt-8 min-h-11 cursor-pointer bg-electric-white text-space hover:bg-electric-white/90"
        >
          <Link href="/">Back to the Moon</Link>
        </Button>
      </div>
      <Footer />
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="grid grid-cols-[auto_1fr] gap-4">
      <span className="font-heading text-sm tracking-widest text-violet">{n}</span>
      <div>
        <h2 className="font-heading text-xl font-semibold">{title}</h2>
        <p className="mt-1 leading-relaxed text-lunar-silver">{body}</p>
      </div>
    </li>
  );
}
