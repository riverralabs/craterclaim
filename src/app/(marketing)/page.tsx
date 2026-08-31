import { HomeHud } from "@/components/layout/HomeHud";
import { LandingOverlay } from "@/components/moon/LandingOverlay";
import { LandingQuery } from "@/components/moon/LandingQuery";
import { MoonSceneLazy } from "@/components/moon/MoonSceneLazy";
import { MoonStill } from "@/components/moon/MoonStill";
import { HomePlotLoader } from "@/components/plot/HomePlotLoader";
import { SelectionPanel } from "@/components/selection/SelectionPanel";
import { Suspense } from "react";
import { preload } from "react-dom";

export default function HomePage() {
  preload("/textures/moon/color.webp", { as: "image", type: "image/webp" });

  return (
    <main className="relative h-dvh overflow-hidden bg-space">
      <HomePlotLoader />
      <MoonStill />
      <MoonSceneLazy />
      <HomeHud featured={null} initialPlots={[]} />
      <SelectionPanel />
      <LandingOverlay />
      <Suspense fallback={null}>
        <LandingQuery />
      </Suspense>
    </main>
  );
}
