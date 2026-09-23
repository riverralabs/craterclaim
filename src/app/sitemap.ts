import type { MetadataRoute } from "next";
import { listPublicPlots } from "@/lib/plots/inventory";
import { siteOrigin } from "@/lib/seo/site";

export const revalidate = 3600;

function stamp(value?: string | null) {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteOrigin();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { path: "", changeFrequency: "daily", priority: 1 },
      { path: "/how-it-works", changeFrequency: "weekly", priority: 0.8 },
      { path: "/leaderboard", changeFrequency: "daily", priority: 0.7 },
      { path: "/recent", changeFrequency: "daily", priority: 0.7 },
      { path: "/search", changeFrequency: "weekly", priority: 0.4 },
      { path: "/guidelines", changeFrequency: "monthly", priority: 0.4 },
      { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
      { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
      { path: "/refunds", changeFrequency: "monthly", priority: 0.3 },
    ] as const
  ).map((route) => ({
    url: `${site}${route.path || "/"}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let plotRoutes: MetadataRoute.Sitemap = [];
  try {
    const plots = await listPublicPlots();
    plotRoutes = plots.map((plot) => ({
      url: `${site}/plot/${plot.id}`,
      lastModified: stamp(plot.claimDate ?? plot.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    plotRoutes = [];
  }

  return [...staticRoutes, ...plotRoutes];
}
