import type { Metadata, Viewport } from "next";
import { Geist_Mono, Outfit, Syne } from "next/font/google";
import { Providers } from "@/components/providers";
import { SiteJsonLd } from "@/components/seo/JsonLd";
import { siteOrigin } from "@/lib/seo/site";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const site = siteOrigin();
const title = "CraterClaim — Claim your place on the Moon.";
const description =
  "Claim a digital lunar plot, put your startup, project, community, or name there, and leave your mark on a permanent public Moon map.";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: title,
    template: "%s · CraterClaim",
  },
  description,
  applicationName: "CraterClaim",
  keywords: ["CraterClaim", "Moon", "digital lunar plot", "lunar map"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site,
    siteName: "CraterClaim",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${outfit.variable} ${syne.variable} ${geistMono.variable} ${outfit.className}`}
    >
      <body className="min-h-dvh bg-space text-electric-white antialiased">
        <SiteJsonLd />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
