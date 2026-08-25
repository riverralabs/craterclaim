"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PlotLanding } from "@/components/plot/PlotLanding";
import { Button } from "@/components/ui/button";
import { readLocalPlots } from "@/lib/plots/local";
import type { PlotRecord } from "@/types";

export function PlotClientFallback({ plotId }: { plotId: string }) {
  const [plot, setPlot] = useState<PlotRecord | null | undefined>(undefined);

  useEffect(() => {
    const match = readLocalPlots().find((item) => item.id === plotId && item.status === "active");
    setPlot(match ?? null);
  }, [plotId]);

  if (plot === undefined) {
    return (
      <>
        <Navbar />
        <main className="min-h-dvh bg-space pt-24" />
      </>
    );
  }

  if (plot) return <PlotLanding plot={plot} />;

  return (
    <>
      <Navbar />
      <main className="flex min-h-dvh flex-col bg-space pt-24">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 pb-16">
          <p className="text-xs font-medium tracking-[0.22em] text-violet uppercase">
            Plot {plotId}
          </p>
          <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight">
            This landing was not found.
          </h1>
          <p className="mt-4 leading-relaxed text-lunar-silver">
            It may still be reserved, or it has not been claimed yet.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 min-h-11 w-fit cursor-pointer bg-electric-white text-space hover:bg-electric-white/90"
          >
            <Link href="/">Explore the Moon</Link>
          </Button>
        </div>
        <Footer />
      </main>
    </>
  );
}
