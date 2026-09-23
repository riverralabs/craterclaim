import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ClaimForm } from "@/components/claim/ClaimForm";

export const metadata: Metadata = {
  title: "Claim a plot",
  description: "Name your digital lunar plot and pay with Lemon Squeezy.",
  robots: { index: false, follow: false },
};

export default function ClaimPage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
          <ClaimForm />
        </div>
        <Footer />
      </main>
    </>
  );
}
