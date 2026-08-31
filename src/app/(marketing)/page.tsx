import { Suspense } from "react";
import { preload } from "react-dom";
import { HomeHud } from "@/components/layout/HomeHud";
import { LandingOverlay } from "@/components/moon/LandingOverlay";
import { LandingQuery } from "@/components/moon/LandingQuery";
import { MoonSceneLazy } from "@/components/moon/MoonSceneLazy";
import { MoonStill } from "@/components/moon/MoonStill";
import { PlotHydrator } from "@/components/plot/PlotHydrator";
import { SelectionPanel } from "@/components/selection/SelectionPanel";
import { listActivePlots } from "@/lib/plots/inventory";
import { listLunarFeatures } from "@/lib/moon/features";
import { firstLanding } from "@/lib/plots/first-landing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  preload("/textures/moon/color.webp", { as: "image", type: "image/webp" });
  const [plots, features] = await Promise.all([listActivePlots(), listLunarFeatures()]);

  return (
    <main className="relative h-dvh overflow-hidden bg-space">
      <PlotHydrator plots={plots} features={features} />
      <MoonStill />
      <MoonSceneLazy />
      <HomeHud featured={firstLanding(plots)} initialPlots={plots} />
      <SelectionPanel />
      <LandingOverlay />
      <Suspense fallback={null}>
        <LandingQuery />
      </Suspense>
    </main>
  );
}
