import type { Metadata } from "next";
import { FindLandingForm } from "@/components/account/FindLandingForm";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Find a landing",
  description: "Email yourself the links to CraterClaim landings bought with this address.",
  robots: { index: false, follow: false },
};

export default function FindPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">Landing</p>
          <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">Find a landing.</h1>
          <p className="mt-4 max-w-lg leading-relaxed text-lunar-silver">
            Use the email from checkout. We send the public page and a new private edit link. This
            replaces any older edit link for those plots.
          </p>
          <FindLandingForm />
        </div>
        <Footer />
      </main>
    </>
  );
}
