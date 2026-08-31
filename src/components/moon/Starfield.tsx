"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

function seeded(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function paintMilkyWay(canvas: HTMLCanvasElement) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#03040c";
  ctx.fillRect(0, 0, width, height);

  const field = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, width * 0.72);
  field.addColorStop(0, "rgba(18, 22, 48, 0.35)");
  field.addColorStop(1, "rgba(3, 4, 12, 0)");
  ctx.fillStyle = field;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width * 0.5, height * 0.52);
  ctx.rotate(-0.18);

  const disc = ctx.createLinearGradient(0, -height * 0.22, 0, height * 0.22);
  disc.addColorStop(0, "rgba(3, 4, 12, 0)");
  disc.addColorStop(0.28, "rgba(92, 108, 188, 0.28)");
  disc.addColorStop(0.5, "rgba(214, 222, 248, 0.62)");
  disc.addColorStop(0.72, "rgba(118, 82, 168, 0.28)");
  disc.addColorStop(1, "rgba(3, 4, 12, 0)");
  ctx.fillStyle = disc;
  ctx.fillRect(-width, -height * 0.22, width * 2, height * 0.44);

  const core = ctx.createRadialGradient(width * 0.04, 0, 0, width * 0.04, 0, width * 0.38);
  core.addColorStop(0, "rgba(255, 214, 168, 0.55)");
  core.addColorStop(0.18, "rgba(232, 168, 128, 0.28)");
  core.addColorStop(0.45, "rgba(120, 92, 180, 0.14)");
  core.addColorStop(1, "rgba(3, 4, 12, 0)");
  ctx.fillStyle = core;
  ctx.fillRect(-width, -height * 0.28, width * 2, height * 0.56);

  ctx.globalCompositeOperation = "multiply";
  for (let i = 0; i < 7; i += 1) {
    const lane = ctx.createRadialGradient(
      (seeded(i + 2) - 0.5) * width * 0.9,
      (seeded(i + 9) - 0.5) * height * 0.05,
      0,
      (seeded(i + 2) - 0.5) * width * 0.9,
      (seeded(i + 9) - 0.5) * height * 0.05,
      width * (0.12 + seeded(i + 4) * 0.2),
    );
    lane.addColorStop(0, "rgba(8, 8, 14, 0.82)");
    lane.addColorStop(1, "rgba(8, 8, 14, 0)");
    ctx.fillStyle = lane;
    ctx.fillRect(-width, -height * 0.2, width * 2, height * 0.4);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();

  for (let i = 0; i < 4200; i += 1) {
    const u = seeded(i * 3.1);
    const along = seeded(i * 7.7);
    const x = u * width;
    const plane = height * (0.52 - 0.08 * Math.sin(u * Math.PI * 2));
    const y = plane + (along - 0.5) * height * (0.04 + seeded(i * 11) * 0.1);
    const warm = seeded(i * 13) > 0.72;
    ctx.fillStyle = warm ? "rgba(255, 226, 196, 0.55)" : "rgba(226, 234, 255, 0.5)";
    const r = seeded(i * 17) > 0.92 ? 1.2 : 0.55;
    ctx.fillRect(x, y, r, r);
  }
}

function scatterStars(count: number, radiusMin: number, radiusMax: number, plane = false) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
    const theta = Math.random() * Math.PI * 2;
    const phi = plane
      ? Math.PI / 2 + (Math.random() - 0.5) * (0.35 + Math.random() * 0.5)
      : Math.acos(2 * Math.random() - 1);
    const sinPhi = Math.sin(phi);
    positions[index * 3] = radius * sinPhi * Math.cos(theta);
    positions[index * 3 + 1] = radius * sinPhi * Math.sin(theta);
    positions[index * 3 + 2] = radius * Math.cos(phi);
  }
  return positions;
}

export function Starfield() {
  const milkyWay = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1536;
    canvas.height = 768;
    paintMilkyWay(canvas);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }, []);

  const dimStars = useMemo(() => scatterStars(2400, 18, 38, true), []);
  const haloStars = useMemo(() => scatterStars(500, 18, 38, false), []);
  const brightStars = useMemo(() => scatterStars(280, 16, 34, true), []);

  useEffect(() => {
    return () => {
      milkyWay.dispose();
    };
  }, [milkyWay]);

  return (
    <group rotation={[0.42, 0.95, 0.12]}>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[46, 48, 32]} />
        <meshBasicMaterial
          map={milkyWay}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[haloStars, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#9aa8c8"
          size={0.9}
          sizeAttenuation={false}
          transparent
          opacity={0.45}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dimStars, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#d7e2f6"
          size={1.15}
          sizeAttenuation={false}
          transparent
          opacity={0.78}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[brightStars, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#fff4e6"
          size={2.15}
          sizeAttenuation={false}
          transparent
          opacity={0.95}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
