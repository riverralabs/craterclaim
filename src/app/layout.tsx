import type { Metadata, Viewport } from "next";
import { Geist_Mono, Outfit, Syne } from "next/font/google";
import { Providers } from "@/components/providers";
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "CraterClaim — Claim your place on the Moon.",
    template: "%s · CraterClaim",
  },
  description:
    "Claim a digital lunar plot, put your startup, project, community, or name there, and leave your mark on a permanent public Moon map.",
  applicationName: "CraterClaim",
  keywords: ["CraterClaim", "Moon", "digital lunar plot", "lunar map"],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/brand/logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/brand/logo.png", sizes: "180x180" }],
  },
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
