"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { uvToPixel } from "@/lib/moon/coordinates";
import { findPlotNearPixel } from "@/lib/plots/overlap";
import { useMoonStore } from "@/lib/store/moon-store";
import { plotHoverPointer } from "@/components/moon/PlotHoverCard";

const CLICK_PX = 8;

export function PlotInspectController() {
  const { camera, gl, scene } = useThree();
  const startLanding = useMoonStore((state) => state.startLanding);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const down = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = gl.domElement;

    const pick = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const moon = scene.getObjectByName("moonSurface");
      if (!moon) return null;
      const hit = raycaster.intersectObject(moon, false)[0];
      if (!hit?.uv) return null;
      return uvToPixel(hit.uv.x, 1 - hit.uv.y);
    };

    const plotUnder = (event: PointerEvent) => {
      const cell = pick(event);
      if (!cell) return null;
      const { plots } = useMoonStore.getState();
      const radius = Math.min(56, Math.max(10, Math.round(camera.position.length() * 12)));
      return findPlotNearPixel(cell.x, cell.y, plots, radius);
    };

    const canInspect = () => {
      const { selectionMode, landingMode } = useMoonStore.getState();
      return !selectionMode && landingMode !== "confirmed" && landingMode !== "flying";
    };

    const onDown = (event: PointerEvent) => {
      if (!canInspect()) return;
      down.current = { x: event.clientX, y: event.clientY };
    };

    const onMove = (event: PointerEvent) => {
      if (!canInspect()) {
        element.style.cursor = "";
        useMoonStore.getState().setHoverPlot(null);
        return;
      }
      const plot = plotUnder(event);
      plotHoverPointer.x = event.clientX;
      plotHoverPointer.y = event.clientY;
      element.style.cursor = plot ? "pointer" : "";
      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        useMoonStore.getState().setHoverPlot(null);
        return;
      }
      useMoonStore.getState().setHoverPlot(plot?.id ?? null);
    };

    const onUp = (event: PointerEvent) => {
      const origin = down.current;
      down.current = null;
      if (!origin || !canInspect()) return;
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (dx * dx + dy * dy > CLICK_PX * CLICK_PX) return;
      const plot = plotUnder(event);
      if (!plot) return;
      const { landingPlotId, landingMode } = useMoonStore.getState();
      if (landingMode === "arrived" && landingPlotId === plot.id) return;
      startLanding(plot.id, false);
    };

    const onLeave = () => {
      down.current = null;
      element.style.cursor = "";
      useMoonStore.getState().setHoverPlot(null);
    };

    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointerleave", onLeave);

    return () => {
      element.style.cursor = "";
      useMoonStore.getState().setHoverPlot(null);
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointerleave", onLeave);
    };
  }, [camera, gl, pointer, raycaster, scene, startLanding]);

  return null;
}
