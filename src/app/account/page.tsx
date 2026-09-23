import type { Metadata } from "next";
import Link from "next/link";
import { FindLandingForm } from "@/components/account/FindLandingForm";
import { YourLandings } from "@/components/account/YourLandings";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Your landings",
  description: "CraterClaim landings from this browser.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">Landings</p>
          <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">Your landings.</h1>
          <p className="mt-4 max-w-lg leading-relaxed text-lunar-silver">
            Plots you claim in this browser stay listed here.{" "}
            <Link href="/find" className="text-gold">
              Email the links
            </Link>{" "}
            if you are on another device.
          </p>
          <YourLandings />
          <h2 className="font-heading mt-12 text-2xl font-semibold">On another device</h2>
          <FindLandingForm />
        </div>
        <Footer />
      </main>
    </>
  );
}
