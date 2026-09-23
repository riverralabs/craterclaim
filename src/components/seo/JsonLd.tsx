import { OPERATOR_EMAIL, OPERATOR_NAME } from "@/lib/legal/operator";
import { siteOrigin } from "@/lib/seo/site";

export function SiteJsonLd() {
  const site = siteOrigin();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "CraterClaim",
        legalName: OPERATOR_NAME,
        url: site,
        email: OPERATOR_EMAIL,
        logo: `${site}/icon.png`,
      },
      {
        "@type": "WebSite",
        name: "CraterClaim",
        url: site,
        description:
          "Claim a digital lunar plot on a public Moon map. Not physical land, and not advertising.",
        potentialAction: {
          "@type": "SearchAction",
          target: `${site}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
