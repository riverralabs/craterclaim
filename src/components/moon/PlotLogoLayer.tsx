"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { FacingMark } from "@/components/moon/FacingMark";
import { plotSurfaceFrame, plotSurfaceGeometry } from "@/lib/moon/surface-frame";
import { useMoonStore } from "@/lib/store/moon-store";
import type { PlotRecord } from "@/types";

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

function knockoutBlackBackground(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return image;
  ctx.drawImage(image, 0, 0);
  const sample = ctx.getImageData(0, 0, 1, 1).data;
  const other = ctx.getImageData(image.width - 1, 0, 1, 1).data;
  const opaqueBlack = (pixel: Uint8ClampedArray) =>
    pixel[0] + pixel[1] + pixel[2] < 48 && pixel[3] > 200;
  if (!opaqueBlack(sample) && !opaqueBlack(other)) return image;

  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = frame.data;
  for (let i = 0; i < data.length; i += 4) {
    const luma = Math.max(data[i], data[i + 1], data[i + 2]);
    data[i + 3] = Math.round((data[i + 3] * luma) / 255);
  }
  ctx.putImageData(frame, 0, 0);
  return canvas;
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
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.min(width / imageWidth, height / imageHeight);
  const dw = imageWidth * scale;
  const dh = imageHeight * scale;
  ctx.drawImage(image, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh);
}

function plotContentRect(
  originX: number,
  originY: number,
  cell: number,
  plotWidth: number,
  plotHeight: number,
) {
  const aspect = Math.max(0.2, plotWidth / Math.max(1, plotHeight));
  const width = aspect >= 1 ? cell : cell * aspect;
  const height = aspect >= 1 ? cell / aspect : cell;
  return {
    x: originX + (cell - width) / 2,
    y: originY + (cell - height) / 2,
    width,
    height,
  };
}

function cellSizeFor(count: number) {
  if (count <= 16) return 256;
  if (count <= 64) return 128;
  return 64;
}

function atlasLayout(count: number) {
  const cell = cellSizeFor(count);
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / cols));
  return { cell, cols, rows, width: cols * cell, height: rows * cell };
}

function drawMark(
  ctx: CanvasRenderingContext2D,
  plot: PlotRecord,
  image: HTMLImageElement | HTMLCanvasElement | null,
  rect: { x: number; y: number; width: number; height: number },
  family: string,
) {
  const premium = plot.zone === "premium";
  const name = (plot.name ?? plot.id).toUpperCase();
  const pad = Math.round(Math.min(rect.width, rect.height) * 0.06);
  const fill = premium ? "#ffe8aa" : "#f4f6fa";
  const cx = rect.x + rect.width / 2;

  if (image) {
    drawContainedImage(
      ctx,
      image,
      image.width,
      image.height,
      rect.x + pad,
      rect.y + pad,
      rect.width - pad * 2,
      rect.height - pad * 2,
    );
    return;
  }

  const nameBand = Math.round(rect.height * 0.22);
  const artX = rect.x + pad;
  const artY = rect.y + pad;
  const artW = rect.width - pad * 2;
  const artH = rect.height - pad * 2 - nameBand;
  const initials = initialsFromName(plot.name ?? plot.id);
  const mono = Math.round(artH * 0.42);
  ctx.font = `700 ${mono}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(5, 6, 12, 0.82)";
  ctx.lineWidth = Math.max(2, mono * 0.08);
  ctx.strokeText(initials, cx, artY + artH / 2);
  ctx.fillStyle = fill;
  ctx.fillText(initials, cx, artY + artH / 2);

  let fontSize = Math.round(rect.height * 0.1);
  const minSize = Math.max(10, Math.round(rect.height * 0.08));
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${fontSize}px ${family}`;
  while (fontSize > minSize && ctx.measureText(name).width > artW) {
    fontSize -= 1;
    ctx.font = `700 ${fontSize}px ${family}`;
  }

  const nameY = rect.y + rect.height - pad - nameBand / 2;
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.strokeStyle = "rgba(5, 6, 12, 0.9)";
  ctx.lineWidth = Math.max(2, fontSize * 0.16);
  drawTrackedText(ctx, name, cx, nameY, fontSize * 0.12, artW, "stroke");
  ctx.fillStyle = fill;
  drawTrackedText(ctx, name, cx, nameY, fontSize * 0.12, artW, "fill");
}

type AtlasCell = {
  plot: PlotRecord;
  u: number;
  v: number;
  du: number;
  dv: number;
};

async function buildAtlas(plots: PlotRecord[]): Promise<{
  texture: THREE.CanvasTexture;
  material: THREE.MeshBasicMaterial;
  cells: AtlasCell[];
} | null> {
  if (plots.length === 0) return null;
  await document.fonts.ready;
  const family = headingFont();
  try {
    await document.fonts.load(`700 96px ${family}`);
  } catch {
    // Fall back to whatever is already available.
  }

  const layout = atlasLayout(plots.length);
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return null;
  ctx.clearRect(0, 0, layout.width, layout.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const cells: AtlasCell[] = [];
  for (let index = 0; index < plots.length; index += 1) {
    const plot = plots[index];
    const col = index % layout.cols;
    const row = Math.floor(index / layout.cols);
    let image: HTMLImageElement | HTMLCanvasElement | null = null;
    if (plot.logoUrl) {
      try {
        image = knockoutBlackBackground(await loadImage(plot.logoUrl));
      } catch {
        image = null;
      }
    }
    const originX = col * layout.cell;
    const originY = row * layout.cell;
    const rect = plotContentRect(originX, originY, layout.cell, plot.width, plot.height);
    drawMark(ctx, plot, image, rect, family);
    cells.push({
      plot,
      u: rect.x / layout.width,
      v: 1 - (rect.y + rect.height) / layout.height,
      du: rect.width / layout.width,
      dv: rect.height / layout.height,
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    alphaTest: 0.04,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  return { texture, material, cells };
}

function AtlasPatch({
  plot,
  u,
  v,
  du,
  dv,
  material,
}: {
  plot: PlotRecord;
  u: number;
  v: number;
  du: number;
  dv: number;
  material: THREE.MeshBasicMaterial;
}) {
  const geometry = useMemo(() => {
    const patch = plotSurfaceGeometry(
      { x: plot.x, y: plot.y, width: plot.width, height: plot.height },
      1.007,
      8,
      4,
    );
    const uv = patch.attributes.uv;
    for (let i = 0; i < uv.count; i += 1) {
      uv.setXY(i, u + uv.getX(i) * du, v + uv.getY(i) * dv);
    }
    return patch;
  }, [du, dv, plot.height, plot.width, plot.x, plot.y, u, v]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      renderOrder={3}
      raycast={() => undefined}
    />
  );
}

export function PlotLogoLayer() {
  const plots = useMoonStore((state) => state.plots);
  const [atlas, setAtlas] = useState<Awaited<ReturnType<typeof buildAtlas>>>(null);

  const marked = useMemo(
    () => plots.filter((plot) => plot.status === "active"),
    [plots],
  );
  const signature = marked
    .map((plot) => `${plot.id}:${plot.logoUrl ?? ""}:${plot.name ?? ""}:${plot.zone}:${plot.width}x${plot.height}`)
    .join("|");

  useEffect(() => {
    let cancelled = false;
    void buildAtlas(marked).then((next) => {
      if (cancelled) return;
      setAtlas(next);
    });
    return () => {
      cancelled = true;
    };
    // Rebuild only when mark identity changes, not on every plots array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  useEffect(() => {
    return () => {
      atlas?.texture.dispose();
      atlas?.material.dispose();
    };
  }, [atlas]);

  if (!atlas) return null;

  return (
    <group>
      {atlas.cells.map((cell) => {
        const frame = plotSurfaceFrame(cell.plot, 1.007, 1);
        return (
          <FacingMark key={cell.plot.id} local={frame.position}>
            <AtlasPatch
              plot={cell.plot}
              u={cell.u}
              v={cell.v}
              du={cell.du}
              dv={cell.dv}
              material={atlas.material}
            />
          </FacingMark>
        );
      })}
    </group>
  );
}
