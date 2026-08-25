"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { latLngToVector3 } from "@/lib/moon/coordinates";
import { PREMIUM_FEATURES } from "@/lib/moon/regions";
import type { LunarFeature } from "@/types";

export type CalloutPin = {
  id: string;
  title: string;
  subtitle: string;
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

function captionFor(feature: LunarFeature) {
  if (feature.type === "pole") return "Rare opportunity";
  if (feature.type === "crater") return "Landmark";
  return "Premium zone";
}

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

function paintCallouts(pins: CalloutPin[]) {
  const root = document.getElementById("moon-callouts");
  if (!root) return;
  root.dataset.count = String(pins.length);
  const groups = pins
    .map((pin) => {
      const bracket =
        pin.side === "right"
          ? `M ${pin.labelX} ${pin.labelY - 16} L ${pin.labelX} ${pin.labelY + 16} L ${pin.labelX + 18} ${pin.labelY + 16}`
          : `M ${pin.labelX} ${pin.labelY - 16} L ${pin.labelX} ${pin.labelY + 16} L ${pin.labelX - 18} ${pin.labelY + 16}`;
      return `<g filter="url(#callout-glow)">
          <circle cx="${pin.x}" cy="${pin.y}" r="5.5" fill="none" stroke="#e0b84f" stroke-width="1.15" />
          <circle cx="${pin.x}" cy="${pin.y}" r="1.7" fill="#e0b84f" />
          <circle cx="${pin.exitX}" cy="${pin.exitY}" r="2.2" fill="#e0b84f" />
          <circle cx="${pin.jointX}" cy="${pin.jointY}" r="2.2" fill="#e0b84f" />
          <path d="${elbowPath(pin)}" fill="none" stroke="#e0b84f" stroke-width="1.15" />
          <path d="${bracket}" fill="none" stroke="#e0b84f" stroke-width="1.15" />
        </g>`;
    })
    .join("");
  const labels = pins
    .map((pin) => {
      const transform =
        pin.side === "left" ? "translate(calc(-100% - 10px), -50%)" : "translate(12px, -50%)";
      return `<div data-callout="true" style="position:absolute;left:${pin.labelX}px;top:${pin.labelY}px;transform:${transform};white-space:nowrap">
          <p style="margin:0;font-family:Syne,ui-sans-serif,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.2em;color:#f4f6f8;text-transform:uppercase;line-height:1.15">${escapeHtml(pin.title)}</p>
          <p style="margin:2px 0 0;font-family:'Geist Mono',ui-monospace,monospace;font-size:8px;letter-spacing:0.28em;color:#e0b84f;text-transform:uppercase;line-height:1">${escapeHtml(pin.subtitle)}</p>
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
) {
  const gap = 70;
  const ring = moonR + gap;
  const minR = moonR + 48;
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
  const minSep = 92;

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
}: {
  visible: boolean;
  avoidRight: number;
  avoidBottom: number;
  hero: boolean;
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
  const locals = useRef(
    PREMIUM_FEATURES.map((feature) => ({
      feature,
      local: latLngToVector3(feature.centerLat, feature.centerLng, 1.002),
    })),
  );

  useFrame(() => {
    if (!visible) {
      if (last.current.length) {
        last.current = [];
        paintCallouts([]);
      }
      return;
    }

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
    for (const entry of locals.current) {
      world.current.set(entry.local.x, entry.local.y, entry.local.z).applyMatrix4(moon.matrixWorld);
      normal.current.copy(world.current).sub(moonPos.current).normalize();
      toCam.current.copy(camera.position).sub(world.current).normalize();
      if (normal.current.dot(toCam.current) < -0.22) continue;
      ndc.current.copy(world.current).project(camera);
      if (ndc.current.z > 1) continue;
      const x = (ndc.current.x * 0.5 + 0.5) * width;
      const y = (-ndc.current.y * 0.5 + 0.5) * height;
      if (Math.hypot(x - cx, y - cy) > moonR + 8) continue;
      facing.push({
        id: entry.feature.id,
        title: entry.feature.name,
        subtitle: captionFor(entry.feature),
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

    layoutPins(facing, cx, cy, moonR, width, height, avoidRight, avoidBottom, hero);
    const placed = facing.filter(
      (pin) =>
        Math.hypot(pin.labelX - cx, pin.labelY - cy) >= moonR + 40 &&
        Math.hypot(pin.labelX - pin.x, pin.labelY - pin.y) > 28,
    );

    const root = document.getElementById("moon-callouts");
    if (root) {
      root.dataset.count = String(placed.length);
    }

    if (samePins(last.current, placed)) {
      const root = document.getElementById("moon-callouts");
      if (root && root.dataset.count === String(placed.length) && root.querySelector("[data-callout], circle")) {
        return;
      }
    }
    last.current = placed;
    paintCallouts(placed);
  });

  return null;
}

export function CalloutLayer() {
  return (
    <div
      id="moon-callouts"
      className="pointer-events-none absolute inset-0 z-[12] overflow-hidden"
    />
  );
}
