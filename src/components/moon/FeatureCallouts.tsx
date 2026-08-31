"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { latLngToVector3 } from "@/lib/moon/coordinates";
import { useMoonStore } from "@/lib/store/moon-store";

const FADE_NEAR = 2.2;
const FADE_FAR = 3.1;

export type CalloutPin = {
  id: string;
  title: string;
  subtitle: string;
  tone: "gold" | "silver";
  x: number;
  y: number;
  exitX: number;
  exitY: number;
  jointX: number;
  jointY: number;
  labelX: number;
  labelY: number;
  side: "left" | "right";
};

function elbowPath(pin: CalloutPin) {
  return `M ${pin.x} ${pin.y} L ${pin.exitX} ${pin.exitY} L ${pin.jointX} ${pin.jointY} L ${pin.labelX} ${pin.labelY}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function strokeFor(pin: { tone: "gold" | "silver" }) {
  return pin.tone === "silver" ? "#9ad8ff" : "#e0b84f";
}

function paintPing(pin: CalloutPin, compact: boolean) {
  const color = strokeFor(pin);
  const r = compact ? 4.2 : 5.5;
  return `<g filter="url(#callout-glow)">
      <circle cx="${pin.x}" cy="${pin.y}" r="${r}" fill="none" stroke="${color}" stroke-width="1.15" />
      <circle cx="${pin.x}" cy="${pin.y}" r="1.7" fill="${color}" />
    </g>`;
}

function paintCallouts(pins: CalloutPin[], compact: boolean) {
  const root = document.getElementById("moon-callouts");
  if (!root) return;
  root.dataset.count = String(pins.length);
  const tick = compact ? 14 : 16;
  const titleSize = compact ? 11 : 11;
  const subSize = compact ? 9 : 8;
  const groups = pins
    .map((pin) => {
      const color = strokeFor(pin);
      const bracket =
        pin.side === "right"
          ? `M ${pin.labelX} ${pin.labelY - tick} L ${pin.labelX} ${pin.labelY + tick} L ${pin.labelX + 14} ${pin.labelY + tick}`
          : `M ${pin.labelX} ${pin.labelY - tick} L ${pin.labelX} ${pin.labelY + tick} L ${pin.labelX - 14} ${pin.labelY + tick}`;
      return `${paintPing(pin, compact)}<g filter="url(#callout-glow)">
          <circle cx="${pin.exitX}" cy="${pin.exitY}" r="2.2" fill="${color}" />
          <circle cx="${pin.jointX}" cy="${pin.jointY}" r="2.2" fill="${color}" />
          <path d="${elbowPath(pin)}" fill="none" stroke="${color}" stroke-width="1.15" />
          <path d="${bracket}" fill="none" stroke="${color}" stroke-width="1.15" />
        </g>`;
    })
    .join("");
  const labels = pins
    .map((pin) => {
      const transform =
        pin.side === "left" ? "translate(calc(-100% - 8px), -50%)" : "translate(10px, -50%)";
      const color = strokeFor(pin);
      return `<div data-callout="true" style="position:absolute;left:${pin.labelX}px;top:${pin.labelY}px;transform:${transform};white-space:nowrap">
          <p style="margin:0;font-family:Syne,ui-sans-serif,sans-serif;font-size:${titleSize}px;font-weight:700;letter-spacing:${compact ? "0.08em" : "0.18em"};color:#f4f6f8;text-transform:uppercase;line-height:1.2">${escapeHtml(pin.title)}</p>
          <p style="margin:3px 0 0;font-family:'Geist Mono',ui-monospace,monospace;font-size:${subSize}px;letter-spacing:${compact ? "0.1em" : "0.24em"};color:${color};text-transform:uppercase;line-height:1.15">${escapeHtml(pin.subtitle)}</p>
        </div>`;
    })
    .join("");
  root.innerHTML = `<svg aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible">
      <defs>
        <filter id="callout-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      ${groups}
    </svg>${labels}`;
}

function samePins(a: CalloutPin[], b: CalloutPin[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (
      left.id !== right.id ||
      Math.abs(left.x - right.x) > 0.8 ||
      Math.abs(left.y - right.y) > 0.8 ||
      Math.abs(left.labelX - right.labelX) > 0.8 ||
      Math.abs(left.labelY - right.labelY) > 0.8
    ) {
      return false;
    }
  }
  return true;
}

function inRect(x: number, y: number, rect: { x: number; y: number; w: number; h: number }) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function layoutPins(
  facing: CalloutPin[],
  cx: number,
  cy: number,
  moonR: number,
  width: number,
  height: number,
  avoidRight: number,
  avoidBottom: number,
  hero: boolean,
  compact: boolean,
) {
  const gap = compact ? 48 : 70;
  const ring = moonR + gap;
  const minR = moonR + (compact ? 32 : 48);
  const hud = { x: width - avoidRight, y: 72, w: avoidRight + 8, h: height };
  const copy = hero
    ? { x: 0, y: height - 300, w: Math.min(540, width * 0.42), h: 300 }
    : { x: 0, y: height - avoidBottom, w: width, h: avoidBottom };
  const topMin = 84;
  const bottomMax = height - Math.max(28, hero ? 20 : avoidBottom);
  const leftMin = 18;
  const rightMax = width - avoidRight - 12;

  const blocked = (x: number, y: number) => {
    if (x < leftMin || x > rightMax || y < topMin || y > bottomMax) return true;
    if (avoidRight > 80 && inRect(x, y, hud)) return true;
    if (hero && inRect(x, y, copy)) return true;
    return Math.hypot(x - cx, y - cy) < minR;
  };

  facing.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));

  const used: { x: number; y: number }[] = [];
  const minSep = compact ? 68 : 92;

  for (const pin of facing) {
    const base =
      pin.id === "south-pole" ? Math.PI / 2 : Math.atan2(pin.y - cy, pin.x - cx);
    let chosen: { x: number; y: number } | null = null;

    for (let step = 0; step <= 18; step += 1) {
      const dir = step === 0 ? 0 : step % 2 === 0 ? step / 2 : -(step + 1) / 2;
      const angle = base + dir * 0.18;
      const x = cx + Math.cos(angle) * ring;
      const y = cy + Math.sin(angle) * ring;
      if (blocked(x, y)) continue;
      if (used.some((slot) => Math.hypot(slot.x - x, slot.y - y) < minSep)) continue;
      chosen = { x, y };
      break;
    }

    if (!chosen) {
      for (let i = 0; i < 24; i += 1) {
        const angle = -Math.PI + (i / 24) * Math.PI * 2;
        const x = cx + Math.cos(angle) * ring;
        const y = cy + Math.sin(angle) * ring;
        if (blocked(x, y)) continue;
        if (used.some((slot) => Math.hypot(slot.x - x, slot.y - y) < minSep)) continue;
        chosen = { x, y };
        break;
      }
    }

    if (!chosen) {
      pin.labelX = pin.x;
      pin.labelY = pin.y;
      pin.exitX = pin.x;
      pin.exitY = pin.y;
      pin.jointX = pin.x;
      pin.jointY = pin.y;
      continue;
    }

    used.push(chosen);
    pin.labelX = chosen.x;
    pin.labelY = chosen.y;
    pin.side = chosen.x >= pin.x ? "right" : "left";
    if (pin.side === "right" && chosen.x > rightMax - 160) {
      pin.side = "left";
    }

    const out = Math.atan2(pin.y - cy, pin.x - cx);
    pin.exitX = cx + Math.cos(out) * (moonR + 14);
    pin.exitY = cy + Math.sin(out) * (moonR + 14);

    const dx = Math.abs(pin.labelX - pin.exitX);
    const dy = Math.abs(pin.labelY - pin.exitY);
    if (dy >= dx) {
      pin.jointX = pin.exitX;
      pin.jointY = pin.labelY;
    } else {
      pin.jointX = pin.labelX;
      pin.jointY = pin.exitY;
    }
  }
}

export function CalloutTracker({
  visible,
  avoidRight,
  avoidBottom,
  hero,
  compact = false,
}: {
  visible: boolean;
  avoidRight: number;
  avoidBottom: number;
  hero: boolean;
  compact?: boolean;
}) {
  const { camera, size, scene } = useThree();
  const world = useRef(new THREE.Vector3());
  const ndc = useRef(new THREE.Vector3());
  const center = useRef(new THREE.Vector3());
  const moonPos = useRef(new THREE.Vector3());
  const normal = useRef(new THREE.Vector3());
  const toCam = useRef(new THREE.Vector3());
  const viewDir = useRef(new THREE.Vector3());
  const camRight = useRef(new THREE.Vector3());
  const rim = useRef(new THREE.Vector3());
  const last = useRef<CalloutPin[]>([]);
  const lastPaintAt = useRef(0);
  const lastOpacity = useRef(1);
  const hoverPlotId = useMoonStore((state) => state.hoverPlotId);
  const plots = useMoonStore((state) => state.plots);
  const hoverLocal = useMemo(() => {
    const plot = plots.find((item) => item.id === hoverPlotId && item.status === "active");
    if (!plot) return null;
    return {
      plot,
      local: latLngToVector3(plot.centerLatitude, plot.centerLongitude, 1.007),
    };
  }, [hoverPlotId, plots]);

  useFrame(({ clock }) => {
    const root = document.getElementById("moon-callouts");
    const distance = camera.position.length();
    const fade = THREE.MathUtils.clamp((distance - FADE_NEAR) / (FADE_FAR - FADE_NEAR), 0, 1);
    if (root && Math.abs(fade - lastOpacity.current) > 0.02) {
      root.style.opacity = String(fade);
      lastOpacity.current = fade;
    }

    if (!visible || fade < 0.05 || !hoverLocal) {
      if (last.current.length) {
        last.current = [];
        lastPaintAt.current = 0;
        paintCallouts([], compact);
      }
      return;
    }

    const elapsed = clock.getElapsedTime();
    if (elapsed - lastPaintAt.current < 0.04) return;
    lastPaintAt.current = elapsed;

    const moon = scene.getObjectByName("moonSurface");
    if (!moon) return;
    moon.updateWorldMatrix(true, false);
    moon.getWorldPosition(moonPos.current);

    const width = size.width;
    const height = size.height;
    center.current.copy(moonPos.current).project(camera);
    const cx = (center.current.x * 0.5 + 0.5) * width;
    const cy = (-center.current.y * 0.5 + 0.5) * height;

    viewDir.current.copy(camera.position).sub(moonPos.current).normalize();
    camRight.current.copy(camera.up).cross(viewDir.current).normalize();
    rim.current.copy(moonPos.current).add(camRight.current).project(camera);
    const moonR = Math.max(
      Math.hypot(
        (rim.current.x * 0.5 + 0.5) * width - cx,
        (-rim.current.y * 0.5 + 0.5) * height - cy,
      ),
      80,
    );

    const facing: CalloutPin[] = [];
    if (hoverLocal) {
      world.current
        .set(hoverLocal.local.x, hoverLocal.local.y, hoverLocal.local.z)
        .applyMatrix4(moon.matrixWorld);
      normal.current.copy(world.current).sub(moonPos.current).normalize();
      toCam.current.copy(camera.position).sub(world.current).normalize();
      if (normal.current.dot(toCam.current) >= -0.22) {
        ndc.current.copy(world.current).project(camera);
        if (ndc.current.z <= 1) {
          const x = (ndc.current.x * 0.5 + 0.5) * width;
          const y = (-ndc.current.y * 0.5 + 0.5) * height;
          if (Math.hypot(x - cx, y - cy) <= moonR + 8) {
            const premium = hoverLocal.plot.zone === "premium";
            facing.push({
              id: hoverLocal.plot.id,
              title: hoverLocal.plot.name ?? hoverLocal.plot.id,
              subtitle: premium ? "Premium landing" : "Standard landing",
              tone: premium ? "gold" : "silver",
              x,
              y,
              exitX: x,
              exitY: y,
              jointX: x,
              jointY: y,
              labelX: x,
              labelY: y,
              side: "right",
            });
          }
        }
      }
    }

    layoutPins(facing, cx, cy, moonR, width, height, avoidRight, avoidBottom, hero, compact);
    const placed = facing.filter(
      (pin) =>
        Math.hypot(pin.labelX - cx, pin.labelY - cy) >= moonR + (compact ? 28 : 40) &&
        Math.hypot(pin.labelX - pin.x, pin.labelY - pin.y) > (compact ? 20 : 28),
    );

    if (root) {
      root.dataset.count = String(placed.length);
    }

    if (samePins(last.current, placed)) {
      if (root && root.dataset.count === String(placed.length) && root.querySelector("[data-callout], circle")) {
        return;
      }
    }
    last.current = placed;
    paintCallouts(placed, compact);
  });

  return null;
}

export function CalloutLayer() {
  return (
    <div
      id="moon-callouts"
      className="pointer-events-none absolute inset-0 z-[12] overflow-hidden transition-opacity duration-150"
    />
  );
}
