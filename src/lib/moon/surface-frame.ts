import * as THREE from "three";
import { GRID_HEIGHT, GRID_WIDTH, latLngToVector3 } from "@/lib/moon/coordinates";

const OUTWARD = new THREE.Vector3(0, 0, 1);
const DEG = Math.PI / 180;

export type SurfaceFrame = {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  width: number;
  height: number;
};

export function plotSurfaceFrame(
  plot: {
    centerLatitude: number;
    centerLongitude: number;
    width: number;
    height: number;
  },
  radius = 1.007,
  scale = 0.82,
): SurfaceFrame {
  const center = latLngToVector3(plot.centerLatitude, plot.centerLongitude, radius);
  const position = new THREE.Vector3(center.x, center.y, center.z);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(OUTWARD, position.clone().normalize());
  const lonSpan = (plot.width / GRID_WIDTH) * Math.PI * 2;
  const latSpan = (plot.height / GRID_HEIGHT) * Math.PI;
  const cosLat = Math.max(0.28, Math.abs(Math.cos(plot.centerLatitude * DEG)));
  return {
    position: [position.x, position.y, position.z],
    quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
    width: lonSpan * cosLat * scale,
    height: latSpan * scale,
  };
}
