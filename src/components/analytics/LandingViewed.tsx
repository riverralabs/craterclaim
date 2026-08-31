"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function LandingViewed({ plotId }: { plotId: string }) {
  useEffect(() => {
    trackEvent("landing_viewed", { plot_id: plotId, source: "plot_page" });
  }, [plotId]);

  return null;
}
