import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  const site = siteOrigin();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/account", "/login", "/claim", "/edit", "/find", "/monitoring"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
