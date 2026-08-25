"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useMoonStore } from "@/lib/store/moon-store";

export const IDLE_DISTANCE = 4.32;
const EXPLORE_DISTANCE = 2.82;
const PULLBACK_DISTANCE = 3.35;
const LANDING_DISTANCE = 1.58;

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const setInteracting = useMoonStore((state) => state.setInteracting);
  const setLandingMode = useMoonStore((state) => state.setLandingMode);
  const isExploring = useMoonStore((state) => state.isExploring);
  const selectionMode = useMoonStore((state) => state.selectionMode);
  const landingMode = useMoonStore((state) => state.landingMode);
  const landingPlotId = useMoonStore((state) => state.landingPlotId);
  const plots = useMoonStore((state) => state.plots);
  const pullInRef = useRef(false);
  const pullbackDone = useRef(false);
  const desired = useRef(new THREE.Vector3());

  const landingPlot = plots.find((plot) => plot.id === landingPlotId) ?? null;
  const flying = landingMode === "flying" && Boolean(landingPlot);
  const canOrbit = isExploring && !selectionMode && landingMode === "idle";
  const canZoom = isExploring && landingMode === "idle";

  useEffect(() => {
    if (isExploring && landingMode === "idle") {
      pullInRef.current = true;
    }
  }, [isExploring, landingMode]);

  useEffect(() => {
    if (landingMode === "flying") {
      pullbackDone.current = false;
    }
  }, [landingMode, landingPlotId]);

  useEffect(() => {
    if (landingMode !== "arrived") return;
    const controls = controlsRef.current;
    camera.position.set(0, 0, LANDING_DISTANCE);
    camera.lookAt(0, 0, 0);
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [camera, landingMode]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const dt = Math.min(delta, 0.05);

    if (flying) {
      pullInRef.current = false;
      const targetDistance = pullbackDone.current ? LANDING_DISTANCE : PULLBACK_DISTANCE;
      desired.current.set(0, 0, targetDistance);
      camera.position.lerp(desired.current, 1 - Math.pow(0.08, dt * 60));
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();

      const distance = camera.position.length();
      if (!pullbackDone.current && Math.abs(distance - PULLBACK_DISTANCE) < 0.06) {
        pullbackDone.current = true;
      }
      if (pullbackDone.current && Math.abs(distance - LANDING_DISTANCE) < 0.03) {
        camera.position.set(0, 0, LANDING_DISTANCE);
        camera.lookAt(0, 0, 0);
        setLandingMode("arrived");
      }
      return;
    }

    if (!pullInRef.current) return;
    const distance = camera.position.length();
    if (distance <= EXPLORE_DISTANCE + 0.02) {
      pullInRef.current = false;
      return;
    }
    const next = THREE.MathUtils.lerp(distance, EXPLORE_DISTANCE, 1 - Math.pow(0.12, dt * 60));
    camera.position.setLength(next);
    controls.update();
  });

  const lockCamera = landingMode === "flying" || landingMode === "confirmed";

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={!lockCamera && canOrbit}
      dampingFactor={0.08}
      enablePan={false}
      minDistance={1.4}
      maxDistance={5.6}
      enableRotate={canOrbit && !lockCamera}
      enableZoom={canZoom && !lockCamera}
      rotateSpeed={0.55}
      zoomSpeed={0.75}
      onStart={() => {
        if (!isExploring) return;
        setInteracting(true);
      }}
      onEnd={() => setInteracting(false)}
    />
  );
}
