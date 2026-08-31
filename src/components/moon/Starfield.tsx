"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

function paintNebula(canvas: HTMLCanvasElement) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#05060e";
  ctx.fillRect(0, 0, width, height);

  const nebulae = [
    { x: width * 0.2, y: height * 0.4, r: width * 0.36, color: "rgba(78, 58, 140, 0.32)" },
    { x: width * 0.76, y: height * 0.34, r: width * 0.4, color: "rgba(32, 64, 132, 0.28)" },
    { x: width * 0.54, y: height * 0.6, r: width * 0.24, color: "rgba(150, 104, 58, 0.1)" },
  ];
  for (const nebula of nebulae) {
    const glow = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.r);
    glow.addColorStop(0, nebula.color);
    glow.addColorStop(1, "rgba(5, 6, 14, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.save();
  ctx.globalAlpha = 0.16;
  const band = ctx.createLinearGradient(0, height * 0.4, 0, height * 0.62);
  band.addColorStop(0, "rgba(5, 6, 14, 0)");
  band.addColorStop(0.5, "rgba(176, 192, 232, 0.7)");
  band.addColorStop(1, "rgba(5, 6, 14, 0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, height * 0.36, width, height * 0.3);
  ctx.restore();
}

function scatterStars(count: number, radiusMin: number, radiusMax: number) {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    const radius = radiusMin + Math.random() * (radiusMax - radiusMin);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const sinPhi = Math.sin(phi);
    positions[index * 3] = radius * sinPhi * Math.cos(theta);
    positions[index * 3 + 1] = radius * sinPhi * Math.sin(theta);
    positions[index * 3 + 2] = radius * Math.cos(phi);
  }
  return positions;
}

export function Starfield() {
  const nebula = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    paintNebula(canvas);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }, []);

  const dimStars = useMemo(() => scatterStars(1600, 18, 38), []);
  const brightStars = useMemo(() => scatterStars(220, 16, 34), []);

  useEffect(() => {
    return () => {
      nebula.dispose();
    };
  }, [nebula]);

  return (
    <group>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[46, 32, 24]} />
        <meshBasicMaterial
          map={nebula}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dimStars, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#d7e2f6"
          size={1.15}
          sizeAttenuation={false}
          transparent
          opacity={0.72}
          depthWrite={false}
          toneMapped={false}
        />
      </points>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[brightStars, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#f4f7ff"
          size={2.05}
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
