"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { latLngToVector3 } from "@/lib/moon/coordinates";
import { useMoonStore } from "@/lib/store/moon-store";

const IDLE_RAD_PER_SEC = 0.015;
const NEAR_SIDE_YAW = -Math.PI / 2;

type MoonSphereProps = {
  segments: number;
  colorUrl: string;
  children?: React.ReactNode;
};

export function MoonSphere({ segments, colorUrl, children }: MoonSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const oriented = useRef(false);
  const landingStarted = useRef(false);
  const landingSettled = useRef(false);
  const hasUserInteracted = useMoonStore((state) => state.hasUserInteracted);
  const isExploring = useMoonStore((state) => state.isExploring);
  const landingMode = useMoonStore((state) => state.landingMode);
  const landingPlotId = useMoonStore((state) => state.landingPlotId);
  const plots = useMoonStore((state) => state.plots);
  const colorMap = useTexture(colorUrl);
  const targetQuat = useRef(new THREE.Quaternion());
  const localDir = useRef(new THREE.Vector3());
  const faceDir = useRef(new THREE.Vector3(0, 0, 1));
  const holdQuat = useRef(new THREE.Quaternion());

  const landingPlot = plots.find((plot) => plot.id === landingPlotId) ?? null;
  const landing = Boolean(landingPlot && landingMode !== "idle");

  useLayoutEffect(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = 8;
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.minFilter = THREE.LinearMipmapLinearFilter;
  }, [colorMap]);

  useEffect(() => {
    landingStarted.current = false;
    landingSettled.current = false;
  }, [landingPlotId]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);

    if (landing && landingPlot) {
      const local = latLngToVector3(
        landingPlot.centerLatitude,
        landingPlot.centerLongitude,
        1,
      );
      localDir.current.set(local.x, local.y, local.z).normalize();
      targetQuat.current.setFromUnitVectors(localDir.current, faceDir.current);

      if (landingSettled.current) return;

      if (!landingStarted.current) {
        holdQuat.current.copy(mesh.quaternion);
        mesh.rotation.set(0, 0, 0);
        mesh.quaternion.copy(holdQuat.current);
        landingStarted.current = true;
      }

      if (landingMode === "arrived") {
        mesh.quaternion.copy(targetQuat.current);
        landingSettled.current = true;
        return;
      }

      mesh.quaternion.slerp(targetQuat.current, 1 - Math.pow(0.08, dt * 60));
      if (mesh.quaternion.angleTo(targetQuat.current) < 0.004) {
        mesh.quaternion.copy(targetQuat.current);
        landingSettled.current = true;
      }
      return;
    }

    landingStarted.current = false;
    landingSettled.current = false;

    if (!oriented.current) {
      mesh.rotation.y = NEAR_SIDE_YAW;
      oriented.current = true;
    }
    if (!isExploring && landingMode === "idle" && !hasUserInteracted) {
      mesh.rotation.y += IDLE_RAD_PER_SEC * dt;
    }
  });

  return (
    <mesh ref={meshRef} name="moonSurface">
      <sphereGeometry args={[1, segments, segments]} />
      <meshBasicMaterial map={colorMap} toneMapped={false} />
      {children}
    </mesh>
  );
}
