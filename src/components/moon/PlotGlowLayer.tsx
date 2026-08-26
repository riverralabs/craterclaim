"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { plotSurfaceFrame } from "@/lib/moon/surface-frame";
import { useMoonStore } from "@/lib/store/moon-store";
import type { PlotRecord } from "@/types";

function makeGlowTexture(inner: string, mid: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(0.35, mid);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function HeldGlow({
  plot,
  pulse,
  texture,
  reducedMotion,
}: {
  plot: PlotRecord;
  pulse: boolean;
  texture: THREE.Texture;
  reducedMotion: boolean;
}) {
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const frame = plotSurfaceFrame(plot, 1.005, 1.6);

  useFrame(({ clock }) => {
    if (!material.current) return;
    if (reducedMotion) {
      material.current.opacity = pulse ? 0.58 : 0.34;
      return;
    }
    const t = clock.elapsedTime;
    const idle = 0.3 + 0.12 * (0.5 + 0.5 * Math.sin(t * 1.7 + plot.x * 0.02));
    const burst = pulse ? 0.26 + 0.22 * (0.5 + 0.5 * Math.sin(t * 5.4)) : 0;
    material.current.opacity = Math.min(0.88, idle + burst);
  });

  return (
    <mesh
      position={frame.position}
      quaternion={frame.quaternion}
      renderOrder={2}
      raycast={() => undefined}
    >
      <planeGeometry args={[frame.width, frame.height]} />
      <meshBasicMaterial
        ref={material}
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export function PlotGlowLayer() {
  const plots = useMoonStore((state) => state.plots);
  const landingPlotId = useMoonStore((state) => state.landingPlotId);
  const landingMode = useMoonStore((state) => state.landingMode);
  const landingCinematic = useMoonStore((state) => state.landingCinematic);
  const reducedMotion = usePrefersReducedMotion();

  const textures = useMemo(
    () => ({
      premium: makeGlowTexture("rgba(255, 232, 170, 0.95)", "rgba(224, 184, 79, 0.55)"),
      standard: makeGlowTexture("rgba(236, 244, 255, 0.9)", "rgba(154, 216, 255, 0.42)"),
    }),
    [],
  );

  useEffect(() => {
    return () => {
      textures.premium?.dispose();
      textures.standard?.dispose();
    };
  }, [textures]);

  const held = useMemo(
    () => plots.filter((plot) => plot.status === "active"),
    [plots],
  );

  const acquiring = landingCinematic && landingMode !== "idle";

  return (
    <group>
      {held.map((plot) => {
        const texture = plot.zone === "premium" ? textures.premium : textures.standard;
        if (!texture) return null;
        return (
          <HeldGlow
            key={plot.id}
            plot={plot}
            texture={texture}
            reducedMotion={reducedMotion}
            pulse={acquiring && plot.id === landingPlotId}
          />
        );
      })}
    </group>
  );
}
