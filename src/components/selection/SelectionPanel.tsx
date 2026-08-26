"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HudFrame } from "@/components/ui/hud-frame";
import { formatUsd, PIXEL_PRICE } from "@/lib/moon/pricing";
import { findOverlappingPlot } from "@/lib/plots/overlap";
import { useMoonStore } from "@/lib/store/moon-store";
import { cn } from "@/lib/utils";

export function SelectionPanel() {
  const selection = useMoonStore((state) => state.selection);
  const selectionMode = useMoonStore((state) => state.selectionMode);
  const plots = useMoonStore((state) => state.plots);
  const exitSelectMode = useMoonStore((state) => state.exitSelectMode);

  if (!selectionMode || !selection) return null;

  const overlap = findOverlappingPlot(selection, plots.filter((plot) => plot.status === "active"));

  const rate = PIXEL_PRICE[selection.zone];
  const sizeLabel = `${selection.width} × ${selection.height}`;
  const latHemisphere = selection.centerLat >= 0 ? "N" : "S";
  const lngHemisphere = selection.centerLng >= 0 ? "E" : "W";

  return (
    <aside className="pointer-events-none absolute inset-x-3 bottom-[7.25rem] z-30 md:inset-auto md:top-24 md:right-4 md:bottom-auto md:w-[360px]">
      <HudFrame
        accent={overlap ? "danger" : selection.zone === "premium" ? "gold" : "silver"}
        opaque
        className="pointer-events-auto p-4"
      >
        <p className={cn("font-mono text-xs tracking-[0.16em] uppercase sm:text-[10px] sm:tracking-[0.28em]", overlap ? "text-red-300" : "text-lunar-silver")}>
          {overlap ? "Selection blocked" : "Area selection active"}
        </p>
        <dl className="mt-3 space-y-1.5 text-sm">
          <Row label="Pixels selected" value={selection.pixelCount.toLocaleString("en-US")} />
          <Row label="Size" value={sizeLabel} />
          <Row
            label="Zone"
            value={`${selection.featureName} · ${selection.zone === "premium" ? "Premium" : "Standard"}`}
            gold={selection.zone === "premium"}
          />
          <Row label="Rate" value={`${formatUsd(rate)} / pixel`} gold={selection.zone === "premium"} />
          <Row
            label="Center"
            value={`${Math.abs(selection.centerLat).toFixed(3)}° ${latHemisphere}   ${Math.abs(selection.centerLng).toFixed(3)}° ${lngHemisphere}`}
          />
        </dl>
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="font-mono text-[10px] tracking-[0.28em] text-lunar-silver uppercase">Total</span>
          <span className="font-heading text-xl font-semibold tracking-[0.06em] tabular-nums">
            {formatUsd(selection.price)}
          </span>
        </div>
        {overlap ? (
          <p className="mt-3 text-sm text-red-300">
            That rectangle overlaps {overlap.name ?? overlap.id}. You cannot select this.
          </p>
        ) : null}
        <div className="mt-4 flex gap-2">
          {overlap ? null : (
            <Button
              asChild
              size="lg"
              className="min-h-11 flex-1 cursor-pointer bg-electric-white font-heading text-xs tracking-[0.2em] text-space uppercase hover:bg-electric-white/90"
            >
              <Link href="/claim">Claim this plot</Link>
            </Button>
          )}
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="min-h-11 cursor-pointer border-white/15 font-heading text-xs tracking-[0.2em] uppercase"
            onClick={exitSelectMode}
          >
            Done
          </Button>
        </div>
      </HudFrame>
    </aside>
  );
}

function Row({
  label,
  value,
  gold = false,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="font-mono text-[11px] tracking-[0.12em] text-lunar-silver uppercase sm:text-[10px] sm:tracking-[0.22em]">{label}</dt>
      <dd className={gold ? "text-right text-sm text-gold sm:text-base" : "text-right text-sm sm:text-base"}>{value}</dd>
    </div>
  );
}
