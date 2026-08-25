"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useMoonStore } from "@/lib/store/moon-store";

export function useMoonInteraction() {
  const markUserInteracted = useMoonStore((state) => state.markUserInteracted);
  const hasUserInteracted = useMoonStore((state) => state.hasUserInteracted);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      markUserInteracted();
    }
  }, [prefersReducedMotion, markUserInteracted]);

  return {
    hasUserInteracted,
    prefersReducedMotion,
    onPointerDown: markUserInteracted,
  };
}
