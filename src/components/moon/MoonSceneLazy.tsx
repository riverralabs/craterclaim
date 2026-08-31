"use client";

import nextDynamic from "next/dynamic";

export const MoonSceneLazy = nextDynamic(
  () => import("@/components/moon/MoonScene").then((mod) => mod.MoonScene),
  { ssr: false },
);
