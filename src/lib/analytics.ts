"use client";

import posthog from "posthog-js";

export function analyticsEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!analyticsEnabled()) return;
  posthog.capture(event, properties);
}
