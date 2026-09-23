import { Suspense } from "react";
import { preload } from "react-dom";
import { HomeHud } from "@/components/layout/HomeHud";
import { LandingOverlay } from "@/components/moon/LandingOverlay";
import { LandingQuery } from "@/components/moon/LandingQuery";
import { MoonSceneLazy } from "@/components/moon/MoonSceneLazy";
import { MoonStill } from "@/components/moon/MoonStill";
import { PlotHydrator } from "@/components/plot/PlotHydrator";
import { SelectionPanel } from "@/components/selection/SelectionPanel";
import { LUNAR_FEATURES } from "@/lib/moon/regions";
import { firstLanding } from "@/lib/plots/first-landing";
import { listPublicPlots } from "@/lib/plots/inventory";

export const revalidate = 300;

export default async function HomePage() {
  preload("/textures/moon/color.webp", { as: "image", type: "image/webp" });
  const plots = await listPublicPlots();

  return (
    <main className="relative h-dvh overflow-hidden bg-space">
      <PlotHydrator plots={plots} features={LUNAR_FEATURES} />
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
