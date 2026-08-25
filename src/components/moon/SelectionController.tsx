"use client";

import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { uvToPixel } from "@/lib/moon/coordinates";
import { rectFromCorners } from "@/lib/moon/selection";
import { useMoonStore } from "@/lib/store/moon-store";

export function SelectionController() {
  const { camera, gl, scene } = useThree();
  const selectionMode = useMoonStore((state) => state.selectionMode);
  const setSelection = useMoonStore((state) => state.setSelection);
  const markUserInteracted = useMoonStore((state) => state.markUserInteracted);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const dragging = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const anchor = useRef<{ x: number; y: number } | null>(null);

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

    const onDown = (event: PointerEvent) => {
      if (!useMoonStore.getState().selectionMode) return;
      const cell = pick(event);
      if (!cell) return;
      event.preventDefault();
      markUserInteracted();
      dragging.current = true;
      start.current = cell;
      setSelection(rectFromCorners(cell.x, cell.y, cell.x, cell.y));
      element.setPointerCapture(event.pointerId);
    };

    const onMove = (event: PointerEvent) => {
      if (!dragging.current || !start.current) return;
      const cell = pick(event);
      if (!cell) return;
      setSelection(rectFromCorners(start.current.x, start.current.y, cell.x, cell.y));
    };

    const onUp = (event: PointerEvent) => {
      if (!dragging.current) {
        const cell = pick(event);
        if (!cell || !useMoonStore.getState().selectionMode) return;
        if (anchor.current) {
          setSelection(
            rectFromCorners(anchor.current.x, anchor.current.y, cell.x, cell.y),
          );
          anchor.current = null;
        } else {
          anchor.current = cell;
          setSelection(rectFromCorners(cell.x, cell.y, cell.x, cell.y));
        }
        return;
      }

      dragging.current = false;
      start.current = null;
      anchor.current = null;
      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId);
      }
    };

    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onUp);

    return () => {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
    };
  }, [camera, gl, markUserInteracted, pointer, raycaster, scene, setSelection]);

  useEffect(() => {
    if (!selectionMode) {
      dragging.current = false;
      start.current = null;
      anchor.current = null;
    }
  }, [selectionMode]);

  return null;
}
