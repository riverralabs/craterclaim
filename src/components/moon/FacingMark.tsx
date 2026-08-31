"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import * as THREE from "three";

const world = new THREE.Vector3();
const moonPos = new THREE.Vector3();
const normal = new THREE.Vector3();
const toCam = new THREE.Vector3();
const ndc = new THREE.Vector3();

export function FacingMark({
  local,
  children,
}: {
  local: [number, number, number];
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame(() => {
    const group = ref.current;
    if (!group) return;
    let moon: THREE.Object3D | null = group.parent;
    while (moon && moon.name !== "moonSurface") moon = moon.parent;
    if (!moon) return;
    moon.updateWorldMatrix(true, false);
    moon.getWorldPosition(moonPos);
    world.set(local[0], local[1], local[2]).applyMatrix4(moon.matrixWorld);
    normal.copy(world).sub(moonPos).normalize();
    toCam.copy(camera.position).sub(world).normalize();
    if (normal.dot(toCam) < -0.12) {
      group.visible = false;
      return;
    }
    ndc.copy(world).project(camera);
    group.visible = ndc.z <= 1 && Math.abs(ndc.x) <= 1.2 && Math.abs(ndc.y) <= 1.2;
  });

  return <group ref={ref}>{children}</group>;
}
