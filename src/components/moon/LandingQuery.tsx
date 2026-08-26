"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useMoonStore } from "@/lib/store/moon-store";

export function LandingQuery() {
  const searchParams = useSearchParams();
  const startLanding = useMoonStore((state) => state.startLanding);
  const enterSelectMode = useMoonStore((state) => state.enterSelectMode);
  const plots = useMoonStore((state) => state.plots);

  useEffect(() => {
    if (searchParams.get("select") === "1") enterSelectMode();
  }, [enterSelectMode, searchParams]);

  useEffect(() => {
    const landing = searchParams.get("landing");
    const focus = searchParams.get("focus");
    const id = landing ?? focus;
    if (!id) return;
    if (!plots.some((plot) => plot.id === id)) return;
    startLanding(id, Boolean(landing));
  }, [plots, searchParams, startLanding]);

  return null;
}
