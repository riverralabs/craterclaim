"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { GRID_HEIGHT, GRID_WIDTH, latLngToUV } from "@/lib/moon/coordinates";
import { SNAP } from "@/lib/moon/selection";
import { findOverlappingPlot } from "@/lib/plots/overlap";
import { useMoonStore } from "@/lib/store/moon-store";
import type { LunarFeature, PlotRecord, PlotSelection } from "@/types";

const MAP_WIDTH = 2048;
const MAP_HEIGHT = 1024;

type OwnershipLayerProps = {
  segments: number;
};

function paintGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, "rgba(255, 214, 110, 0.78)");
  gradient.addColorStop(0.22, "rgba(224, 184, 79, 0.5)");
  gradient.addColorStop(0.52, "rgba(224, 184, 79, 0.2)");
  gradient.addColorStop(1, "rgba(224, 184, 79, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  const sx = MAP_WIDTH / GRID_WIDTH;
  const sy = MAP_HEIGHT / GRID_HEIGHT;
  const major = SNAP * 2;

  ctx.beginPath();
  for (let x = 0; x <= GRID_WIDTH; x += SNAP) {
    ctx.moveTo(Math.round(x * sx) + 0.5, 0);
    ctx.lineTo(Math.round(x * sx) + 0.5, MAP_HEIGHT);
  }
  for (let y = 0; y <= GRID_HEIGHT; y += SNAP) {
    ctx.moveTo(0, Math.round(y * sy) + 0.5);
    ctx.lineTo(MAP_WIDTH, Math.round(y * sy) + 0.5);
  }
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = "rgba(6, 8, 14, 0.22)";
  ctx.stroke();
  ctx.strokeStyle = "rgba(168, 188, 214, 0.1)";
  ctx.stroke();

  ctx.beginPath();
  for (let x = 0; x <= GRID_WIDTH; x += major) {
    ctx.moveTo(Math.round(x * sx) + 0.5, 0);
    ctx.lineTo(Math.round(x * sx) + 0.5, MAP_HEIGHT);
  }
  for (let y = 0; y <= GRID_HEIGHT; y += major) {
    ctx.moveTo(0, Math.round(y * sy) + 0.5);
    ctx.lineTo(MAP_WIDTH, Math.round(y * sy) + 0.5);
  }
  ctx.lineWidth = 1.05;
  ctx.strokeStyle = "rgba(5, 6, 12, 0.48)";
  ctx.stroke();
  ctx.strokeStyle = "rgba(196, 214, 236, 0.22)";
  ctx.stroke();
}

function outlineRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke: string,
) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.lineJoin = "miter";
  ctx.strokeStyle = "rgba(5, 6, 12, 0.82)";
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function drawSelection(
  ctx: CanvasRenderingContext2D,
  selection: PlotSelection,
  blocked: boolean,
) {
  const sx = MAP_WIDTH / GRID_WIDTH;
  const sy = MAP_HEIGHT / GRID_HEIGHT;
  const x = selection.x * sx;
  const y = selection.y * sy;
  const w = selection.width * sx;
  const h = selection.height * sy;
  const premium = selection.zone === "premium";

  if (blocked) {
    outlineRect(ctx, x, y, w, h, "rgba(220, 56, 56, 0.42)", "#ff6b6b");
  } else if (premium) {
    outlineRect(ctx, x, y, w, h, "rgba(224, 184, 79, 0.36)", "#ffd56a");
  } else {
    outlineRect(ctx, x, y, w, h, "rgba(46, 186, 255, 0.34)", "#4ad4ff");
  }
}

function drawLogoMark(
  ctx: CanvasRenderingContext2D,
  plot: PlotRecord,
  highlight: boolean,
) {
  const sx = MAP_WIDTH / GRID_WIDTH;
  const sy = MAP_HEIGHT / GRID_HEIGHT;
  const x = plot.x * sx;
  const y = plot.y * sy;
  const w = Math.max(1, plot.width * sx);
  const h = Math.max(1, plot.height * sy);
  const premium = plot.zone === "premium";
  const inner = premium ? "rgba(255, 232, 170, 0.55)" : "rgba(220, 226, 236, 0.4)";
  const stroke = highlight
    ? "#ffffff"
    : premium
      ? "#ffd56a"
      : "#9ad8ff";
  const cx = x + w / 2;
  const cy = y + h / 2;
  const aura = Math.max(w, h) * 0.85;

  ctx.save();
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, aura);
  halo.addColorStop(0, inner);
  halo.addColorStop(0.4, premium ? "rgba(224, 184, 79, 0.18)" : "rgba(183, 188, 198, 0.12)");
  halo.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, aura, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (w >= 10 && h >= 10) {
    ctx.strokeStyle = "rgba(5, 6, 12, 0.8)";
    ctx.lineWidth = highlight ? 3.2 : 2.4;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = highlight ? 1.8 : 1.35;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }
}

function paintOverlay(
  ctx: CanvasRenderingContext2D,
  selection: PlotSelection | null,
  plots: PlotRecord[],
  highlightId: string | null,
  features: LunarFeature[],
) {
  ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  for (const feature of features) {
    if (!feature.isPremium) continue;
    const { u, v } = latLngToUV(feature.centerLat, feature.centerLng);
    const x = u * MAP_WIDTH;
    const y = v * MAP_HEIGHT;
    const radius = Math.max(28, (feature.radiusDeg / 180) * MAP_HEIGHT * 1.2);
    paintGlow(ctx, x, y, radius);
    if (x - radius < 0) paintGlow(ctx, x + MAP_WIDTH, y, radius);
    if (x + radius > MAP_WIDTH) paintGlow(ctx, x - MAP_WIDTH, y, radius);
  }

  drawGrid(ctx);

  const active = plots.filter((plot) => plot.status === "active");
  for (const plot of active) {
    drawLogoMark(ctx, plot, plot.id === highlightId);
  }
  if (selection) {
    drawSelection(ctx, selection, Boolean(findOverlappingPlot(selection, active)));
  }
}

export function OwnershipLayer({ segments }: OwnershipLayerProps) {
  const selection = useMoonStore((state) => state.selection);
  const plots = useMoonStore((state) => state.plots);
  const features = useMoonStore((state) => state.features);
  const landingPlotId = useMoonStore((state) => state.landingPlotId);

  const { ctx, texture } = useMemo(() => {
    const nextCanvas = document.createElement("canvas");
    nextCanvas.width = MAP_WIDTH;
    nextCanvas.height = MAP_HEIGHT;
    const nextCtx = nextCanvas.getContext("2d", { alpha: true });
    const nextTexture = new THREE.CanvasTexture(nextCanvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    nextTexture.anisotropy = 2;
    nextTexture.minFilter = THREE.LinearFilter;
    nextTexture.magFilter = THREE.LinearFilter;
    nextTexture.generateMipmaps = false;
    return { ctx: nextCtx, texture: nextTexture };
  }, []);

  useEffect(() => {
    if (!ctx) return;
    paintOverlay(ctx, selection, plots, landingPlotId, features);
    texture.needsUpdate = true;
  }, [ctx, features, landingPlotId, plots, selection, texture]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return (
    <mesh>
      <sphereGeometry args={[1.003, segments, segments]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
}
