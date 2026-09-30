import type { Metadata } from "next";
import { PlotClientFallback } from "@/components/plot/PlotClientFallback";
import { PlotLanding } from "@/components/plot/PlotLanding";
import { getPublicPlot } from "@/lib/plots/inventory";
import { plotSummary } from "@/lib/worlds";

export const revalidate = 300;

type PlotPageProps = {
  params: Promise<{ plotId: string }>;
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PlotPageProps): Promise<Metadata> {
  const { plotId } = await params;
  const plot = await getPublicPlot(plotId);
  if (!plot) {
    return {
      title: `Plot ${plotId}`,
      description: "A CraterClaim digital plot.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${plot.name ?? plot.id} — CraterClaim`;
  const description =
    plot.description ?? plotSummary(plot);

  return {
    title: plot.name ?? `Plot ${plot.id}`,
    description,
    alternates: { canonical: `/plot/${plot.id}` },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/plot/${plot.id}`,
      images: [
        {
          url: `/plot/${plotId}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${plot.name ?? plot.id} lunar deed`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/plot/${plotId}/opengraph-image`],
    },
  };
}

export default async function PlotPage({ params }: PlotPageProps) {
  const { plotId } = await params;
  const plot = await getPublicPlot(plotId);

  if (plot) {
    return <PlotLanding plot={plot} />;
  }

  return <PlotClientFallback plotId={plotId} />;
}
