"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { rememberOwnedId } from "@/lib/plots/local";
import { useMoonStore } from "@/lib/store/moon-store";

export function LandingQuery() {
  const searchParams = useSearchParams();
  const startLanding = useMoonStore((state) => state.startLanding);
  const enterSelectMode = useMoonStore((state) => state.enterSelectMode);
  const plots = useMoonStore((state) => state.plots);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (searchParams.get("select") === "1") enterSelectMode();
  }, [enterSelectMode, searchParams]);

  useEffect(() => {
    const landing = searchParams.get("landing");
    const focus = searchParams.get("focus");
    const id = landing ?? focus;
    if (!id) return;
    if (!plots.some((plot) => plot.id === id)) return;

    const key = `${landing ? "landing" : "focus"}:${id}`;
    if (!seen.current.has(key)) {
      seen.current.add(key);
      if (landing) {
        rememberOwnedId(id);
        const purchaseKey = `cc-purchase-${id}`;
        if (!sessionStorage.getItem(purchaseKey)) {
          sessionStorage.setItem(purchaseKey, "1");
          trackEvent("purchase", { plot_id: id });
        }
      }
      trackEvent("landing_viewed", {
        plot_id: id,
        source: landing ? "checkout" : "focus",
      });
    }

    startLanding(id, Boolean(landing));
  }, [plots, searchParams, startLanding]);

  return null;
}
