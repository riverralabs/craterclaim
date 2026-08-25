"use client";

import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { HudFrame } from "@/components/ui/hud-frame";
import { formatUsd, PIXEL_PRICE, TOTAL_PIXELS } from "@/lib/moon/pricing";
import { useMoonStore } from "@/lib/store/moon-store";
import { cn } from "@/lib/utils";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function HomeHud() {
  const isExploring = useMoonStore((state) => state.isExploring);
  const selectionMode = useMoonStore((state) => state.selectionMode);
  const landingMode = useMoonStore((state) => state.landingMode);
  const plots = useMoonStore((state) => state.plots);
  const enterExploreMode = useMoonStore((state) => state.enterExploreMode);
  const enterSelectMode = useMoonStore((state) => state.enterSelectMode);
  const exitSelectMode = useMoonStore((state) => state.exitSelectMode);

  const landings = plots.filter((plot) => plot.status === "active");
  const claimedPixels = landings.reduce((sum, plot) => sum + plot.pixelCount, 0);
  const available = TOTAL_PIXELS - claimedPixels;

  if (landingMode !== "idle") return null;

  if (isExploring) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <div className="bg-gradient-to-t from-space/90 to-transparent pt-16 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-center font-mono text-[10px] tracking-[0.28em] text-lunar-silver uppercase sm:text-left">
              {selectionMode
                ? "Drag a rectangle · snaps to 10×10"
                : "Drag to rotate · Scroll or pinch to zoom"}
            </p>
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-2">
              <LegendChip tone="standard" label={`Standard ${formatUsd(PIXEL_PRICE.standard)}/px`} />
              <LegendChip tone="premium" label={`Premium ${formatUsd(PIXEL_PRICE.premium)}/px`} />
              {selectionMode ? (
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="min-h-11 cursor-pointer border-white/15 bg-charcoal/50 px-4 font-heading text-xs tracking-[0.2em] text-electric-white uppercase hover:bg-white/10"
                  onClick={exitSelectMode}
                >
                  Rotate Moon
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  className="min-h-11 cursor-pointer bg-gradient-to-r from-violet to-[#9b6dff] px-4 font-heading text-xs tracking-[0.2em] text-electric-white uppercase hover:from-violet hover:to-violet"
                  onClick={enterSelectMode}
                >
                  Select a plot
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute bottom-0 left-0 max-w-lg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-8 sm:left-6 sm:px-0">
        <p className="font-mono text-[10px] tracking-[0.34em] text-violet uppercase">CraterClaim</p>
        <h1 className="font-heading mt-2 text-[clamp(1.7rem,5vw,3.4rem)] leading-[0.95] font-bold tracking-[0.04em] text-electric-white uppercase">
          Claim your place on the Moon
        </h1>
        <p className="mt-3 hidden max-w-sm text-sm leading-relaxed text-lunar-silver sm:block">
          Digital lunar plots on a public Moon map. Not physical land, and not advertising.
        </p>
        <div className="pointer-events-auto mt-4 flex gap-2 sm:hidden">
          <Button
            type="button"
            size="lg"
            className="min-h-11 flex-1 cursor-pointer bg-gradient-to-r from-violet to-[#9b6dff] font-heading text-xs tracking-[0.2em] uppercase"
            onClick={enterExploreMode}
          >
            Explore
          </Button>
          <Link
            href="/claim"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "min-h-11 flex-1 cursor-pointer border-white/15 font-heading text-xs tracking-[0.2em] uppercase",
            )}
          >
            Claim
          </Link>
        </div>
      </div>

      <aside className="pointer-events-auto absolute top-24 right-4 hidden w-[320px] md:block">
        <HudFrame className="p-5">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-violet shadow-[0_0_10px_rgba(124,125,255,1)]" />
            <p className="font-mono text-[10px] tracking-[0.32em] text-violet uppercase">Live map</p>
          </div>
          <p className="font-heading mt-3 text-lg font-bold tracking-[0.18em] uppercase">
            Claim a landing
          </p>
          <p className="mt-1 text-xs leading-relaxed text-lunar-silver">
            Put your name, startup, or community on a permanent public Moon.
          </p>

          <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
            <HudStat label="Total plots" value={formatCount(TOTAL_PIXELS)} />
            <HudStat label="Claimed" value={formatCount(claimedPixels)} />
            <HudStat label="Available" value={formatCount(available)} />
            <HudStat label="Landings" value={formatCount(landings.length)} />
          </div>

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <p className="font-mono text-[10px] tracking-[0.28em] text-lunar-silver uppercase">Legend</p>
            <LegendChip tone="premium" label={`Premium ${formatUsd(PIXEL_PRICE.premium)}/px`} />
            <LegendChip tone="standard" label={`Standard ${formatUsd(PIXEL_PRICE.standard)}/px`} />
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Button
              type="button"
              size="lg"
              className="min-h-11 w-full cursor-pointer bg-gradient-to-r from-violet to-[#9b6dff] font-heading text-xs tracking-[0.24em] text-electric-white uppercase hover:from-violet hover:to-violet"
              onClick={enterExploreMode}
            >
              Explore the Moon
            </Button>
            <Link
              href="/claim"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "min-h-11 w-full cursor-pointer border-white/15 font-heading text-xs tracking-[0.24em] uppercase",
              )}
            >
              Claim your plot
            </Link>
          </div>
        </HudFrame>
      </aside>
    </div>
  );
}

function HudStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="font-mono text-[10px] tracking-[0.28em] text-lunar-silver uppercase">{label}</span>
      <span className="font-heading text-sm tracking-[0.08em] text-electric-white tabular-nums">{value}</span>
    </div>
  );
}

function LegendChip({ tone, label }: { tone: "premium" | "standard"; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center gap-2 border px-3 font-mono text-[10px] tracking-[0.18em] uppercase",
        tone === "premium"
          ? "border-gold/40 bg-gold/10 text-gold shadow-[0_0_16px_rgba(224,184,79,0.22)]"
          : "border-violet/35 bg-violet/10 text-violet",
      )}
    >
      <span
        className={cn("size-2", tone === "premium" ? "bg-gold" : "bg-violet")}
      />
      {label}
    </span>
  );
}
