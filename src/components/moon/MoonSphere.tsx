"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { latLngToVector3 } from "@/lib/moon/coordinates";
import { useMoonStore } from "@/lib/store/moon-store";

const IDLE_RAD_PER_SEC = 0.015;
export const NEAR_SIDE_YAW = -Math.PI / 2;

type MoonSphereProps = {
  segments: number;
  colorUrl: string;
  onReady?: () => void;
  children?: React.ReactNode;
};

export function MoonSphere({ segments, colorUrl, onReady, children }: MoonSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const oriented = useRef(false);
  const landingStarted = useRef(false);
  const landingSettled = useRef(false);
  const selectionMode = useMoonStore((state) => state.selectionMode);
  const landingMode = useMoonStore((state) => state.landingMode);
  const landingPlotId = useMoonStore((state) => state.landingPlotId);
  const hoverPlotId = useMoonStore((state) => state.hoverPlotId);
  const viewResetAt = useMoonStore((state) => state.viewResetAt);
  const plots = useMoonStore((state) => state.plots);
  const reducedMotion = usePrefersReducedMotion();
  const colorMap = useTexture(colorUrl);
  const { camera } = useThree();
  const [lod, setLod] = useState(segments);
  const materialRef = useRef<THREE.MeshLambertMaterial>(null);
  const targetQuat = useRef(new THREE.Quaternion());
  const localDir = useRef(new THREE.Vector3());
  const faceDir = useRef(new THREE.Vector3(0, 0, 1));
  const holdQuat = useRef(new THREE.Quaternion());

  const landingPlot = plots.find((plot) => plot.id === landingPlotId) ?? null;
  const landing = Boolean(landingPlot && landingMode !== "idle");
  const autoRotate = !selectionMode && landingMode === "idle" && !reducedMotion && !hoverPlotId;

  useLayoutEffect(() => {
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = 4;
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.minFilter = THREE.LinearMipmapLinearFilter;
  }, [colorMap]);

  useLayoutEffect(() => {
    onReady?.();
  }, [colorMap, onReady]);

  useLayoutEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "float dotNL = saturate( dot( geometryNormal, directLight.direction ) );",
        "float dotNL = saturate( dot( geometryNormal, directLight.direction ) * 0.55 + 0.45 );",
      );
    };
    material.needsUpdate = true;
  }, []);

  useEffect(() => {
    landingStarted.current = false;
    landingSettled.current = false;
  }, [landingPlotId]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || viewResetAt === 0) return;
    mesh.quaternion.identity();
    mesh.rotation.set(0, NEAR_SIDE_YAW, 0);
    oriented.current = true;
  }, [viewResetAt]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05);
    const distance = camera.position.length();
    const nextLod =
      distance > 4.2 ? Math.min(segments, 32) : distance > 2.6 ? Math.min(segments, 56) : segments;
    if (nextLod !== lod) setLod(nextLod);

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
    if (autoRotate) {
      mesh.rotation.y += IDLE_RAD_PER_SEC * dt;
    }
  });

  return (
    <mesh ref={meshRef} name="moonSurface">
      <sphereGeometry args={[1, lod, lod]} />
      <meshLambertMaterial
        ref={materialRef}
        map={colorMap}
        color="#f0ece6"
        emissive="#ffffff"
        emissiveMap={colorMap}
        emissiveIntensity={0.18}
      />
      {children}
    </mesh>
  );
}
