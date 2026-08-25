import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PlotDirectory } from "@/components/plot/PlotDirectory";
import { listActivePlots } from "@/lib/plots/inventory";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Largest, most invested, recent, and pioneer landings on CraterClaim.",
};

export default async function LeaderboardPage() {
  const plots = await listActivePlots();

  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">
            Leaderboard
          </p>
          <div className="mt-3">
            <PlotDirectory initialPlots={plots} mode="leaderboard" />
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
