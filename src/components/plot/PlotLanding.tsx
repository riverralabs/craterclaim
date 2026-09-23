import { LandingViewed } from "@/components/analytics/LandingViewed";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PlotCard } from "@/components/plot/PlotCard";
import { SharePlotButton } from "@/components/plot/SharePlotButton";
import { formatUsd } from "@/lib/moon/pricing";
import { formatSocial } from "@/lib/plots/social";
import { siteOrigin } from "@/lib/seo/site";
import type { PlotRecord } from "@/types";

export function PlotLanding({ plot }: { plot: PlotRecord }) {
  const site = siteOrigin();
  const name = plot.name ?? plot.id;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name,
    url: `${site}/plot/${plot.id}`,
    description:
      plot.description ?? `A ${plot.zone} digital lunar plot near ${plot.lunarFeature}.`,
    identifier: plot.id,
    dateCreated: plot.claimDate ?? plot.createdAt,
    image: `${site}/plot/${plot.id}/opengraph-image`,
    isPartOf: { "@type": "WebSite", name: "CraterClaim", url: site },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingViewed plotId={plot.id} />
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-[22.5rem] flex-1 px-4 pb-16 sm:px-0">
          {plot.description ? (
            <p className="mb-4 text-center text-sm leading-relaxed text-lunar-silver">{plot.description}</p>
          ) : null}
          {plot.socialHandle ? (
            <p className="mb-4 text-center font-mono text-xs tracking-[0.18em] text-gold uppercase">
              {formatSocial(plot.socialHandle)}
            </p>
          ) : null}
          <PlotCard
            plotId={plot.id}
            name={plot.name ?? "Untitled landing"}
            sizeLabel={`${plot.width} × ${plot.height} px`}
            featureName={plot.lunarFeature}
            latitude={plot.centerLatitude}
            longitude={plot.centerLongitude}
            claimDate={plot.claimDate ?? plot.createdAt}
            zone={plot.zone}
            logoUrl={plot.logoUrl}
            websiteUrl={plot.websiteUrl}
            valueLabel={formatUsd(plot.pricePaid ?? plot.quotedPrice)}
            variant="panel"
          />
          <SharePlotButton
            plotId={plot.id}
            name={plot.name ?? plot.id}
            className="mt-3 w-full"
          />
        </div>
        <Footer />
      </main>
    </>
  );
}
