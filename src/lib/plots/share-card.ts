import { formatLatLng } from "@/lib/moon/coordinates";
import { formatUsd } from "@/lib/moon/pricing";
import { formatSocial } from "@/lib/plots/social";
import type { PlotRecord } from "@/types";

export const SHARE_CARD_SIZE = { width: 1200, height: 630 } as const;

export function formatClaimDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function shareCardModel(plot: PlotRecord) {
  const premium = plot.zone === "premium";
  const social = plot.socialHandle ? formatSocial(plot.socialHandle) : null;
  return {
    id: plot.id,
    name: (plot.name ?? "Untitled landing").toUpperCase(),
    premium,
    zoneLabel: premium ? "Premium zone" : "Standard zone",
    feature: plot.lunarFeature,
    size: `${plot.width} × ${plot.height} px`,
    coords: formatLatLng(plot.centerLatitude, plot.centerLongitude),
    value: formatUsd(plot.pricePaid ?? plot.quotedPrice),
    claimed: formatClaimDate(plot.claimDate ?? plot.createdAt),
    social,
    logoUrl: plot.logoUrl,
  };
}
