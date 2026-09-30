"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HudFrame } from "@/components/ui/hud-frame";
import { formatUsd, PIXEL_PRICE, TOTAL_PIXELS } from "@/lib/moon/pricing";
import { useClaimSelect } from "@/hooks/useClaimSelect";
import { useMoonStore } from "@/lib/store/moon-store";
import { getWorld } from "@/lib/worlds";
import { cn } from "@/lib/utils";
import type { PlotRecord } from "@/types";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function HomeHud({
  featured,
  initialPlots,
}: {
  featured: PlotRecord | null;
  initialPlots: PlotRecord[];
}) {
  const isExploring = useMoonStore((state) => state.isExploring);
  const selectionMode = useMoonStore((state) => state.selectionMode);
  const landingMode = useMoonStore((state) => state.landingMode);
  const storePlots = useMoonStore((state) => state.plots);
  const plots = storePlots.length > 0 ? storePlots : initialPlots;
  const enterExploreMode = useMoonStore((state) => state.enterExploreMode);
  const enterSelectMode = useMoonStore((state) => state.enterSelectMode);
  const exitSelectMode = useMoonStore((state) => state.exitSelectMode);
  const resetView = useMoonStore((state) => state.resetView);
  const startLanding = useMoonStore((state) => state.startLanding);
  const enterSelect = useClaimSelect();
  const world = getWorld(useMoonStore((state) => state.body));
  const first = featured ?? plots.find((plot) => plot.status === "active") ?? null;

  const landings = plots.filter((plot) => plot.status === "active");
  const claimedPixels = landings.reduce((sum, plot) => sum + plot.pixelCount, 0);
  const available = TOTAL_PIXELS - claimedPixels;

  if (landingMode !== "idle") return null;

  if (isExploring) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
        <div className="bg-gradient-to-t from-space/90 to-transparent pt-16 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-center text-xs font-medium tracking-[0.12em] text-lunar-silver uppercase sm:text-left sm:font-mono sm:text-[10px] sm:tracking-[0.28em]">
              {world.name}
              {" · "}
              {selectionMode
                ? "Drag a rectangle · snaps to 10×10"
                : "Drag to rotate · pinch to zoom"}
            </p>
            <div className="pointer-events-auto flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="flex items-center justify-center gap-2">
                <LegendChip tone="standard" label={`Standard ${formatUsd(PIXEL_PRICE.standard)}/px`} />
                <LegendChip tone="premium" label={`Premium ${formatUsd(PIXEL_PRICE.premium)}/px`} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {selectionMode ? (
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="min-h-11 cursor-pointer border-white/20 bg-charcoal px-4 text-sm font-semibold tracking-wide text-electric-white uppercase hover:bg-white/10 sm:font-heading sm:text-xs sm:tracking-[0.2em]"
                  onClick={exitSelectMode}
                >
                  {world.rotateLabel}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  className="min-h-11 cursor-pointer bg-electric-white px-4 text-sm font-semibold tracking-wide text-space uppercase hover:bg-electric-white/90 sm:font-heading sm:text-xs sm:tracking-[0.2em]"
                  onClick={enterSelectMode}
                >
                  Select a plot
                </Button>
              )}
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="min-h-11 cursor-pointer border-white/20 bg-charcoal px-4 text-sm font-semibold tracking-wide text-electric-white uppercase hover:bg-white/10 sm:font-heading sm:text-xs sm:tracking-[0.2em]"
                onClick={resetView}
              >
                Reset view
              </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute bottom-0 left-0 max-w-lg px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-8 sm:left-6 sm:px-0">
        <p className="font-mono text-[10px] tracking-[0.34em] text-lunar-silver uppercase">CraterClaim</p>
        <h1 className="font-heading mt-2 text-[clamp(1.85rem,7vw,3.4rem)] leading-[0.95] font-bold tracking-[0.03em] text-electric-white uppercase">
          {world.title}
        </h1>
        <p className="mt-3 hidden max-w-sm text-sm leading-relaxed text-lunar-silver sm:block">
          {world.subtitle}
        </p>
        <div className="pointer-events-auto mt-4 flex gap-2 sm:hidden">
          <Button
            type="button"
            size="lg"
            className="min-h-11 flex-1 cursor-pointer bg-electric-white text-sm font-semibold tracking-wide text-space uppercase hover:bg-electric-white/90"
            onClick={enterExploreMode}
          >
            Explore
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="min-h-11 flex-1 cursor-pointer border-white/15 text-sm font-semibold tracking-wide uppercase"
            onClick={enterSelect}
          >
            Claim
          </Button>
        </div>
        {first ? (
          <Link
            href={`/plot/${first.id}`}
            className="pointer-events-auto mt-3 inline-flex min-h-11 items-center text-xs tracking-[0.12em] text-gold uppercase sm:hidden"
          >
            First landing · {first.name ?? first.id}
          </Link>
        ) : null}
      </div>

      <aside className="pointer-events-auto absolute top-24 right-4 hidden w-[320px] md:block">
        <HudFrame opaque className="p-5">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-gold shadow-[0_0_10px_rgba(224,184,79,0.9)]" />
            <p className="font-mono text-[10px] tracking-[0.32em] text-gold uppercase">Live map</p>
          </div>
          <p className="font-heading mt-3 text-lg font-bold tracking-[0.18em] uppercase">
            Claim a landing
          </p>
          <p className="mt-1 text-xs leading-relaxed text-lunar-silver">
            Put your name, startup, or community on a permanent public Moon.
          </p>

          <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
            <HudStat label="Total pixels" value={formatCount(TOTAL_PIXELS)} />
            <HudStat label="Claimed" value={formatCount(claimedPixels)} />
            <HudStat label="Available" value={formatCount(available)} />
            <HudStat label="Landings" value={formatCount(landings.length)} />
          </div>

          {first ? (
            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              <p className="font-mono text-[10px] tracking-[0.28em] text-gold uppercase">First landing</p>
              <p className="font-heading text-sm font-semibold tracking-[0.08em] text-electric-white">
                {first.name ?? first.id}
              </p>
              <p className="font-mono text-[10px] tracking-[0.16em] text-lunar-silver uppercase">
                {first.id} · {first.lunarFeature}
              </p>
              <div className="flex gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="min-h-11 flex-1 cursor-pointer border-white/15 text-[10px] tracking-[0.16em] uppercase"
                >
                  <Link href={`/plot/${first.id}`}>View deed</Link>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-11 flex-1 cursor-pointer border-white/15 text-[10px] tracking-[0.16em] uppercase"
                  onClick={() => startLanding(first.id, false)}
                >
                  {world.seeOnLabel}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            <p className="font-mono text-[10px] tracking-[0.28em] text-lunar-silver uppercase">Legend</p>
            <LegendChip tone="premium" label={`Premium ${formatUsd(PIXEL_PRICE.premium)}/px`} />
            <LegendChip tone="standard" label={`Standard ${formatUsd(PIXEL_PRICE.standard)}/px`} />
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <Button
              type="button"
              size="lg"
              className="min-h-11 w-full cursor-pointer bg-electric-white font-heading text-xs tracking-[0.24em] text-space uppercase hover:bg-electric-white/90"
              onClick={enterExploreMode}
            >
              {world.exploreLabel}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="min-h-11 w-full cursor-pointer border-white/15 font-heading text-xs tracking-[0.24em] uppercase"
              onClick={enterSelect}
            >
              Claim your plot
            </Button>
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
        "inline-flex min-h-8 items-center gap-2 border px-3 font-mono text-[11px] tracking-[0.1em] uppercase sm:text-[10px] sm:tracking-[0.18em]",
        tone === "premium"
          ? "border-gold/40 bg-gold/10 text-gold shadow-[0_0_16px_rgba(224,184,79,0.22)]"
          : "border-white/18 bg-white/5 text-lunar-silver",
      )}
    >
      <span
        className={cn("size-2", tone === "premium" ? "bg-gold" : "bg-lunar-silver")}
      />
      {label}
    </span>
  );
}
