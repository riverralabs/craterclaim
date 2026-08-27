"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CameraController, IDLE_DISTANCE } from "@/components/moon/CameraController";
import { CalloutLayer, CalloutTracker } from "@/components/moon/FeatureCallouts";
import { MoonSphere } from "@/components/moon/MoonSphere";
import { OwnershipLayer } from "@/components/moon/OwnershipLayer";
import { PlotGlowLayer } from "@/components/moon/PlotGlowLayer";
import { PlotLogoLayer } from "@/components/moon/PlotLogoLayer";
import { PlotInspectController } from "@/components/moon/PlotInspectController";
import { PlotHoverCard } from "@/components/moon/PlotHoverCard";
import { SelectionController } from "@/components/moon/SelectionController";
import { Starfield } from "@/components/moon/Starfield";
import { MoonMap2D } from "@/components/moon/MoonMap2D";
import { useMoonInteraction } from "@/hooks/useMoonInteraction";
import { useMoonStore } from "@/lib/store/moon-store";

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function MoonLights() {
  const key = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const wrap = useRef<THREE.DirectionalLight>(null);
  const { camera } = useThree();

  useFrame(() => {
    const { x, y, z } = camera.position;
    key.current?.position.set(x, y, z);
    fill.current?.position.set(x - 2.4, y + 0.8, z + 0.6);
    wrap.current?.position.set(x + 2.2, y - 0.6, z + 0.5);
  });

  return (
    <>
      <ambientLight intensity={0.28} color="#8a909a" />
      <hemisphereLight args={["#d4dae4", "#353028", 0.38]} />
      <directionalLight ref={key} intensity={0.55} color="#fff1d8" />
      <directionalLight ref={fill} intensity={0.32} color="#c5ccd6" />
      <directionalLight ref={wrap} intensity={0.26} color="#e8d4b4" />
    </>
  );
}

function MoonExperience({
  isMobile,
  showLabels,
  avoidRight,
  avoidBottom,
  hero,
}: {
  isMobile: boolean;
  showLabels: boolean;
  avoidRight: number;
  avoidBottom: number;
  hero: boolean;
}) {
  const colorUrl = isMobile ? "/textures/moon/color.webp" : "/textures/moon/color-2k.webp";
  const segments = isMobile ? 40 : 72;

  return (
    <>
      <Starfield />
      <MoonLights />
      <MoonSphere segments={segments} colorUrl={colorUrl}>
        <OwnershipLayer segments={segments} />
        <PlotGlowLayer />
        <PlotLogoLayer />
      </MoonSphere>
      <CalloutTracker
        visible={showLabels}
        avoidRight={avoidRight}
        avoidBottom={avoidBottom}
        hero={hero}
        compact={isMobile}
      />
      <CameraController />
      <SelectionController />
      <PlotInspectController />
    </>
  );
}

export function MoonScene() {
  useMoonInteraction();
  const isExploring = useMoonStore((state) => state.isExploring);
  const selectionMode = useMoonStore((state) => state.selectionMode);
  const landingMode = useMoonStore((state) => state.landingMode);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setWebgl(hasWebGL());
    const media = window.matchMedia("(max-width: 767px)");
    setIsMobile(media.matches);
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const dpr = useMemo<[number, number]>(() => (isMobile ? [1, 1.15] : [1, 1.35]), [isMobile]);

  if (webgl === false) {
    return (
      <div className="absolute inset-0 bg-space">
        <MoonMap2D />
        <PlotHoverCard />
      </div>
    );
  }

  if (webgl === null) {
    return <div className="absolute inset-0 bg-space" aria-hidden="true" />;
  }

  return (
    <div className={`absolute inset-0 bg-space ${selectionMode ? "cursor-crosshair touch-none" : isExploring ? "cursor-grab touch-none" : "touch-none"}`}>
      <Canvas
        camera={{ position: [0, -0.08, IDLE_DISTANCE], fov: 38, near: 0.1, far: 90 }}
        dpr={dpr}
        performance={{ min: 0.5, max: 1, debounce: 200 }}
        gl={{
          antialias: !isMobile,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.96,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#05060e");
        }}
      >
        <Suspense fallback={null}>
          <MoonExperience
            isMobile={isMobile}
            showLabels={!selectionMode && landingMode === "idle"}
            avoidRight={isExploring || isMobile ? 28 : 348}
            avoidBottom={isMobile ? (isExploring ? 132 : 168) : isExploring ? 84 : 28}
            hero={!isExploring && !isMobile}
          />
        </Suspense>
      </Canvas>
      <CalloutLayer />
      <PlotHoverCard />
    </div>
  );
}
