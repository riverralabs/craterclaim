"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { CameraController, IDLE_DISTANCE } from "@/components/moon/CameraController";
import { CalloutLayer, CalloutTracker } from "@/components/moon/FeatureCallouts";
import { MoonSphere } from "@/components/moon/MoonSphere";
import { OwnershipLayer } from "@/components/moon/OwnershipLayer";
import { SelectionController } from "@/components/moon/SelectionController";
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
  const camera = useThree((state) => state.camera);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);
  const fillOffset = useMemo(() => new THREE.Vector3(1.4, 1.6, 0.6), []);

  useFrame(() => {
    const key = keyRef.current;
    const fill = fillRef.current;
    if (!key || !fill) return;
    key.position.copy(camera.position);
    fill.position.copy(camera.position).add(fillOffset);
  });

  return (
    <>
      <ambientLight intensity={0.95} />
      <hemisphereLight args={["#f4f6f8", "#8a9098", 0.55]} />
      <directionalLight ref={keyRef} intensity={1.2} color="#fffaf4" />
      <directionalLight ref={fillRef} intensity={0.5} color="#dce2ea" />
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
  const colorUrl = isMobile ? "/textures/moon/color.jpg" : "/textures/moon/color-2k.jpg";
  const segments = isMobile ? 64 : 128;

  return (
    <>
      <MoonLights />
      <MoonSphere segments={segments} colorUrl={colorUrl}>
        <OwnershipLayer />
      </MoonSphere>
      <CalloutTracker
        visible={showLabels}
        avoidRight={avoidRight}
        avoidBottom={avoidBottom}
        hero={hero}
      />
      <CameraController />
      <SelectionController />
      {!isMobile ? (
        <EffectComposer enableNormalPass={false} multisampling={0}>
          <Bloom
            luminanceThreshold={0.42}
            luminanceSmoothing={0.18}
            intensity={0.9}
            mipmapBlur
          />
        </EffectComposer>
      ) : null}
    </>
  );
}

function MoonFallback() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/textures/moon/fallback.jpg"
      alt="The Moon"
      className="h-full w-full object-contain"
    />
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

  const dpr = useMemo<[number, number]>(() => (isMobile ? [1, 1.25] : [1, 1.75]), [isMobile]);

  if (webgl === false) {
    return (
      <div className="absolute inset-0 bg-space">
        <MoonFallback />
      </div>
    );
  }

  if (webgl === null) {
    return <div className="absolute inset-0 bg-space" aria-hidden="true" />;
  }

  return (
    <div className={`absolute inset-0 bg-space ${selectionMode ? "cursor-crosshair touch-none" : isExploring ? "cursor-grab touch-none" : "touch-none"}`}>
      <Canvas
        camera={{ position: [0, -0.08, IDLE_DISTANCE], fov: 38, near: 0.1, far: 40 }}
        dpr={dpr}
        gl={{
          antialias: !isMobile,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.12,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#000000");
        }}
      >
        <Suspense fallback={null}>
          <MoonExperience
            isMobile={isMobile}
            showLabels={(!isMobile || isExploring) && !selectionMode && landingMode === "idle"}
            avoidRight={isExploring || isMobile ? 28 : 348}
            avoidBottom={isExploring || isMobile ? 84 : 28}
            hero={!isExploring && !isMobile}
          />
        </Suspense>
      </Canvas>
      <CalloutLayer />
    </div>
  );
}
