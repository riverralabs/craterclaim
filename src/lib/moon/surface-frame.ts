import * as THREE from "three";
import { GRID_HEIGHT, GRID_WIDTH, latLngToVector3, pixelToLatLng } from "@/lib/moon/coordinates";

const DEG = Math.PI / 180;
const WORLD_UP = new THREE.Vector3(0, 1, 0);
const east = new THREE.Vector3();
const north = new THREE.Vector3();
const normal = new THREE.Vector3();
const position = new THREE.Vector3();
const basis = new THREE.Matrix4();
const quaternion = new THREE.Quaternion();

export type SurfaceFrame = {
  position: [number, number, number];
  quaternion: [number, number, number, number];
  width: number;
  height: number;
};

/**
 * Tangent frame at a plot: +X east (increasing longitude), +Y north, +Z outward.
 * Used for glows. Logos use plotSurfaceGeometry so they follow the grid rectangle.
 */
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
  position.set(center.x, center.y, center.z);
  normal.copy(position).normalize();
  east.crossVectors(WORLD_UP, normal);
  if (east.lengthSq() < 1e-8) {
    east.set(1, 0, 0);
  } else {
    east.normalize();
  }
  north.crossVectors(normal, east).normalize();
  basis.makeBasis(east, north, normal);
  quaternion.setFromRotationMatrix(basis);

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

/** Mesh that sits on the sphere over the plot's grid rectangle. */
export function plotSurfaceGeometry(
  plot: { x: number; y: number; width: number; height: number },
  radius = 1.007,
  segmentsW = 8,
  segmentsH = 4,
) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const cols = segmentsW + 1;

  for (let row = 0; row <= segmentsH; row += 1) {
    const py = plot.y + (plot.height * row) / segmentsH;
    for (let col = 0; col <= segmentsW; col += 1) {
      const px = plot.x + (plot.width * col) / segmentsW;
      const { lat, lng } = pixelToLatLng(px, py);
      const point = latLngToVector3(lat, lng, radius);
      positions.push(point.x, point.y, point.z);
      uvs.push(col / segmentsW, 1 - row / segmentsH);
    }
  }

  for (let row = 0; row < segmentsH; row += 1) {
    for (let col = 0; col < segmentsW; col += 1) {
      const a = row * cols + col;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
