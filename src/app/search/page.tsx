import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PlotCard } from "@/components/plot/PlotCard";
import { listLunarFeatures } from "@/lib/moon/features";
import { listPublicPlots } from "@/lib/plots/inventory";
import { searchFeatures, searchPlots } from "@/lib/plots/search";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Find landings and lunar features on CraterClaim.",
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const [plots, features] = await Promise.all([listPublicPlots(), listLunarFeatures()]);
  const plotHits = searchPlots(plots, q);
  const featureHits = searchFeatures(features, q);
  const searched = q.trim().length > 0;

  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">Search</p>
          <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">Find a landing.</h1>
          <form className="mt-6 max-w-lg" action="/search" method="get">
            <label className="block text-sm">
              Plot ID, name, or feature
              <input
                name="q"
                defaultValue={q}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-space/60 px-3 py-2.5 text-sm outline-none focus-visible:border-violet/60"
                placeholder="CLM-1001 or Tranquillitatis"
              />
            </label>
            <button
              type="submit"
              className="mt-3 inline-flex min-h-11 cursor-pointer items-center rounded-lg bg-electric-white px-5 text-sm text-space"
            >
              Search
            </button>
          </form>

          {!searched ? (
            <p className="mt-8 text-lunar-silver">Type a plot ID, name, or mare to search the live map.</p>
          ) : (
            <>
              <h2 className="font-heading mt-10 text-2xl">Landings</h2>
              {plotHits.length === 0 ? (
                <p className="mt-3 text-lunar-silver">No plots match “{q.trim()}”.</p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {plotHits.map((plot) => (
                    <PlotCard
                      key={plot.id}
                      plotId={plot.id}
                      name={plot.name ?? plot.id}
                      sizeLabel={`${plot.width} × ${plot.height} pixels`}
                      featureName={plot.lunarFeature}
                      latitude={plot.centerLatitude}
                      longitude={plot.centerLongitude}
                      claimDate={plot.claimDate ?? plot.createdAt}
                      zone={plot.zone}
                    />
                  ))}
                </div>
              )}

              <h2 className="font-heading mt-10 text-2xl">Features</h2>
              {featureHits.length === 0 ? (
                <p className="mt-3 text-lunar-silver">No features match.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {featureHits.map((feature) => (
                    <li key={feature.id}>
                      <Link
                        href={`/?feature=${feature.id}`}
                        className="flex min-h-11 items-center justify-between rounded-xl border border-white/10 bg-charcoal/70 px-4 py-3 hover:border-white/20"
                      >
                        <span>
                          <span className="block font-heading tracking-[0.08em] uppercase">
                            {feature.name}
                          </span>
                          <span className="text-xs text-lunar-silver">
                            {feature.type}
                            {feature.isPremium ? " · Premium" : ""}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
        <Footer />
      </main>
    </>
  );
}
