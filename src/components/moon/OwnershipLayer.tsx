"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GRID_HEIGHT, GRID_WIDTH, latLngToUV } from "@/lib/moon/coordinates";
import { LUNAR_FEATURES } from "@/lib/moon/regions";
import { useMoonStore } from "@/lib/store/moon-store";
import type { PlotRecord, PlotSelection } from "@/types";

const MAP_WIDTH = 4096;
const MAP_HEIGHT = 1024;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (!src.startsWith("data:") && !src.startsWith("blob:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function paintGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, "rgba(255, 220, 120, 0.72)");
  gradient.addColorStop(0.28, "rgba(224, 184, 79, 0.38)");
  gradient.addColorStop(0.6, "rgba(196, 150, 48, 0.14)");
  gradient.addColorStop(1, "rgba(196, 150, 48, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function strokeGrid(ctx: CanvasRenderingContext2D, step: number) {
  const sx = MAP_WIDTH / GRID_WIDTH;
  const sy = MAP_HEIGHT / GRID_HEIGHT;
  ctx.beginPath();
  for (let x = 0; x <= GRID_WIDTH; x += step) {
    ctx.moveTo(Math.round(x * sx) + 0.5, 0);
    ctx.lineTo(Math.round(x * sx) + 0.5, MAP_HEIGHT);
  }
  for (let y = 0; y <= GRID_HEIGHT; y += step) {
    ctx.moveTo(0, Math.round(y * sy) + 0.5);
    ctx.lineTo(MAP_WIDTH, Math.round(y * sy) + 0.5);
  }
  ctx.stroke();
}

function drawGrid(ctx: CanvasRenderingContext2D, step: number) {
  const major = Math.max(50, step * 2);

  ctx.lineWidth = 0.7;
  ctx.strokeStyle = "rgba(214, 226, 255, 0.32)";
  ctx.shadowBlur = 0;
  strokeGrid(ctx, step);

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "rgba(228, 236, 255, 0.62)";
  ctx.shadowColor = "rgba(170, 198, 255, 0.7)";
  ctx.shadowBlur = 10;
  strokeGrid(ctx, major);
  ctx.shadowBlur = 0;

  ctx.save();
  ctx.beginPath();
  for (const feature of LUNAR_FEATURES) {
    if (!feature.isPremium) continue;
    const { u, v } = latLngToUV(feature.centerLat, feature.centerLng);
    const x = u * MAP_WIDTH;
    const y = v * MAP_HEIGHT;
    const radius = Math.max(24, (feature.radiusDeg / 180) * MAP_HEIGHT * 1.1);
    ctx.moveTo(x + radius, y);
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  }
  ctx.clip();
  ctx.lineWidth = 0.85;
  ctx.strokeStyle = "rgba(224, 184, 79, 0.55)";
  strokeGrid(ctx, step);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "rgba(255, 214, 110, 1)";
  ctx.shadowColor = "rgba(224, 184, 79, 1)";
  ctx.shadowBlur = 16;
  strokeGrid(ctx, major);
  ctx.restore();
}

function drawSelection(ctx: CanvasRenderingContext2D, selection: PlotSelection) {
  const sx = MAP_WIDTH / GRID_WIDTH;
  const sy = MAP_HEIGHT / GRID_HEIGHT;
  const x = selection.x * sx;
  const y = selection.y * sy;
  const w = selection.width * sx;
  const h = selection.height * sy;
  const premium = selection.zone === "premium";

  ctx.fillStyle = premium ? "rgba(224, 184, 79, 0.22)" : "rgba(124, 125, 255, 0.2)";
  ctx.strokeStyle = premium ? "rgba(255, 220, 120, 0.95)" : "rgba(180, 182, 255, 0.95)";
  ctx.lineWidth = 2;
  ctx.shadowColor = premium ? "rgba(224, 184, 79, 0.9)" : "rgba(124, 125, 255, 0.8)";
  ctx.shadowBlur = 14;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.shadowBlur = 0;
}

function drawLogoMark(
  ctx: CanvasRenderingContext2D,
  plot: PlotRecord,
  image: HTMLImageElement | undefined,
  highlight: boolean,
) {
  const sx = MAP_WIDTH / GRID_WIDTH;
  const sy = MAP_HEIGHT / GRID_HEIGHT;
  const x = plot.x * sx;
  const y = plot.y * sy;
  const w = Math.max(1, plot.width * sx);
  const h = Math.max(1, plot.height * sy);
  const premium = plot.zone === "premium";
  const glow = premium ? "rgba(224, 184, 79, 1)" : "rgba(124, 125, 255, 1)";
  const inner = premium ? "rgba(255, 232, 170, 0.7)" : "rgba(196, 200, 255, 0.65)";
  const stroke = highlight
    ? "rgba(255, 255, 255, 0.95)"
    : premium
      ? "rgba(255, 220, 120, 0.9)"
      : "rgba(170, 176, 255, 0.85)";
  const cx = x + w / 2;
  const cy = y + h / 2;
  const label = (plot.name ?? plot.id).toUpperCase();
  const showLabel = w >= 48 && h >= 24;
  const fontSize = Math.max(5, Math.min(9, w / Math.max(12, label.length * 0.9)));
  const aura = Math.max(w, h) * 0.95;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, aura);
  halo.addColorStop(0, inner);
  halo.addColorStop(0.35, premium ? "rgba(224, 184, 79, 0.28)" : "rgba(124, 125, 255, 0.26)");
  halo.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, aura, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (w >= 10 && h >= 10) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = highlight ? 1.8 : 1;
    ctx.shadowColor = glow;
    ctx.shadowBlur = highlight ? 16 : 10;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.shadowBlur = 0;
  }

  const mark = Math.max(8, Math.min(w, h) * 0.42);
  const markCy = showLabel ? cy - fontSize * 0.35 : cy;

  if (image && image.width > 0 && image.height > 0) {
    const scale = Math.min(mark / image.width, mark / image.height);
    const dw = image.width * scale;
    const dh = image.height * scale;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 22;
    ctx.drawImage(image, cx - dw / 2, markCy - dh / 2, dw, dh);
    ctx.shadowBlur = 0;
  } else {
    const initials = initialsFromName(plot.name ?? plot.id);
    const mono = Math.max(7, mark * 0.42);
    ctx.shadowColor = glow;
    ctx.shadowBlur = 14;
    ctx.fillStyle = premium ? "#ffe8aa" : "#d8dcff";
    ctx.font = `700 ${mono}px Syne, Outfit, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    fillTrackedText(ctx, initials || "•", cx, markCy, mono * 0.18, mark);
    ctx.shadowBlur = 0;
  }

  if (showLabel) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = glow;
    ctx.fillStyle = premium ? "#ffe8aa" : "#e8eaff";
    ctx.font = `600 ${fontSize}px Syne, Outfit, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    fillTrackedText(ctx, label, cx, y + h - fontSize - 2, fontSize * 0.28, w - 6);
    ctx.shadowBlur = 0;
  }
}

function fillTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  maxWidth: number,
) {
  const characters = text.split("");
  const widths = characters.map((character) => ctx.measureText(character).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + tracking * Math.max(0, characters.length - 1);
  const scale = total > maxWidth ? maxWidth / total : 1;
  let cursor = x - (total * scale) / 2;
  for (let index = 0; index < characters.length; index += 1) {
    ctx.fillText(characters[index], cursor, y);
    cursor += (widths[index] + tracking) * scale;
  }
}

function paintOverlay(
  ctx: CanvasRenderingContext2D,
  selectionMode: boolean,
  selection: PlotSelection | null,
  plots: PlotRecord[],
  highlightId: string | null,
  logos: Map<string, HTMLImageElement>,
  step: number,
) {
  ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  for (const feature of LUNAR_FEATURES) {
    if (!feature.isPremium) continue;
    const { u, v } = latLngToUV(feature.centerLat, feature.centerLng);
    const x = u * MAP_WIDTH;
    const y = v * MAP_HEIGHT;
    const radius = Math.max(28, (feature.radiusDeg / 180) * MAP_HEIGHT * 1.15);
    paintGlow(ctx, x, y, radius);
    if (x - radius < 0) paintGlow(ctx, x + MAP_WIDTH, y, radius);
    if (x + radius > MAP_WIDTH) paintGlow(ctx, x - MAP_WIDTH, y, radius);
  }

  drawGrid(ctx, step);

  for (const plot of plots) {
    if (plot.status !== "active") continue;
    drawLogoMark(ctx, plot, logos.get(plot.id), plot.id === highlightId);
  }
  if (selection) {
    drawSelection(ctx, selection);
  }
}

export function OwnershipLayer() {
  const selectionMode = useMoonStore((state) => state.selectionMode);
  const selection = useMoonStore((state) => state.selection);
  const plots = useMoonStore((state) => state.plots);
  const landingPlotId = useMoonStore((state) => state.landingPlotId);
  const camera = useThree((state) => state.camera);
  const lodStep = useRef(25);
  const [logos, setLogos] = useState<Map<string, HTMLImageElement>>(() => new Map());

  const { canvas, ctx, texture } = useMemo(() => {
    const nextCanvas = document.createElement("canvas");
    nextCanvas.width = MAP_WIDTH;
    nextCanvas.height = MAP_HEIGHT;
    const nextCtx = nextCanvas.getContext("2d");
    const nextTexture = new THREE.CanvasTexture(nextCanvas);
    nextTexture.colorSpace = THREE.SRGBColorSpace;
    nextTexture.anisotropy = 4;
    return { canvas: nextCanvas, ctx: nextCtx, texture: nextTexture };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const entries = plots.filter((plot) => plot.status === "active" && plot.logoUrl);

    void Promise.all(
      entries.map(async (plot) => {
        try {
          const image = await loadImage(plot.logoUrl!);
          return [plot.id, image] as const;
        } catch {
          return null;
        }
      }),
    ).then((loaded) => {
      if (cancelled) return;
      setLogos(new Map(loaded.filter((entry) => entry !== null)));
    });

    return () => {
      cancelled = true;
    };
  }, [plots]);

  useEffect(() => {
    if (!ctx) return;
    paintOverlay(ctx, selectionMode, selection, plots, landingPlotId, logos, lodStep.current);
    texture.needsUpdate = true;
  }, [ctx, landingPlotId, logos, plots, selection, selectionMode, texture]);

  useFrame(() => {
    if (!ctx) return;
    const distance = camera.position.length();
    const next = distance > 3.2 ? 25 : distance > 2.4 ? 20 : 10;
    if (next === lodStep.current) return;
    lodStep.current = next;
    paintOverlay(ctx, selectionMode, selection, plots, landingPlotId, logos, next);
    texture.needsUpdate = true;
  });

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  void canvas;

  return (
    <mesh>
      <sphereGeometry args={[1.004, 64, 64]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
