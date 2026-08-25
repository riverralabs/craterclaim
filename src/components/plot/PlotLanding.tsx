import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { SharePlotButton } from "@/components/plot/SharePlotButton";
import { formatLatLng } from "@/lib/moon/coordinates";
import { formatUsd } from "@/lib/moon/pricing";
import type { PlotRecord } from "@/types";

function formatClaimDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function websiteHref(url: string) {
  const parsed = new URL(url);
  if (!parsed.searchParams.has("ref")) {
    parsed.searchParams.set("ref", "craterclaim");
  }
  return parsed.toString();
}

export function PlotLanding({ plot }: { plot: PlotRecord }) {
  const sizeLabel = `${plot.width} × ${plot.height}`;

  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">
            Plot {plot.id}
          </p>
          <div className="mt-4 flex items-start gap-4">
            {plot.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={plot.logoUrl}
                alt={`${plot.name ?? plot.id} logo`}
                className="size-16 rounded-2xl border border-white/10 object-cover"
              />
            ) : null}
            <div>
              <h1 className="font-heading text-4xl font-bold tracking-tight">
                {plot.name ?? "Untitled landing"}
              </h1>
              <p className="mt-2 text-sm text-lunar-silver">
                {plot.zone === "premium" ? "Premium" : "Standard"} · {plot.lunarFeature}
              </p>
            </div>
          </div>

          {plot.description ? (
            <p className="mt-6 leading-relaxed text-lunar-silver">{plot.description}</p>
          ) : null}

          <dl className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-charcoal/70 p-4 text-sm sm:grid-cols-2">
            <Row label="Size" value={`${sizeLabel} px`} />
            <Row label="Pixels" value={plot.pixelCount.toLocaleString("en-US")} />
            <Row label="Coordinates" value={formatLatLng(plot.centerLatitude, plot.centerLongitude)} />
            <Row
              label="Claimed"
              value={formatClaimDate(plot.claimDate ?? plot.createdAt)}
            />
            <Row
              label="Price paid"
              value={formatUsd(plot.pricePaid ?? plot.quotedPrice)}
            />
            <Row label="Status" value="Active" />
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              asChild
              size="lg"
              className="min-h-11 cursor-pointer bg-electric-white text-space hover:bg-electric-white/90"
            >
              <Link href={`/?focus=${plot.id}`}>View on Moon</Link>
            </Button>
            {plot.websiteUrl ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-11 cursor-pointer border-white/15"
              >
                <a
                  href={websiteHref(plot.websiteUrl)}
                  target="_blank"
                  rel="noopener noreferrer nofollow sponsored"
                >
                  Visit landing site
                </a>
              </Button>
            ) : null}
            <SharePlotButton plotId={plot.id} name={plot.name ?? plot.id} />
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-lunar-silver">{label}</dt>
      <dd className="mt-1 text-electric-white">{value}</dd>
    </div>
  );
}
