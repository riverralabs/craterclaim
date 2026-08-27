"use client";

import { useEffect, useRef, useState } from "react";
import { HudFrame } from "@/components/ui/hud-frame";
import { useMoonStore } from "@/lib/store/moon-store";
import { cn } from "@/lib/utils";

const OFFSET = 18;
const EDGE = 12;

export const plotHoverPointer = { x: 0, y: 0 };

export function PlotHoverCard() {
  const hoverPlotId = useMoonStore((state) => state.hoverPlotId);
  const landingPlotId = useMoonStore((state) => state.landingPlotId);
  const landingMode = useMoonStore((state) => state.landingMode);
  const selectionMode = useMoonStore((state) => state.selectionMode);
  const plots = useMoonStore((state) => state.plots);
  const plot = plots.find((item) => item.id === hoverPlotId && item.status === "active") ?? null;
  const cardRef = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState(() => ({ x: plotHoverPointer.x, y: plotHoverPointer.y }));

  const hidden =
    !plot ||
    selectionMode ||
    landingMode === "confirmed" ||
    landingMode === "flying" ||
    (landingMode === "arrived" && landingPlotId === plot.id);

  useEffect(() => {
    if (hidden) return;
    setPoint({ x: plotHoverPointer.x, y: plotHoverPointer.y });

    const onMove = (event: PointerEvent) => {
      setPoint({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [hidden, plot]);

  if (hidden || !plot) return null;

  const card = cardRef.current;
  const width = card?.offsetWidth ?? 220;
  const height = card?.offsetHeight ?? 112;
  const left =
    point.x + OFFSET + width > window.innerWidth - EDGE
      ? Math.max(EDGE, point.x - width - OFFSET)
      : point.x + OFFSET;
  const top =
    point.y + OFFSET + height > window.innerHeight - EDGE
      ? Math.max(EDGE, point.y - height - OFFSET)
      : point.y + OFFSET;

  const premium = plot.zone === "premium";
  const pixels = plot.pixelCount.toLocaleString("en-US");

  return (
    <div
      ref={cardRef}
      role="tooltip"
      className="pointer-events-none fixed z-[28] [@media(hover:none)]:hidden [@media(pointer:coarse)]:hidden"
      style={{ left, top }}
    >
      <HudFrame accent={premium ? "gold" : "silver"} opaque className="min-w-[13.5rem] max-w-[16.5rem] px-3.5 py-3">
        <p className="font-mono text-[10px] tracking-[0.28em] text-lunar-silver uppercase">Claimed</p>
        <div className="mt-1.5 flex items-center gap-2.5">
          {plot.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={plot.logoUrl} alt="" className="size-8 shrink-0 object-contain" />
          ) : (
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center font-heading text-sm font-bold",
                premium ? "text-gold" : "text-lunar-silver",
              )}
            >
              {(plot.name ?? plot.id).slice(0, 1).toUpperCase()}
            </span>
          )}
          <p className="font-heading min-w-0 truncate text-sm font-bold tracking-[0.12em] text-electric-white uppercase">
            {plot.name ?? "Untitled landing"}
          </p>
        </div>
        <div className="mt-2.5 space-y-1 border-t border-white/10 pt-2">
          <p className="font-mono text-[10px] tracking-[0.18em] text-lunar-silver uppercase">
            {plot.id}
            {" · "}
            {pixels} px
            {" · "}
            {plot.width}×{plot.height}
          </p>
          <p className={cn("font-mono text-[10px] tracking-[0.18em] uppercase", premium ? "text-gold" : "text-lunar-silver")}>
            {plot.lunarFeature}
            {" · "}
            {premium ? "Premium" : "Standard"}
          </p>
        </div>
        <p className="mt-2 font-mono text-[9px] tracking-[0.2em] text-lunar-silver/80 uppercase">Click to land</p>
      </HudFrame>
    </div>
  );
}
