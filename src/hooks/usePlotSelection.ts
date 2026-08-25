"use client";

import { useMoonStore } from "@/lib/store/moon-store";

export function usePlotSelection() {
  const selectionMode = useMoonStore((state) => state.selectionMode);
  const selection = useMoonStore((state) => state.selection);
  const enterSelectMode = useMoonStore((state) => state.enterSelectMode);
  const exitSelectMode = useMoonStore((state) => state.exitSelectMode);

  return {
    selectionMode,
    selection,
    enterSelectMode,
    exitSelectMode,
  };
}
