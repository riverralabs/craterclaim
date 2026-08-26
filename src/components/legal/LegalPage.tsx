import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export function LegalPage({
  kicker,
  title,
  updated,
  children,
}: {
  kicker: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <article className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 sm:px-6">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">{kicker}</p>
          <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 font-mono text-[11px] tracking-[0.16em] text-lunar-silver uppercase">
            Last updated {updated}
          </p>
          <div className="legal-copy mt-8 space-y-4 text-sm leading-relaxed text-lunar-silver [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:text-electric-white [&_a]:text-electric-white [&_a]:underline">
            {children}
          </div>
        </article>
        <Footer />
      </main>
    </>
  );
}
