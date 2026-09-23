import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { formatUsd, MIN_PLOT_PIXELS, PIXEL_PRICE } from "@/lib/moon/pricing";
import { firstLanding } from "@/lib/plots/first-landing";
import { listPublicPlots } from "@/lib/plots/inventory";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Claim a digital lunar plot on CraterClaim. Two zones only: Standard and Premium.",
};

export default async function HowItWorksPage() {
  const featured = firstLanding(await listPublicPlots());

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

        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold">Product tour</h2>
          <p className="mt-2 text-sm leading-relaxed text-lunar-silver">
            Watch the loop: explore, select a plot, and claim a landing.
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-charcoal">
            <video
              className="aspect-video w-full bg-space"
              controls
              playsInline
              preload="metadata"
              aria-label="CraterClaim product tour"
            >
              <source src="/media/craterclaim-product-tour.webm" type="video/webm" />
              <source src="/media/craterclaim-product-tour.mp4" type="video/mp4" />
            </video>
          </div>
        </section>

        {featured ? (
          <section className="mt-10 rounded-2xl border border-gold/30 bg-charcoal/70 p-5">
            <p className="font-mono text-[10px] tracking-[0.28em] text-gold uppercase">
              First landing
            </p>
            <h2 className="font-heading mt-2 text-2xl font-semibold">
              {featured.name ?? featured.id}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-lunar-silver">
              {featured.id} · {featured.width}×{featured.height} · {featured.lunarFeature}.
              Digital plot only — not physical land.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="min-h-11 cursor-pointer bg-electric-white text-space hover:bg-electric-white/90"
              >
                <Link href={`/plot/${featured.id}`}>View the deed</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-11 cursor-pointer border-white/15"
              >
                <Link href={`/?focus=${featured.id}`}>See it on the Moon</Link>
              </Button>
            </div>
          </section>
        ) : null}

        <ol className="mt-10 space-y-6">
          <Step
            n="01"
            title="Explore"
            body="The Moon keeps a slow idle spin until you press Select a plot. Drag to look around. Pinch or scroll to zoom. Rotate Moon resumes the spin after you leave selection."
          />
          <Step
            n="02"
            title="Choose a plot"
            body="Enter Select a plot, drag a rectangle, and snap to 10×10. Standard is $0.50/px. Premium regions glow gold at $1.00/px."
          />
          <Step
            n="03"
            title="Claim a landing"
            body="Name the plot, add a website and logo, then complete checkout. The public plot page is the shareable destination — a landing, not an ad unit."
          />
        </ol>

        <section className="mt-12 rounded-2xl border border-white/10 bg-charcoal/70 p-5">
          <h2 className="font-heading text-xl font-semibold">Two zones only</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-sm text-lunar-silver">Standard</p>
              <p className="mt-1 text-2xl font-semibold">{formatUsd(PIXEL_PRICE.standard)}/px</p>
              <p className="mt-2 text-sm text-lunar-silver">
                10×10 entry {formatUsd(PIXEL_PRICE.standard * MIN_PLOT_PIXELS)}
              </p>
            </div>
            <div className="rounded-xl border border-gold/40 p-4 shadow-[0_0_24px_rgba(224,184,79,0.18)]">
              <p className="text-sm text-gold">Premium</p>
              <p className="mt-1 text-2xl font-semibold text-gold">
                {formatUsd(PIXEL_PRICE.premium)}/px
              </p>
              <p className="mt-2 text-sm text-lunar-silver">
                10×10 entry {formatUsd(PIXEL_PRICE.premium * MIN_PLOT_PIXELS)} · golden glow on the map
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
