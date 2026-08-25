import type { Metadata } from "next";
import { PlotClientFallback } from "@/components/plot/PlotClientFallback";
import { PlotLanding } from "@/components/plot/PlotLanding";
import { getPlot } from "@/lib/plots/inventory";

export const dynamic = "force-dynamic";

type PlotPageProps = {
  params: Promise<{ plotId: string }>;
};

export async function generateMetadata({ params }: PlotPageProps): Promise<Metadata> {
  const { plotId } = await params;
  const plot = await getPlot(plotId);
  if (!plot || plot.status !== "active") {
    return {
      title: `Plot ${plotId}`,
      description: "A CraterClaim digital lunar plot.",
    };
  }

  const title = `${plot.name ?? plot.id} — CraterClaim`;
  const description =
    plot.description ??
    `A ${plot.zone} digital lunar plot near ${plot.lunarFeature}.`;

  return {
    title: plot.name ?? `Plot ${plot.id}`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PlotPage({ params }: PlotPageProps) {
  const { plotId } = await params;
  const plot = await getPlot(plotId);

  if (plot?.status === "active") {
    return <PlotLanding plot={plot} />;
  }

  return <PlotClientFallback plotId={plotId} />;
}
