"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { FacingMark } from "@/components/moon/FacingMark";
import { plotSurfaceFrame } from "@/lib/moon/surface-frame";
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
  image: HTMLImageElement | null,
  originX: number,
  originY: number,
  cell: number,
  family: string,
) {
  const premium = plot.zone === "premium";
  const name = (plot.name ?? plot.id).toUpperCase();
  const pad = Math.round(cell * 0.06);
  const nameBand = Math.round(cell * 0.22);
  const artX = originX + pad;
  const artY = originY + pad;
  const artW = cell - pad * 2;
  const artH = cell - pad * 2 - nameBand;
  const fill = premium ? "#ffe8aa" : "#f4f6fa";
  const cx = originX + cell / 2;

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
    ctx.lineWidth = Math.max(2, mono * 0.08);
    ctx.strokeText(initials, cx, artY + artH / 2);
    ctx.fillStyle = fill;
    ctx.fillText(initials, cx, artY + artH / 2);
  }

  let fontSize = Math.round(cell * 0.1);
  const minSize = Math.max(10, Math.round(cell * 0.08));
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${fontSize}px ${family}`;
  while (fontSize > minSize && ctx.measureText(name).width > artW) {
    fontSize -= 1;
    ctx.font = `700 ${fontSize}px ${family}`;
  }

  const nameY = originY + cell - pad - nameBand / 2;
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
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, layout.width, layout.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const cells: AtlasCell[] = [];
  for (let index = 0; index < plots.length; index += 1) {
    const plot = plots[index];
    const col = index % layout.cols;
    const row = Math.floor(index / layout.cols);
    let image: HTMLImageElement | null = null;
    if (plot.logoUrl) {
      try {
        image = await loadImage(plot.logoUrl);
      } catch {
        image = null;
      }
    }
    drawMark(ctx, plot, image, col * layout.cell, row * layout.cell, layout.cell, family);
    cells.push({
      plot,
      u: col / layout.cols,
      v: 1 - (row + 1) / layout.rows,
      du: 1 / layout.cols,
      dv: 1 / layout.rows,
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
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  return { texture, material, cells };
}

function AtlasPlane({
  width,
  height,
  u,
  v,
  du,
  dv,
  material,
}: {
  width: number;
  height: number;
  u: number;
  v: number;
  du: number;
  dv: number;
  material: THREE.MeshBasicMaterial;
}) {
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(width, height);
    const uv = plane.attributes.uv;
    for (let i = 0; i < uv.count; i += 1) {
      uv.setXY(i, u + uv.getX(i) * du, v + uv.getY(i) * dv);
    }
    return plane;
  }, [du, dv, height, u, v, width]);

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
    .map((plot) => `${plot.id}:${plot.logoUrl ?? ""}:${plot.name ?? ""}:${plot.zone}`)
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
        const frame = plotSurfaceFrame(cell.plot);
        return (
          <FacingMark key={cell.plot.id} local={frame.position}>
            <group position={frame.position} quaternion={frame.quaternion}>
              <AtlasPlane
                width={frame.width}
                height={frame.height}
                u={cell.u}
                v={cell.v}
                du={cell.du}
                dv={cell.dv}
                material={atlas.material}
              />
            </group>
          </FacingMark>
        );
      })}
    </group>
  );
}
