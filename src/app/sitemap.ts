import type { MetadataRoute } from "next";
import { listActivePlots } from "@/lib/plots/inventory";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const plots = await listActivePlots();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/how-it-works",
    "/leaderboard",
    "/recent",
    "/search",
    "/claim",
    "/guidelines",
    "/terms",
    "/privacy",
    "/refunds",
  ].map((path) => ({
    url: `${site}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "hourly" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  const plotRoutes: MetadataRoute.Sitemap = plots.map((plot) => ({
    url: `${site}/plot/${plot.id}`,
    lastModified: plot.claimDate ? new Date(plot.claimDate) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...plotRoutes];
}
