import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto max-w-xl flex-1 px-4 pb-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">404</p>
          <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">
            That landing is not on this Moon.
          </h1>
          <p className="mt-4 leading-relaxed text-lunar-silver">
            The page is missing, the plot id is wrong, or the reservation expired.
          </p>
          <Link
            href="/"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-8 inline-flex min-h-11 cursor-pointer bg-electric-white px-5 text-space hover:bg-electric-white/90",
            )}
          >
            Back to the Moon
          </Link>
        </div>
        <Footer />
      </main>
    </>
  );
}
