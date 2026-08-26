"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { plotSurfaceFrame } from "@/lib/moon/surface-frame";
import { useMoonStore } from "@/lib/store/moon-store";
import type { PlotRecord } from "@/types";

const MARK_SIZE = 1024;

function headingFont() {
  if (typeof document === "undefined") return "Syne, sans-serif";
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--font-syne").trim();
  const families = raw
    .split(",")
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean)
    .map((name) => `"${name}"`);
  return [...families, "Syne", "sans-serif"].join(", ");
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

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

function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
  maxWidth: number,
  mode: "fill" | "stroke",
) {
  const characters = text.split("");
  const widths = characters.map((character) => ctx.measureText(character).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + tracking * Math.max(0, characters.length - 1);
  const scale = total > maxWidth ? maxWidth / total : 1;
  let cursor = x - (total * scale) / 2;
  for (let index = 0; index < characters.length; index += 1) {
    if (mode === "stroke") ctx.strokeText(characters[index], cursor, y);
    else ctx.fillText(characters[index], cursor, y);
    cursor += (widths[index] + tracking) * scale;
  }
}

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.min(width / image.width, height / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  ctx.drawImage(image, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh);
}

async function textureFromPlot(plot: PlotRecord, image: HTMLImageElement | null) {
  await document.fonts.ready;
  const family = headingFont();
  try {
    await document.fonts.load(`700 96px ${family}`);
  } catch {
    // Fall back to whatever is already available.
  }

  const canvas = document.createElement("canvas");
  canvas.width = MARK_SIZE;
  canvas.height = MARK_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, MARK_SIZE, MARK_SIZE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const premium = plot.zone === "premium";
  const name = (plot.name ?? plot.id).toUpperCase();
  const pad = Math.round(MARK_SIZE * 0.06);
  const nameBand = Math.round(MARK_SIZE * 0.22);
  const artX = pad;
  const artY = pad;
  const artW = MARK_SIZE - pad * 2;
  const artH = MARK_SIZE - pad * 2 - nameBand;
  const fill = premium ? "#ffe8aa" : "#f4f6fa";

  if (image) {
    drawContainedImage(ctx, image, artX, artY, artW, artH);
  } else {
    const initials = initialsFromName(plot.name ?? plot.id);
    const mono = Math.round(artH * 0.42);
    ctx.font = `700 ${mono}px ${family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(5, 6, 12, 0.82)";
    ctx.lineWidth = Math.max(8, mono * 0.08);
    ctx.strokeText(initials, MARK_SIZE / 2, artY + artH / 2);
    ctx.fillStyle = fill;
    ctx.fillText(initials, MARK_SIZE / 2, artY + artH / 2);
  }

  let fontSize = Math.round(MARK_SIZE * 0.1);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${fontSize}px ${family}`;
  while (fontSize > 36 && ctx.measureText(name).width > artW) {
    fontSize -= 2;
    ctx.font = `700 ${fontSize}px ${family}`;
  }

  const nameY = MARK_SIZE - pad - nameBand / 2;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeStyle = "rgba(5, 6, 12, 0.9)";
  ctx.lineWidth = Math.max(6, fontSize * 0.16);
  drawTrackedText(ctx, name, MARK_SIZE / 2, nameY, fontSize * 0.12, artW, "stroke");
  ctx.fillStyle = fill;
  drawTrackedText(ctx, name, MARK_SIZE / 2, nameY, fontSize * 0.12, artW, "fill");

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function PlotLogoLayer() {
  const plots = useMoonStore((state) => state.plots);
  const [textures, setTextures] = useState<Map<string, THREE.Texture>>(() => new Map());

  const marked = useMemo(
    () => plots.filter((plot) => plot.status === "active"),
    [plots],
  );

  useEffect(() => {
    let cancelled = false;

    void Promise.all(
      marked.map(async (plot) => {
        try {
          const image = plot.logoUrl ? await loadImage(plot.logoUrl) : null;
          const texture = await textureFromPlot(plot, image);
          return texture ? ([plot.id, texture] as const) : null;
        } catch {
          try {
            const texture = await textureFromPlot(plot, null);
            return texture ? ([plot.id, texture] as const) : null;
          } catch {
            return null;
          }
        }
      }),
    ).then((loaded) => {
      if (cancelled) return;
      setTextures(new Map(loaded.filter((entry) => entry !== null)));
    });

    return () => {
      cancelled = true;
    };
  }, [marked]);

  useEffect(() => {
    return () => {
      for (const texture of textures.values()) texture.dispose();
    };
  }, [textures]);

  return (
    <group>
      {marked.map((plot) => {
        const texture = textures.get(plot.id);
        if (!texture) return null;
        const frame = plotSurfaceFrame(plot);
        return (
          <mesh
            key={plot.id}
            position={frame.position}
            quaternion={frame.quaternion}
            renderOrder={3}
            raycast={() => undefined}
          >
            <planeGeometry args={[frame.width, frame.height]} />
            <meshBasicMaterial
              map={texture}
              transparent
              depthWrite={false}
              toneMapped={false}
              polygonOffset
              polygonOffsetFactor={-2}
              polygonOffsetUnits={-2}
            />
          </mesh>
        );
      })}
    </group>
  );
}
