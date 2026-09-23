"use client";

import type { PostHog } from "posthog-js";

type QueuedEvent = [event: string, properties?: Record<string, unknown>];

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
const queue: QueuedEvent[] = [];

export function analyticsEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function loadAnalytics() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (typeof window === "undefined" || !key) return Promise.resolve(null);
  loading ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
      });
      client = posthog;
      for (const [event, properties] of queue.splice(0)) posthog.capture(event, properties);
      return posthog;
    })
    .catch(() => {
      loading = null;
      return null;
    });
  return loading;
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!analyticsEnabled()) return;
  if (client) {
    client.capture(event, properties);
    return;
  }
  queue.push([event, properties]);
  void loadAnalytics();
}
