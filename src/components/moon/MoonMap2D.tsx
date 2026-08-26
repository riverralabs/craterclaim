"use client";

import { useRef } from "react";
import { GRID_HEIGHT, GRID_WIDTH, uvToPixel } from "@/lib/moon/coordinates";
import { rectFromCorners } from "@/lib/moon/selection";
import { useMoonStore } from "@/lib/store/moon-store";
import { findOverlappingPlot } from "@/lib/plots/overlap";

export function MoonMap2D() {
  const imgRef = useRef<HTMLImageElement>(null);
  const dragging = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const selectionMode = useMoonStore((state) => state.selectionMode);
  const selection = useMoonStore((state) => state.selection);
  const plots = useMoonStore((state) => state.plots);
  const setSelection = useMoonStore((state) => state.setSelection);
  const startLanding = useMoonStore((state) => state.startLanding);
  const markUserInteracted = useMoonStore((state) => state.markUserInteracted);
  const enterExploreMode = useMoonStore((state) => state.enterExploreMode);

  const active = plots.filter((plot) => plot.status === "active");
  const overlap = selection ? Boolean(findOverlappingPlot(selection, active)) : false;

  function pick(event: React.PointerEvent) {
    const img = imgRef.current;
    if (!img) return null;
    const rect = img.getBoundingClientRect();
    const u = (event.clientX - rect.left) / rect.width;
    const v = (event.clientY - rect.top) / rect.height;
    if (u < 0 || u > 1 || v < 0 || v > 1) return null;
    return uvToPixel(u, v);
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-space">
      <p className="relative z-10 px-4 pt-20 text-center font-mono text-[10px] tracking-[0.22em] text-lunar-silver uppercase sm:pt-24">
        2D map · WebGL unavailable · drag to select
      </p>
      <div className={`relative flex flex-1 items-center justify-center px-3 pb-28 ${selectionMode ? "cursor-crosshair" : "cursor-grab"}`}>
        <div className="relative max-h-full max-w-full">
          <picture>
            <source srcSet="/textures/moon/color-2k.webp" type="image/webp" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src="/textures/moon/color-2k.jpg"
              alt="Equirectangular Moon map"
              className="max-h-[min(70dvh,720px)] w-full max-w-4xl object-contain"
              draggable={false}
              onPointerDown={(event) => {
              enterExploreMode();
              markUserInteracted();
              const cell = pick(event);
              if (!cell || !useMoonStore.getState().selectionMode) return;
              dragging.current = true;
              start.current = cell;
              setSelection(rectFromCorners(cell.x, cell.y, cell.x, cell.y, useMoonStore.getState().features));
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!dragging.current || !start.current) return;
              const cell = pick(event);
              if (!cell) return;
              setSelection(rectFromCorners(start.current.x, start.current.y, cell.x, cell.y, useMoonStore.getState().features));
            }}
            onPointerUp={() => {
              dragging.current = false;
              start.current = null;
            }}
          />
          </picture>
          <div className="pointer-events-none absolute inset-0">
            {active.map((plot) => (
              <button
                key={plot.id}
                type="button"
                className="pointer-events-auto absolute border border-gold/70 bg-gold/15"
                style={{
                  left: `${(plot.x / GRID_WIDTH) * 100}%`,
                  top: `${(plot.y / GRID_HEIGHT) * 100}%`,
                  width: `${(plot.width / GRID_WIDTH) * 100}%`,
                  height: `${(plot.height / GRID_HEIGHT) * 100}%`,
                }}
                aria-label={plot.name ?? plot.id}
                onClick={() => startLanding(plot.id, false)}
              />
            ))}
            {selection ? (
              <div
                className={`absolute border ${overlap ? "border-red-400 bg-red-500/20" : "border-electric-white bg-white/15"}`}
                style={{
                  left: `${(selection.x / GRID_WIDTH) * 100}%`,
                  top: `${(selection.y / GRID_HEIGHT) * 100}%`,
                  width: `${(selection.width / GRID_WIDTH) * 100}%`,
                  height: `${(selection.height / GRID_HEIGHT) * 100}%`,
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
