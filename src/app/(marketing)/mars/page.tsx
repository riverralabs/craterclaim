import type { Metadata } from "next";
import { Suspense } from "react";
import { preload } from "react-dom";
import { HomeHud } from "@/components/layout/HomeHud";
import { LandingOverlay } from "@/components/moon/LandingOverlay";
import { LandingQuery } from "@/components/moon/LandingQuery";
import { MoonSceneLazy } from "@/components/moon/MoonSceneLazy";
import { MoonStill } from "@/components/moon/MoonStill";
import { PlotHydrator } from "@/components/plot/PlotHydrator";
import { SelectionPanel } from "@/components/selection/SelectionPanel";
import { MARS_FEATURES } from "@/lib/mars/regions";
import { firstLanding } from "@/lib/plots/first-landing";
import { listPublicPlots } from "@/lib/plots/inventory";
import { plotBody } from "@/lib/worlds";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Claim your place on Mars",
  description:
    "Claim a digital Martian plot on a public Mars map. Olympus Mons, Valles Marineris, Hellas, and the rover landing sites are premium.",
  alternates: { canonical: "/mars" },
};

export default async function MarsPage() {
  preload("/textures/mars/color.webp", { as: "image", type: "image/webp" });
  const plots = (await listPublicPlots()).filter((plot) => plotBody(plot) === "mars");

  return (
    <main className="relative h-dvh overflow-hidden bg-space">
      <PlotHydrator plots={plots} features={MARS_FEATURES} body="mars" />
      <MoonStill body="mars" />
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
